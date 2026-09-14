import AsyncStorage from "@react-native-async-storage/async-storage";

const LINEUP_CREDENTIALS_KEY = "fanta_reminder_lineup_credentials";

export type StoredLineupCredentials = {
  username: string;
  password: string;
  idSquadra: string;
  idComp: string;
  division: string;
};

const DEFAULT_LINEUP_CREDENTIALS: StoredLineupCredentials = {
  username: "",
  password: "",
  idSquadra: "",
  idComp: "",
  division: "A",
};

export async function getStoredLineupCredentials(): Promise<StoredLineupCredentials> {
  const raw = await AsyncStorage.getItem(LINEUP_CREDENTIALS_KEY);
  if (!raw) {
    return DEFAULT_LINEUP_CREDENTIALS;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<StoredLineupCredentials>;
    return {
      username: typeof parsed.username === "string" ? parsed.username : DEFAULT_LINEUP_CREDENTIALS.username,
      password: typeof parsed.password === "string" ? parsed.password : DEFAULT_LINEUP_CREDENTIALS.password,
      idSquadra: typeof parsed.idSquadra === "string" ? parsed.idSquadra : DEFAULT_LINEUP_CREDENTIALS.idSquadra,
      idComp: typeof parsed.idComp === "string" ? parsed.idComp : DEFAULT_LINEUP_CREDENTIALS.idComp,
      division:
        typeof parsed.division === "string" && parsed.division.trim().length > 0
          ? parsed.division
          : DEFAULT_LINEUP_CREDENTIALS.division,
    };
  } catch {
    return DEFAULT_LINEUP_CREDENTIALS;
  }
}

export async function saveStoredLineupCredentials(value: StoredLineupCredentials): Promise<void> {
  await AsyncStorage.setItem(LINEUP_CREDENTIALS_KEY, JSON.stringify(value));
}

