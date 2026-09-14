import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

type UpsertBody = {
  installationId?: string;
  expoPushToken?: string;
  timezone?: string;
  notificationsEnabled?: boolean;
  minutesBefore?: number;
  leagueLockMinutes?: number;
  repeatIntervalMinutes?: number;
  maxExtraNotifications?: number;
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function readNumber(value: unknown, fallback: number, min = 0): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.max(min, Math.trunc(parsed));
}

function isAuthorized(request: Request): boolean {
  const expectedKey = Deno.env.get("CLIENT_WRITE_KEY");
  if (!expectedKey) {
    return true;
  }
  const incomingKey = request.headers.get("x-client-key");
  return incomingKey === expectedKey;
}

Deno.serve(async (request) => {
  try {
    if (request.method !== "POST") {
      return jsonResponse({ ok: false, error: "Method not allowed" }, 405);
    }
    if (!isAuthorized(request)) {
      return jsonResponse({ ok: false, error: "Unauthorized" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return jsonResponse({ ok: false, error: "Missing Supabase env vars." }, 500);
    }

    const body = (await request.json()) as UpsertBody;
    const installationId = body.installationId?.trim();
    const expoPushToken = body.expoPushToken?.trim();
    const timezone = body.timezone?.trim() || "Europe/Rome";
    if (!installationId || !expoPushToken) {
      return jsonResponse({ ok: false, error: "installationId and expoPushToken are required." }, 400);
    }

    const notificationsEnabled = body.notificationsEnabled ?? true;
    const minutesBefore = readNumber(body.minutesBefore, 120, 0);
    const leagueLockMinutes = readNumber(body.leagueLockMinutes, 15, 0);
    const repeatIntervalMinutes = readNumber(body.repeatIntervalMinutes, 3, 1);
    const maxExtraNotifications = readNumber(body.maxExtraNotifications, 0, 0);

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const nowIso = new Date().toISOString();
    const { data: device, error: deviceError } = await supabase
      .from("devices")
      .upsert(
        {
          installation_id: installationId,
          expo_push_token: expoPushToken,
          timezone,
          notifications_enabled: notificationsEnabled,
          updated_at: nowIso,
        },
        { onConflict: "installation_id" },
      )
      .select("id")
      .single();

    if (deviceError || !device?.id) {
      return jsonResponse({ ok: false, error: "Device upsert failed", detail: deviceError?.message }, 500);
    }

    const { error: prefError } = await supabase.from("preferences").upsert(
      {
        device_id: device.id,
        minutes_before: minutesBefore,
        league_lock_minutes: leagueLockMinutes,
        repeat_interval_minutes: repeatIntervalMinutes,
        max_extra_notifications: maxExtraNotifications,
        updated_at: nowIso,
      },
      { onConflict: "device_id" },
    );

    if (prefError) {
      return jsonResponse({ ok: false, error: "Preferences upsert failed", detail: prefError.message }, 500);
    }

    return jsonResponse({
      ok: true,
      deviceId: device.id,
      preferences: {
        minutesBefore,
        leagueLockMinutes,
        repeatIntervalMinutes,
        maxExtraNotifications,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return jsonResponse({ ok: false, error: "Unexpected error", detail: message }, 500);
  }
});
