import { buildLineupPayload, type LineupSpec } from "../_shared/lineupPayload.ts";
import {
  FantaApiError,
  findLeague,
  getLineup,
  handleCorsPreflight,
  isAuthorized,
  jsonResponse,
  login,
  saveLineup,
} from "../_shared/fantaApi.ts";

type RequestBody = {
  username?: string;
  password?: string;
  idSquadra?: number;
  idComp?: number;
  division?: string;
  spec?: LineupSpec;
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
    const spec = body.spec;

    if (!username || !password || !Number.isFinite(idSquadra) || !Number.isFinite(idComp) || !spec) {
      return jsonResponse({ ok: false, error: "username, password, idSquadra, idComp, spec are required." }, 400);
    }

    const normalizedIdSquadra = Math.trunc(idSquadra);
    const normalizedIdComp = Math.trunc(idComp);

    const loginData = await login(username, password);
    const league = findLeague(loginData, normalizedIdSquadra);
    const division = body.division?.trim() || league.divisione || "A";

    const preLineup = await getLineup(league.jwt, normalizedIdComp, division);
    const payload = buildLineupPayload({
      spec,
      roster: preLineup.lineUpInfo ?? [],
      idComp: normalizedIdComp,
      idSquadra: normalizedIdSquadra,
      mday: preLineup.teamLineupDto.mday,
      cmday: preLineup.teamLineupDto.cmday,
    });

    const saveResponse = await saveLineup(league.jwt, division, payload);
    const postLineup = await getLineup(league.jwt, normalizedIdComp, division);
    const sentModulo = String(payload.mdl);
    const currentModulo = String(postLineup.teamLineupDto?.mdl ?? "");
    const verified = currentModulo === sentModulo;

    return jsonResponse({
      ok: true,
      verified,
      sentModulo,
      currentModulo,
      saveResponse,
      postLineup,
    });
  } catch (error) {
    if (error instanceof FantaApiError) {
      if (error.code === "LUP007") {
        return jsonResponse(
          {
            ok: false,
            code: error.code,
            error: "Deadline superata: invio formazione non piu consentito.",
          },
          409,
        );
      }

      return jsonResponse(
        {
          ok: false,
          code: error.code ?? null,
          error: error.apiMessage ?? error.message,
        },
        error.status ?? 500,
      );
    }

    const message = error instanceof Error ? error.message : String(error);
    return jsonResponse({ ok: false, error: message }, 500);
  }
});
