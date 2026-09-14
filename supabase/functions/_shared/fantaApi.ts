const BASE_URL = "https://apileague.fantacalcio.it";
const APP_KEY = "ICiELOObd5DF5uJEATi77CRvHiiRuMU0";

const COMMON_HEADERS: Record<string, string> = {
  app_key: APP_KEY,
  "content-type": "application/json",
  accept: "application/json, text/plain, */*",
  origin: "https://leghe.fantacalcio.it",
  referer: "https://leghe.fantacalcio.it/",
  "user-agent": "fanta-reminder-supabase/1.0",
};

export type LeagueAuth = {
  id_squadra: number;
  jwt: string;
  divisione?: string;
};

export type LoginData = {
  leghe?: LeagueAuth[];
};

export type LineupInfoPlayer = {
  pid: number;
  plyr: string;
  role?: number | number[];
  status?: number;
  percent?: number;
  tname?: string;
};

export type TeamLineupDto = {
  mday: number;
  cmday: number;
  mdl?: string;
};

export type GetLineupResponse = {
  teamLineupDto: TeamLineupDto;
  lineUpInfo: LineupInfoPlayer[];
};

type FantaApiEnvelope<T> = {
  success?: boolean;
  data?: T;
  error_msgs?: unknown;
};

export class FantaApiError extends Error {
  status?: number;
  code?: string;
  apiMessage?: string;

  constructor(message: string, status?: number, code?: string, apiMessage?: string) {
    super(message);
    this.name = "FantaApiError";
    this.status = status;
    this.code = code;
    this.apiMessage = apiMessage;
  }
}

async function requestJson<T>(
  path: string,
  method: "GET" | "POST",
  body?: unknown,
  extraHeaders?: Record<string, string>,
): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      ...COMMON_HEADERS,
      ...(extraHeaders ?? {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  let parsed: T | null = null;
  let rawJson: unknown = null;
  try {
    rawJson = JSON.parse(text) as unknown;
    parsed = rawJson as T;
  } catch {
    if (!response.ok) {
      throw new FantaApiError(`HTTP ${response.status} on ${path}: ${text.slice(0, 300)}`, response.status);
    }
    throw new FantaApiError(`Non-JSON response on ${path}: ${text.slice(0, 250)}`, response.status);
  }

  if (!response.ok) {
    const rawObject = (rawJson ?? {}) as { code?: unknown; message?: unknown };
    const code = typeof rawObject.code === "string" ? rawObject.code : undefined;
    const apiMessage = typeof rawObject.message === "string" ? rawObject.message : undefined;
    throw new FantaApiError(
      `HTTP ${response.status} on ${path}: ${text.slice(0, 300)}`,
      response.status,
      code,
      apiMessage,
    );
  }
  return parsed as T;
}

export async function login(username: string, password: string): Promise<LoginData> {
  const envelope = await requestJson<FantaApiEnvelope<LoginData>>(
    "/onboarding/v1/login",
    "POST",
    { username, password },
  );
  if (!envelope.success || !envelope.data) {
    throw new FantaApiError(`Login failed: ${JSON.stringify(envelope.error_msgs ?? "unknown")}`, 401);
  }
  return envelope.data;
}

export function findLeague(loginData: LoginData, idSquadra: number): LeagueAuth {
  const league = (loginData.leghe ?? []).find((item) => item.id_squadra === idSquadra);
  if (!league) {
    throw new FantaApiError(`League not found for id_squadra ${idSquadra}`, 404);
  }
  return league;
}

export async function getLineup(jwt: string, idComp: number, division = "A"): Promise<GetLineupResponse> {
  return requestJson<GetLineupResponse>(
    `/gaming/v1/teamLineup/visualizza/${division}/${idComp}`,
    "GET",
    undefined,
    { authorization: `Bearer ${jwt}` },
  );
}

export async function saveLineup(jwt: string, division: string, payload: unknown): Promise<Record<string, unknown>> {
  return requestJson<Record<string, unknown>>(
    `/gaming/v1/teamLineup/${division}`,
    "POST",
    payload,
    { authorization: `Bearer ${jwt}` },
  );
}

export function isAuthorized(request: Request): boolean {
  const expectedKey = Deno.env.get("CLIENT_WRITE_KEY");
  if (!expectedKey) {
    return true;
  }
  return request.headers.get("x-client-key") === expectedKey;
}

export function corsHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-key",
  };
}

export function handleCorsPreflight(request: Request): Response | null {
  if (request.method !== "OPTIONS") {
    return null;
  }
  return new Response(null, {
    status: 204,
    headers: corsHeaders(),
  });
}

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: corsHeaders(),
  });
}
