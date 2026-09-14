import type { LineupInfoPlayer } from "./fantaApi.ts";

type RoleCode = "P" | "D" | "C" | "A";

const ROLE_ORDER: Record<RoleCode, number> = {
  P: 0,
  D: 1,
  C: 2,
  A: 3,
};

const ROLE_BY_ID: Record<number, RoleCode> = {
  1: "P",
  2: "D",
  3: "C",
  4: "A",
};

const ALLOWED_MODULI: Record<string, [number, number, number]> = {
  "343": [3, 4, 3],
  "352": [3, 5, 2],
  "433": [4, 3, 3],
  "442": [4, 4, 2],
  "451": [4, 5, 1],
  "532": [5, 3, 2],
  "541": [5, 4, 1],
};

const MAX_PANCHINA = 12;

export type LineupSpec = {
  modulo: string;
  titolari: string[];
  panchina: string[];
  capitano?: string[];
};

class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

function normalizeModulo(value: string): string {
  return String(value ?? "").replaceAll("-", "").trim();
}

function getRole(player: LineupInfoPlayer): RoleCode {
  const raw = Array.isArray(player.role) ? player.role[0] : player.role;
  const mapped = raw ? ROLE_BY_ID[Number(raw)] : undefined;
  if (!mapped) {
    throw new ValidationError(`Ruolo non riconosciuto per ${player.plyr}`);
  }
  return mapped;
}

function resolvePlayerByName(roster: LineupInfoPlayer[], rawName: string): { id: number; name: string; role: RoleCode } {
  const target = rawName.trim();
  const exact = roster.find((player) => player.plyr === target);
  const resolved = exact ?? roster.find((player) => player.plyr.toLowerCase() === target.toLowerCase());
  if (!resolved) {
    throw new ValidationError(`Giocatore non trovato nella rosa: ${rawName}`);
  }
  return {
    id: resolved.pid,
    name: resolved.plyr,
    role: getRole(resolved),
  };
}

function findDuplicates(names: string[]): string[] {
  const seen = new Set<string>();
  const dup = new Set<string>();
  for (const name of names) {
    if (seen.has(name)) {
      dup.add(name);
    }
    seen.add(name);
  }
  return [...dup];
}

export function buildLineupPayload(params: {
  spec: LineupSpec;
  roster: LineupInfoPlayer[];
  idComp: number;
  idSquadra: number;
  mday: number;
  cmday: number;
}) {
  const { spec, roster, idComp, idSquadra, mday, cmday } = params;
  const modulo = normalizeModulo(spec.modulo);
  const reparto = ALLOWED_MODULI[modulo];
  if (!reparto) {
    throw new ValidationError(`Modulo non ammesso: ${spec.modulo}`);
  }

  const titolari = Array.isArray(spec.titolari) ? spec.titolari : [];
  const panchina = Array.isArray(spec.panchina) ? spec.panchina : [];
  const capitano = Array.isArray(spec.capitano) ? spec.capitano : [];

  if (titolari.length !== 11) {
    throw new ValidationError(`Servono 11 titolari, ricevuti ${titolari.length}`);
  }
  if (panchina.length > MAX_PANCHINA) {
    throw new ValidationError(`Panchina troppo lunga: ${panchina.length} > ${MAX_PANCHINA}`);
  }

  const duplicates = findDuplicates([...titolari, ...panchina]);
  if (duplicates.length > 0) {
    throw new ValidationError(`Giocatori duplicati: ${duplicates.join(", ")}`);
  }

  const resolvedStarters = titolari.map((name) => resolvePlayerByName(roster, name));
  const expectedCount: Record<RoleCode, number> = {
    P: 1,
    D: reparto[0],
    C: reparto[1],
    A: reparto[2],
  };
  const foundCount: Record<RoleCode, number> = { P: 0, D: 0, C: 0, A: 0 };
  for (const player of resolvedStarters) {
    foundCount[player.role] += 1;
  }
  if (
    foundCount.P !== expectedCount.P ||
    foundCount.D !== expectedCount.D ||
    foundCount.C !== expectedCount.C ||
    foundCount.A !== expectedCount.A
  ) {
    throw new ValidationError(
      `Reparti non coerenti col modulo ${modulo}: attesi P1 D${expectedCount.D} C${expectedCount.C} A${expectedCount.A}, trovati P${foundCount.P} D${foundCount.D} C${foundCount.C} A${foundCount.A}`,
    );
  }

  for (const captainName of capitano) {
    if (!titolari.includes(captainName)) {
      throw new ValidationError(`Il capitano ${captainName} non è tra i titolari`);
    }
  }

  const starts = [...resolvedStarters]
    .sort((a, b) => ROLE_ORDER[a.role] - ROLE_ORDER[b.role])
    .map((player) => player.id);

  const bench = panchina.map((name) => resolvePlayerByName(roster, name).id);
  const capt = capitano.map((name) => resolvePlayerByName(roster, name).id);

  return {
    starts,
    bench,
    capt,
    mdl: modulo,
    idcomp: idComp,
    mday,
    cmday,
    tid: idSquadra,
    allComp: false,
    visb: true,
    swtcA: 0,
    swtcB: 0,
    swtc: 0,
    swtcMdl: "",
  };
}
