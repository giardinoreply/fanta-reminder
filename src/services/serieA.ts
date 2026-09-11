import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const FOOTBALL_API_URL = "https://api.football-data.org/v4/competitions/SA/matches";
const DEFAULT_PROXY_URL = "http://localhost:8787/matches";
const MATCHDAYS_CACHE_KEY = "fanta_matchdays_cache_v1";
const MATCHDAYS_SYNC_INTERVAL_MS = 1000 * 60 * 60 * 24;

export type MatchdayInfo = {
  matchday: number;
  firstMatchAt: string;
  homeTeam: string;
  awayTeam: string;
};

export type MatchdaysSource = "api" | "fallback" | "cache";

export type MatchdaysSnapshot = {
  nextMatchday: MatchdayInfo | null;
  upcoming: MatchdayInfo[];
  source: MatchdaysSource;
  syncedAt: string;
};

type FootballApiMatch = {
  utcDate: string;
  status: string;
  matchday: number;
  homeTeam: { name: string };
  awayTeam: { name: string };
};

type FootballApiResponse = {
  matches: FootballApiMatch[];
};

type MatchdaysCache = {
  items: MatchdayInfo[];
  source: Exclude<MatchdaysSource, "cache">;
  syncedAt: string;
};

function getFootballDataApiKey(): string | undefined {
  const value = process.env.EXPO_PUBLIC_FOOTBALL_DATA_API_KEY;
  return value && value.length > 0 ? value : undefined;
}

function getProxyUrl(): string | undefined {
  const value = process.env.EXPO_PUBLIC_SERIEA_PROXY_URL;
  if (value && value.length > 0) {
    return value;
  }
  if (Platform.OS === "web") {
    return DEFAULT_PROXY_URL;
  }
  return undefined;
}

function fallbackMatchdays(): MatchdayInfo[] {
  const now = Date.now();
  return [
    {
      matchday: 1,
      firstMatchAt: new Date(now + 1000 * 60 * 60 * 48).toISOString(),
      homeTeam: "Milan",
      awayTeam: "Juventus",
    },
    {
      matchday: 2,
      firstMatchAt: new Date(now + 1000 * 60 * 60 * 24 * 7).toISOString(),
      homeTeam: "Inter",
      awayTeam: "Roma",
    },
  ];
}

function groupFirstMatchPerMatchday(matches: FootballApiMatch[]): MatchdayInfo[] {
  const future = matches
    .filter((m) => new Date(m.utcDate).getTime() > Date.now())
    .sort((a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime());

  const byMatchday = new Map<number, MatchdayInfo>();
  for (const match of future) {
    if (!byMatchday.has(match.matchday)) {
      byMatchday.set(match.matchday, {
        matchday: match.matchday,
        firstMatchAt: match.utcDate,
        homeTeam: match.homeTeam.name,
        awayTeam: match.awayTeam.name,
      });
    }
  }

  return Array.from(byMatchday.values()).sort((a, b) => new Date(a.firstMatchAt).getTime() - new Date(b.firstMatchAt).getTime());
}

async function loadMatchdaysCache(): Promise<MatchdaysCache | null> {
  const raw = await AsyncStorage.getItem(MATCHDAYS_CACHE_KEY);
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as Partial<MatchdaysCache>;
    if (!Array.isArray(parsed.items) || typeof parsed.syncedAt !== "string") {
      return null;
    }
    const source: Exclude<MatchdaysSource, "cache"> = parsed.source === "api" ? "api" : "fallback";
    return { items: parsed.items as MatchdayInfo[], source, syncedAt: parsed.syncedAt };
  } catch {
    return null;
  }
}

async function saveMatchdaysCache(payload: MatchdaysCache): Promise<void> {
  await AsyncStorage.setItem(MATCHDAYS_CACHE_KEY, JSON.stringify(payload));
}

function isCacheFresh(syncedAt: string): boolean {
  return Date.now() - new Date(syncedAt).getTime() < MATCHDAYS_SYNC_INTERVAL_MS;
}

async function fetchMatchdays(): Promise<{ items: MatchdayInfo[]; source: Exclude<MatchdaysSource, "cache"> }> {
  const apiKey = getFootballDataApiKey();
  const proxyUrl = getProxyUrl();
  const isWeb = Platform.OS === "web";

  try {
    if (!apiKey && !(isWeb && proxyUrl)) {
      return { items: fallbackMatchdays(), source: "fallback" };
    }

    const targetUrl = isWeb && proxyUrl ? proxyUrl : FOOTBALL_API_URL;
    const headers: Record<string, string> = {};
    if (!(isWeb && proxyUrl) && apiKey) {
      headers["X-Auth-Token"] = apiKey;
    }

    const res = await fetch(targetUrl, { headers });

    if (!res.ok) {
      return { items: fallbackMatchdays(), source: "fallback" };
    }

    const data = (await res.json()) as FootballApiResponse;
    const grouped = groupFirstMatchPerMatchday(data.matches ?? []);
    if (grouped.length > 0) {
      return { items: grouped, source: "api" };
    }
    return { items: fallbackMatchdays(), source: "fallback" };
  } catch {
    return { items: fallbackMatchdays(), source: "fallback" };
  }
}

export async function getMatchdaysSnapshot(limit = 10): Promise<MatchdaysSnapshot> {
  const cache = await loadMatchdaysCache();
  const hasApiKey = Boolean(getFootballDataApiKey());

  if (cache && isCacheFresh(cache.syncedAt) && !(cache.source === "fallback" && hasApiKey)) {
    const upcoming = cache.items.slice(0, limit);
    return {
      nextMatchday: upcoming[0] ?? null,
      upcoming,
      source: "cache",
      syncedAt: cache.syncedAt,
    };
  }

  const fetched = await fetchMatchdays();
  const nowIso = new Date().toISOString();

  if (fetched.source === "fallback" && cache && cache.items.length > 0) {
    const upcoming = cache.items.slice(0, limit);
    return {
      nextMatchday: upcoming[0] ?? null,
      upcoming,
      source: "cache",
      syncedAt: cache.syncedAt,
    };
  }

  await saveMatchdaysCache({ items: fetched.items, source: fetched.source, syncedAt: nowIso });
  const upcoming = fetched.items.slice(0, limit);
  return {
    nextMatchday: upcoming[0] ?? null,
    upcoming,
    source: fetched.source,
    syncedAt: nowIso,
  };
}

export async function getNextMatchday(): Promise<MatchdayInfo | null> {
  const snapshot = await getMatchdaysSnapshot(1);
  return snapshot.nextMatchday;
}

export async function listUpcomingMatchdays(limit = 10): Promise<MatchdayInfo[]> {
  const snapshot = await getMatchdaysSnapshot(limit);
  return snapshot.upcoming;
}
