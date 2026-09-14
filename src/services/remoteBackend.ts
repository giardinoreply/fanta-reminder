type RemotePreferences = {
  minutesBefore: number;
  leagueLockMinutes: number;
  repeatIntervalMinutes: number;
  maxExtraNotifications: number;
};

type UpsertDevicePayload = {
  installationId: string;
  expoPushToken: string;
  timezone: string;
  notificationsEnabled: boolean;
  preferences: RemotePreferences;
};

const LOG_TAG = "[remoteBackend]";

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

function getAnonKey(): string | null {
  const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (!key || key.length === 0) {
    return null;
  }
  return key;
}

function getClientWriteKey(): string | null {
  const key = process.env.EXPO_PUBLIC_CLIENT_WRITE_KEY;
  if (!key || key.length === 0) {
    return null;
  }
  return key;
}

function getHeaders(): Record<string, string> | null {
  const anonKey = getAnonKey();
  if (!anonKey) {
    return null;
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${anonKey}`,
    apikey: anonKey,
  };
  const clientWriteKey = getClientWriteKey();
  if (clientWriteKey) {
    headers["x-client-key"] = clientWriteKey;
  }
  return headers;
}

async function postFunction(path: string, body: unknown): Promise<boolean> {
  const baseUrl = getFunctionsBaseUrl();
  const headers = getHeaders();
  if (!baseUrl || !headers) {
    return false;
  }

  try {
    const response = await fetch(`${baseUrl}/${path}`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const text = await response.text();
      console.warn(`${LOG_TAG} ${path} failed`, { status: response.status, detail: text.slice(0, 200) });
      return false;
    }
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`${LOG_TAG} ${path} exception`, { message });
    return false;
  }
}

export function isRemoteBackendConfigured(): boolean {
  return Boolean(getFunctionsBaseUrl() && getHeaders());
}

export async function upsertRemoteDevicePreferences(payload: UpsertDevicePayload): Promise<boolean> {
  return postFunction("upsert_device_preferences", {
    installationId: payload.installationId,
    expoPushToken: payload.expoPushToken,
    timezone: payload.timezone,
    notificationsEnabled: payload.notificationsEnabled,
    minutesBefore: payload.preferences.minutesBefore,
    leagueLockMinutes: payload.preferences.leagueLockMinutes,
    repeatIntervalMinutes: payload.preferences.repeatIntervalMinutes,
    maxExtraNotifications: payload.preferences.maxExtraNotifications,
  });
}

export async function setRemoteMatchdayDismissal(installationId: string, matchday: number, dismissed = true): Promise<boolean> {
  return postFunction("set_matchday_dismissal", {
    installationId,
    matchday,
    dismissed,
  });
}
