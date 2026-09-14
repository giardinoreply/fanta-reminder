import { findLeague, getLineup, handleCorsPreflight, isAuthorized, jsonResponse, login } from "../_shared/fantaApi.ts";

type RequestBody = {
  username?: string;
  password?: string;
  idSquadra?: number;
  idComp?: number;
  division?: string;
};

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
    const mday = Number(lineup.teamLineupDto?.mday);
    const cmday = Number(lineup.teamLineupDto?.cmday);
    const hasValidDays = Number.isFinite(mday) && Number.isFinite(cmday);
    const isLineupLocked = hasValidDays ? cmday >= mday : false;

    return jsonResponse({
      ok: true,
      mday: hasValidDays ? mday : lineup.teamLineupDto?.mday ?? null,
      cmday: hasValidDays ? cmday : lineup.teamLineupDto?.cmday ?? null,
      currentModulo: lineup.teamLineupDto?.mdl ?? null,
      rosterSize: Array.isArray(lineup.lineUpInfo) ? lineup.lineUpInfo.length : 0,
      isLineupLocked,
      lineup,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return jsonResponse({ ok: false, error: message }, 500);
  }
});
