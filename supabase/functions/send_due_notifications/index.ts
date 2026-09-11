// Placeholder function.
// Next step: query reminders due, send push through Expo endpoint, save delivery into `notifications_sent`.
export default async function handler() {
  return new Response(JSON.stringify({ ok: true, message: "send_due_notifications placeholder" }), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
}
