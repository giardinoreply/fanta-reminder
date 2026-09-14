import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

type DismissBody = {
  installationId?: string;
  matchday?: number;
  dismissed?: boolean;
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
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

    const body = (await request.json()) as DismissBody;
    const installationId = body.installationId?.trim();
    const matchday = Number(body.matchday);
    const dismissed = body.dismissed ?? true;
    if (!installationId || !Number.isFinite(matchday) || matchday <= 0) {
      return jsonResponse({ ok: false, error: "installationId and a valid matchday are required." }, 400);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: device, error: deviceError } = await supabase
      .from("devices")
      .select("id")
      .eq("installation_id", installationId)
      .maybeSingle();

    if (deviceError) {
      return jsonResponse({ ok: false, error: "Device lookup failed", detail: deviceError.message }, 500);
    }
    if (!device?.id) {
      return jsonResponse({ ok: false, error: "Device not found." }, 404);
    }

    if (dismissed) {
      const { error } = await supabase.from("matchday_dismissals").upsert(
        {
          device_id: device.id,
          matchday: Math.trunc(matchday),
        },
        { onConflict: "device_id,matchday" },
      );
      if (error) {
        return jsonResponse({ ok: false, error: "Dismissal upsert failed", detail: error.message }, 500);
      }
      return jsonResponse({ ok: true, dismissed: true });
    }

    const { error } = await supabase
      .from("matchday_dismissals")
      .delete()
      .eq("device_id", device.id)
      .eq("matchday", Math.trunc(matchday));
    if (error) {
      return jsonResponse({ ok: false, error: "Dismissal delete failed", detail: error.message }, 500);
    }

    return jsonResponse({ ok: true, dismissed: false });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return jsonResponse({ ok: false, error: "Unexpected error", detail: message }, 500);
  }
});
