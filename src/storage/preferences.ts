import AsyncStorage from "@react-native-async-storage/async-storage";

const PREFERENCES_KEY = "fanta_reminder_preferences";

export type UserPreferences = {
  minutesBefore: number;
  leagueLockMinutes: number;
  repeatIntervalMinutes: number;
  maxExtraNotifications: number;
};

const DEFAULT_PREFERENCES: UserPreferences = {
  minutesBefore: 120,
  leagueLockMinutes: 15,
  repeatIntervalMinutes: 3,
  maxExtraNotifications: 0,
};

export async function getPreferences(): Promise<UserPreferences> {
  const raw = await AsyncStorage.getItem(PREFERENCES_KEY);
  if (!raw) {
    return DEFAULT_PREFERENCES;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<UserPreferences>;
    return {
      minutesBefore: typeof parsed.minutesBefore === "number" ? parsed.minutesBefore : DEFAULT_PREFERENCES.minutesBefore,
      leagueLockMinutes:
        typeof parsed.leagueLockMinutes === "number" ? parsed.leagueLockMinutes : DEFAULT_PREFERENCES.leagueLockMinutes,
      repeatIntervalMinutes:
        typeof parsed.repeatIntervalMinutes === "number"
          ? parsed.repeatIntervalMinutes
          : typeof (parsed as { alarmRepeatMinutes?: number }).alarmRepeatMinutes === "number"
            ? (parsed as { alarmRepeatMinutes: number }).alarmRepeatMinutes
            : DEFAULT_PREFERENCES.repeatIntervalMinutes,
      maxExtraNotifications:
        typeof parsed.maxExtraNotifications === "number"
          ? parsed.maxExtraNotifications
          : typeof (parsed as { alarmMaxRepeats?: number }).alarmMaxRepeats === "number"
            ? (parsed as { alarmMaxRepeats: number }).alarmMaxRepeats
            : DEFAULT_PREFERENCES.maxExtraNotifications,
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export async function savePreferences(preferences: UserPreferences): Promise<void> {
  await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
}
