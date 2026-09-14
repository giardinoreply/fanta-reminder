import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

type FootballApiMatch = {
  utcDate: string;
  matchday: number;
  homeTeam?: { name?: string };
  awayTeam?: { name?: string };
};

type FootballApiResponse = {
  matches?: FootballApiMatch[];
};

const DEFAULT_API_URL = "https://api.football-data.org/v4/competitions/SA/matches";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function groupFirstMatchPerMatchday(matches: FootballApiMatch[]) {
  const grouped = new Map<number, { matchday: number; first_match_at: string; first_home_team: string; first_away_team: string }>();
  const sorted = [...matches]
    .filter((match) => Number.isFinite(match.matchday) && typeof match.utcDate === "string")
    .sort((a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime());

  for (const match of sorted) {
    if (grouped.has(match.matchday)) {
      continue;
    }
    grouped.set(match.matchday, {
      matchday: match.matchday,
      first_match_at: match.utcDate,
      first_home_team: match.homeTeam?.name ?? "TBD",
      first_away_team: match.awayTeam?.name ?? "TBD",
    });
  }

  return [...grouped.values()];
}

Deno.serve(async () => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const footballApiKey = Deno.env.get("FOOTBALL_DATA_API_KEY");
    const apiUrl = Deno.env.get("SERIEA_API_URL") ?? DEFAULT_API_URL;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return jsonResponse({ ok: false, error: "Missing Supabase env vars." }, 500);
    }
    if (!footballApiKey) {
      return jsonResponse({ ok: false, error: "Missing FOOTBALL_DATA_API_KEY." }, 500);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const upstream = await fetch(apiUrl, {
      headers: { "X-Auth-Token": footballApiKey },
    });
    if (!upstream.ok) {
      const text = await upstream.text();
      return jsonResponse({ ok: false, error: "Football API error", status: upstream.status, detail: text.slice(0, 300) }, 502);
    }

    const payload = (await upstream.json()) as FootballApiResponse;
    const grouped = groupFirstMatchPerMatchday(payload.matches ?? []);
    if (grouped.length === 0) {
      return jsonResponse({ ok: true, synced: 0, message: "No matchdays found." });
    }

    const nowIso = new Date().toISOString();
    const rows = grouped.map((row) => ({
      ...row,
      updated_at: nowIso,
    }));

    const { error } = await supabase.from("matchdays").upsert(rows, { onConflict: "matchday" });
    if (error) {
      return jsonResponse({ ok: false, error: "DB upsert failed", detail: error.message }, 500);
    }

    return jsonResponse({
      ok: true,
      synced: rows.length,
      firstMatchday: rows[0]?.matchday ?? null,
      lastMatchday: rows[rows.length - 1]?.matchday ?? null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return jsonResponse({ ok: false, error: "Unexpected error", detail: message }, 500);
  }
});
