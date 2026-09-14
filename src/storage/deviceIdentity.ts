import AsyncStorage from "@react-native-async-storage/async-storage";

const INSTALLATION_ID_KEY = "fanta_installation_id_v1";

function generateInstallationId(): string {
  return `inst_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export async function getOrCreateInstallationId(): Promise<string> {
  const existing = await AsyncStorage.getItem(INSTALLATION_ID_KEY);
  if (existing && existing.length > 0) {
    return existing;
  }

  const next = generateInstallationId();
  await AsyncStorage.setItem(INSTALLATION_ID_KEY, next);
  return next;
}
