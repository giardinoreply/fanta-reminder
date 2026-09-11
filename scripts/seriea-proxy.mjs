import { createServer } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const PORT = 8787;
const API_URL = "https://api.football-data.org/v4/competitions/SA/matches";

function readEnvValue(key) {
  const envPath = join(process.cwd(), ".env");
  if (!existsSync(envPath)) {
    return undefined;
  }
  const content = readFileSync(envPath, "utf8");
  const lines = content.split(/\r?\n/);
  const line = lines.find((entry) => entry.startsWith(`${key}=`));
  if (!line) {
    return undefined;
  }
  const value = line.slice(key.length + 1).trim();
  return value.length > 0 ? value : undefined;
}

const apiKey = readEnvValue("EXPO_PUBLIC_FOOTBALL_DATA_API_KEY");

const server = createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method !== "GET" || req.url !== "/matches") {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not found" }));
    return;
  }

  if (!apiKey) {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Missing EXPO_PUBLIC_FOOTBALL_DATA_API_KEY in .env" }));
    return;
  }

  try {
    const upstream = await fetch(API_URL, {
      headers: {
        "X-Auth-Token": apiKey,
      },
    });

    const body = await upstream.text();
    res.writeHead(upstream.status, { "Content-Type": "application/json" });
    res.end(body);
  } catch (error) {
    res.writeHead(502, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Upstream request failed" }));
  }
});

server.listen(PORT, () => {
  process.stdout.write(`Serie A proxy listening on http://localhost:${PORT}/matches\n`);
});
