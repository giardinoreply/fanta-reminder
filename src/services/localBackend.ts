import { getMatchdaysSnapshot, type MatchdayInfo, type MatchdaysSource } from "./serieA";
import { getPreferences, type UserPreferences } from "../storage/preferences";
import { scheduleMatchdayReminders } from "./notifications";

export type LocalBackendSnapshot = {
  preferences: UserPreferences;
  nextMatchday: MatchdayInfo | null;
  upcoming: MatchdayInfo[];
  source: MatchdaysSource;
  syncedAt: string;
  scheduledReminders: number;
};

export async function bootstrapLocalBackend(limit = 8): Promise<LocalBackendSnapshot> {
  const preferences = await getPreferences();
  const snapshot = await getMatchdaysSnapshot(limit);
  const scheduled = await scheduleMatchdayReminders(snapshot.upcoming, preferences);

  return {
    preferences,
    nextMatchday: snapshot.nextMatchday,
    upcoming: snapshot.upcoming,
    source: snapshot.source,
    syncedAt: snapshot.syncedAt,
    scheduledReminders: scheduled.scheduledNotifications,
  };
}
