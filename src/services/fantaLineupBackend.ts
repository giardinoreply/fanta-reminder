type FantaCredentials = {
  username: string;
  password: string;
  idSquadra: number;
  idComp: number;
  division?: string;
};

export type FantaRole = "P" | "D" | "C" | "A" | "?";

export type FantaLineupPlayer = {
  pid: number;
  plyr: string;
  role: number | number[] | null;
  tname?: string;
  percent?: number;
  status?: number;
  teamH?: string;
  teamA?: string;
  hoaw?: number;
};

export type FantaGetStatusResponse = {
  ok: boolean;
  mday: number | null;
  cmday: number | null;
  currentModulo: string | null;
  rosterSize: number;
  isLineupLocked?: boolean;
  lineup?: {
    lineUpInfo?: FantaLineupPlayer[];
  };
};

export type FantaSubmitResponse = {
  ok: boolean;
  verified: boolean;
  sentModulo: string;
  currentModulo: string;
};

export type FantaSuggestResponse = {
  ok: boolean;
  spec: FantaLineupSpec;
  summary?: {
    modulo: string;
    startersCount: number;
    benchCount: number;
    startersByRole: Record<Exclude<FantaRole, "?">, string[]>;
  };
};

export type FantaLineupSpec = {
  modulo: string;
  titolari: string[];
  panchina: string[];
  capitano?: string[];
};

export const ALLOWED_MODULI = ["343", "352", "433", "442", "451", "532", "541"] as const;

export class FantaFunctionError extends Error {
  status: number;
  code?: string | null;

  constructor(message: string, status: number, code?: string | null) {
    super(message);
    this.name = "FantaFunctionError";
    this.status = status;
    this.code = code;
  }
}

export function normalizeFantaRole(value: number | number[] | null | undefined): FantaRole {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === 1) {
    return "P";
  }
  if (raw === 2) {
    return "D";
  }
  if (raw === 3) {
    return "C";
  }
  if (raw === 4) {
    return "A";
  }
  return "?";
}

function getFunctionsBaseUrl(): string | null {
  const explicit = process.env.EXPO_PUBLIC_SUPABASE_FUNCTIONS_BASE_URL;
  if (explicit && explicit.length > 0) {
    return explicit;
  }
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl || supabaseUrl.length === 0) {
    return null;
  }
  return `${supabaseUrl.replace(/\/$/, "")}/functions/v1`;
}

function getHeaders(): Record<string, string> | null {
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (!anonKey || anonKey.length === 0) {
    return null;
  }
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${anonKey}`,
    apikey: anonKey,
  };
  const clientWriteKey = process.env.EXPO_PUBLIC_CLIENT_WRITE_KEY;
  if (clientWriteKey && clientWriteKey.length > 0) {
    headers["x-client-key"] = clientWriteKey;
  }
  return headers;
}

async function callFunction<T>(name: string, body: unknown, simpleCors = false): Promise<T> {
  const baseUrl = getFunctionsBaseUrl();
  const headers = getHeaders();
  if (!baseUrl) {
    throw new Error("Supabase functions non configurate.");
  }

  const requestHeaders = simpleCors
    ? ({
        "Content-Type": "text/plain",
      } as Record<string, string>)
    : headers;

  if (!requestHeaders) {
    throw new Error("Supabase headers non configurati.");
  }

  const response = await fetch(`${baseUrl}/${name}`, {
    method: "POST",
    headers: requestHeaders,
    body: JSON.stringify(body),
  });
  const text = await response.text();
  let parsed: unknown = null;
  try {
    parsed = JSON.parse(text) as unknown;
  } catch {
    parsed = null;
  }

  if (!response.ok) {
    const payload = (parsed ?? {}) as { error?: unknown; code?: unknown };
    const apiMessage = typeof payload.error === "string" ? payload.error : `${name} failed (${response.status})`;
    const apiCode = typeof payload.code === "string" ? payload.code : null;
    throw new FantaFunctionError(apiMessage, response.status, apiCode);
  }
  if (parsed === null) {
    throw new Error(`${name} returned invalid JSON.`);
  }
  return parsed as T;
}

export async function fetchFantaStatus(credentials: FantaCredentials): Promise<FantaGetStatusResponse> {
  return callFunction("fanta_get_status", credentials, true);
}

export async function submitFantaLineup(credentials: FantaCredentials, spec: FantaLineupSpec): Promise<FantaSubmitResponse> {
  return callFunction("fanta_submit_lineup", {
    ...credentials,
    spec,
  }, true);
}

export async function suggestFantaLineup(
  credentials: FantaCredentials,
  modulo?: string,
): Promise<FantaSuggestResponse> {
  return callFunction("fanta_suggest_lineup", {
    ...credentials,
    modulo,
  }, true);
}
