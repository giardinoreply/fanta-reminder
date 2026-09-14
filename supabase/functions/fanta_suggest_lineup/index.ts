import { findLeague, getLineup, handleCorsPreflight, isAuthorized, jsonResponse, login, type LineupInfoPlayer } from "../_shared/fantaApi.ts";

type RequestBody = {
  username?: string;
  password?: string;
  idSquadra?: number;
  idComp?: number;
  division?: string;
  modulo?: string;
};

type RoleCode = "P" | "D" | "C" | "A";

const ROLE_BY_ID: Record<number, RoleCode> = {
  1: "P",
  2: "D",
  3: "C",
  4: "A",
};

const MODULO_REQUIRED: Record<string, Record<RoleCode, number>> = {
  "343": { P: 1, D: 3, C: 4, A: 3 },
  "352": { P: 1, D: 3, C: 5, A: 2 },
  "433": { P: 1, D: 4, C: 3, A: 3 },
  "442": { P: 1, D: 4, C: 4, A: 2 },
  "451": { P: 1, D: 4, C: 5, A: 1 },
  "532": { P: 1, D: 5, C: 3, A: 2 },
  "541": { P: 1, D: 5, C: 4, A: 1 },
};

const FALLBACK_MODULO = "433";
const MAX_BENCH = 12;
const BENCH_TARGET_BY_ROLE: Record<RoleCode, number> = {
  P: 1,
  D: 3,
  C: 4,
  A: 3,
};

function normalizeModulo(value: unknown): string {
  const normalized = String(value ?? "").replaceAll("-", "").trim();
  if (MODULO_REQUIRED[normalized]) {
    return normalized;
  }
  return FALLBACK_MODULO;
}

function getRole(player: LineupInfoPlayer): RoleCode | null {
  const raw = Array.isArray(player.role) ? player.role[0] : player.role;
  const mapped = raw ? ROLE_BY_ID[Number(raw)] : undefined;
  return mapped ?? null;
}

function getAvailabilityScore(player: LineupInfoPlayer): number {
  const percent = Number(player.percent);
  const base = Number.isFinite(percent) ? percent : 50;
  const unavailablePenalty = player.status !== undefined && player.status !== 1 ? -1000 : 0;
  return base + unavailablePenalty;
}

function sortPlayers(players: LineupInfoPlayer[]): LineupInfoPlayer[] {
  return [...players].sort((a, b) => {
    const scoreDiff = getAvailabilityScore(b) - getAvailabilityScore(a);
    if (scoreDiff !== 0) {
      return scoreDiff;
    }
    return String(a.plyr).localeCompare(String(b.plyr));
  });
}

Deno.serve(async (request) => {
  try {
    const preflight = handleCorsPreflight(request);
    if (preflight) {
      return preflight;
    }

    if (request.method !== "POST") {
      return jsonResponse({ ok: false, error: "Method not allowed" }, 405);
    }
    if (!isAuthorized(request)) {
      return jsonResponse({ ok: false, error: "Unauthorized" }, 401);
    }

    const body = (await request.json()) as RequestBody;
    const username = body.username?.trim();
    const password = body.password?.trim();
    const idSquadra = Number(body.idSquadra);
    const idComp = Number(body.idComp);

    if (!username || !password || !Number.isFinite(idSquadra) || !Number.isFinite(idComp)) {
      return jsonResponse({ ok: false, error: "username, password, idSquadra, idComp are required." }, 400);
    }

    const loginData = await login(username, password);
    const league = findLeague(loginData, Math.trunc(idSquadra));
    const division = body.division?.trim() || league.divisione || "A";
    const lineup = await getLineup(league.jwt, Math.trunc(idComp), division);

    const preferredModulo = normalizeModulo(body.modulo ?? lineup.teamLineupDto?.mdl);
    const required = MODULO_REQUIRED[preferredModulo];
    const roster = Array.isArray(lineup.lineUpInfo) ? lineup.lineUpInfo : [];

    const byRole: Record<RoleCode, LineupInfoPlayer[]> = { P: [], D: [], C: [], A: [] };
    for (const player of roster) {
      const role = getRole(player);
      if (role) {
        byRole[role].push(player);
      }
    }

    const starters: LineupInfoPlayer[] = [];
    const startersByRole: Record<RoleCode, string[]> = { P: [], D: [], C: [], A: [] };
    const usedNames = new Set<string>();

    for (const role of ["P", "D", "C", "A"] as const) {
      const selected = sortPlayers(byRole[role]).slice(0, required[role]);
      for (const player of selected) {
        if (usedNames.has(player.plyr)) {
          continue;
        }
        usedNames.add(player.plyr);
        starters.push(player);
        startersByRole[role].push(player.plyr);
      }
    }

    const remainingByRole: Record<RoleCode, LineupInfoPlayer[]> = {
      P: sortPlayers(byRole.P.filter((player) => !usedNames.has(player.plyr))),
      D: sortPlayers(byRole.D.filter((player) => !usedNames.has(player.plyr))),
      C: sortPlayers(byRole.C.filter((player) => !usedNames.has(player.plyr))),
      A: sortPlayers(byRole.A.filter((player) => !usedNames.has(player.plyr))),
    };

    const bench: LineupInfoPlayer[] = [];
    const benchNames = new Set<string>();

    for (const role of ["P", "D", "C", "A"] as const) {
      const target = BENCH_TARGET_BY_ROLE[role];
      const pool = remainingByRole[role];
      for (const player of pool) {
        if (bench.length >= MAX_BENCH) {
          break;
        }
        if (benchNames.has(player.plyr)) {
          continue;
        }
        if (bench.filter((item) => getRole(item) === role).length >= target) {
          break;
        }
        bench.push(player);
        benchNames.add(player.plyr);
      }
    }

    if (bench.length < MAX_BENCH) {
      const fallbackPool = sortPlayers(
        roster.filter((player) => !usedNames.has(player.plyr) && !benchNames.has(player.plyr)),
      );
      for (const player of fallbackPool) {
        if (bench.length >= MAX_BENCH) {
          break;
        }
        bench.push(player);
        benchNames.add(player.plyr);
      }
    }

    return jsonResponse({
      ok: true,
      spec: {
        modulo: preferredModulo,
        titolari: starters.map((player) => player.plyr),
        panchina: bench.map((player) => player.plyr),
        capitano: [],
      },
      summary: {
        modulo: preferredModulo,
        startersCount: starters.length,
        benchCount: bench.length,
        startersByRole,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return jsonResponse({ ok: false, error: message }, 500);
  }
});
