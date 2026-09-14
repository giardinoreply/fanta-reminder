import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

type MatchdayRow = {
  matchday: number;
  first_match_at: string;
  first_home_team: string;
  first_away_team: string;
};

type PreferencesRow = {
  minutes_before: number;
  league_lock_minutes: number;
  repeat_interval_minutes: number;
  max_extra_notifications: number;
};

type DeviceRow = {
  id: string;
  expo_push_token: string;
  timezone: string;
  notifications_enabled: boolean;
  preferences: PreferencesRow | PreferencesRow[] | null;
};

type ReminderCandidate = {
  deviceId: string;
  expoPushToken: string;
  matchday: number;
  reminderAtIso: string;
  title: string;
  body: string;
};

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function normalizePreferences(value: DeviceRow["preferences"]): PreferencesRow {
  if (Array.isArray(value) && value.length > 0) {
    return value[0] as PreferencesRow;
  }
  if (value && !Array.isArray(value)) {
    return value as PreferencesRow;
  }
  return {
    minutes_before: 120,
    league_lock_minutes: 15,
    repeat_interval_minutes: 3,
    max_extra_notifications: 0,
  };
}

function getReminderDates(matchday: MatchdayRow, preferences: PreferencesRow): Date[] {
  const matchTime = new Date(matchday.first_match_at).getTime();
  const lockOffsetMs = Math.max(0, preferences.league_lock_minutes) * 60 * 1000;
  const beforeOffsetMs = Math.max(0, preferences.minutes_before) * 60 * 1000;
  const baseTs = matchTime - lockOffsetMs - beforeOffsetMs;
  const repeatMinutes = Math.max(1, preferences.repeat_interval_minutes);
  const maxExtra = Math.max(0, preferences.max_extra_notifications);

  const reminders: Date[] = [];
  for (let idx = 0; idx <= maxExtra; idx += 1) {
    reminders.push(new Date(baseTs + idx * repeatMinutes * 60 * 1000));
  }
  return reminders;
}

async function sendExpoPush(message: { to: string; title: string; body: string; data: Record<string, unknown> }) {
  const response = await fetch(EXPO_PUSH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(message),
  });

  const text = await response.text();
  if (!response.ok) {
    return { ok: false, detail: `HTTP ${response.status}: ${text.slice(0, 300)}` };
  }

  try {
    const payload = JSON.parse(text) as { data?: { status?: string; message?: string } };
    if (payload?.data?.status === "ok") {
      return { ok: true };
    }
    return { ok: false, detail: payload?.data?.message ?? "Unknown Expo response" };
  } catch {
    return { ok: false, detail: `Invalid JSON response: ${text.slice(0, 300)}` };
  }
}

Deno.serve(async () => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return jsonResponse({ ok: false, error: "Missing Supabase env vars." }, 500);
    }

    const lookbackSeconds = Number.parseInt(Deno.env.get("REMINDER_LOOKBACK_SECONDS") ?? "300", 10);
    const now = new Date();
    const windowStart = new Date(now.getTime() - Math.max(60, lookbackSeconds) * 1000);
    const recentMatchdaysStart = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const [{ data: devices, error: devicesError }, { data: matchdays, error: matchdaysError }] = await Promise.all([
      supabase
        .from("devices")
        .select("id, expo_push_token, timezone, notifications_enabled, preferences(minutes_before, league_lock_minutes, repeat_interval_minutes, max_extra_notifications)")
        .eq("notifications_enabled", true),
      supabase
        .from("matchdays")
        .select("matchday, first_match_at, first_home_team, first_away_team")
        .gte("first_match_at", recentMatchdaysStart)
        .order("first_match_at", { ascending: true }),
    ]);

    if (devicesError) {
      return jsonResponse({ ok: false, error: "Failed reading devices", detail: devicesError.message }, 500);
    }
    if (matchdaysError) {
      return jsonResponse({ ok: false, error: "Failed reading matchdays", detail: matchdaysError.message }, 500);
    }

    const activeDevices = (devices ?? []) as DeviceRow[];
    const upcomingMatchdays = (matchdays ?? []) as MatchdayRow[];
    if (activeDevices.length === 0 || upcomingMatchdays.length === 0) {
      return jsonResponse({ ok: true, sent: 0, skipped: 0, reason: "No active devices or matchdays." });
    }

    const deviceIds = activeDevices.map((device) => device.id);
    const matchdayNumbers = upcomingMatchdays.map((matchday) => matchday.matchday);
    const { data: dismissals, error: dismissalsError } = await supabase
      .from("matchday_dismissals")
      .select("device_id, matchday")
      .in("device_id", deviceIds)
      .in("matchday", matchdayNumbers);

    if (dismissalsError) {
      return jsonResponse({ ok: false, error: "Failed reading dismissals", detail: dismissalsError.message }, 500);
    }

    const dismissedSet = new Set(
      (dismissals ?? []).map((item) => `${item.device_id}:${item.matchday}`),
    );

    const dueCandidates: ReminderCandidate[] = [];
    for (const device of activeDevices) {
      const preferences = normalizePreferences(device.preferences);

      for (const matchday of upcomingMatchdays) {
        if (dismissedSet.has(`${device.id}:${matchday.matchday}`)) {
          continue;
        }

        const reminderDates = getReminderDates(matchday, preferences);
        for (const reminderDate of reminderDates) {
          if (reminderDate <= windowStart || reminderDate > now) {
            continue;
          }

          dueCandidates.push({
            deviceId: device.id,
            expoPushToken: device.expo_push_token,
            matchday: matchday.matchday,
            reminderAtIso: reminderDate.toISOString(),
            title: "Fanta Deadline",
            body: `Giornata ${matchday.matchday}: ${matchday.first_home_team}-${matchday.first_away_team}. Ricordati la formazione.`,
          });
        }
      }
    }

    let sent = 0;
    let skipped = 0;
    const failures: Array<{ deviceId: string; matchday: number; detail: string }> = [];

    for (const candidate of dueCandidates) {
      const { data: inserted, error: insertError } = await supabase
        .from("notifications_sent")
        .insert({
          device_id: candidate.deviceId,
          matchday: candidate.matchday,
          reminder_at: candidate.reminderAtIso,
        })
        .select("id")
        .single();

      if (insertError) {
        skipped += 1;
        continue;
      }

      const pushResult = await sendExpoPush({
        to: candidate.expoPushToken,
        title: candidate.title,
        body: candidate.body,
        data: {
          matchday: candidate.matchday,
          reminderAt: candidate.reminderAtIso,
        },
      });

      if (pushResult.ok) {
        sent += 1;
        continue;
      }

      failures.push({
        deviceId: candidate.deviceId,
        matchday: candidate.matchday,
        detail: pushResult.detail,
      });
      skipped += 1;

      if (inserted?.id) {
        await supabase.from("notifications_sent").delete().eq("id", inserted.id);
      }
    }

    return jsonResponse({
      ok: true,
      now: now.toISOString(),
      windowStart: windowStart.toISOString(),
      candidates: dueCandidates.length,
      sent,
      skipped,
      failures: failures.slice(0, 20),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return jsonResponse({ ok: false, error: "Unexpected error", detail: message }, 500);
  }
});
