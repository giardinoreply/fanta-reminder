// Placeholder function.
// Next step: fetch Serie A fixtures from football-data.org and upsert first match per matchday into `matchdays`.
export default async function handler() {
  return new Response(JSON.stringify({ ok: true, message: "sync_serie_a_matches placeholder" }), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
}
