import * as BackgroundFetch from "expo-background-fetch";
import * as TaskManager from "expo-task-manager";
import { getPreferences } from "../storage/preferences";
import { getMatchdaysSnapshot } from "./serieA";
import { scheduleMatchdayReminders } from "./notifications";

const DAILY_SYNC_TASK = "daily-calendar-sync-task";
const ONE_DAY_SECONDS = 60 * 60 * 24;

if (!TaskManager.isTaskDefined(DAILY_SYNC_TASK)) {
  TaskManager.defineTask(DAILY_SYNC_TASK, async () => {
    try {
      const preferences = await getPreferences();
      const snapshot = await getMatchdaysSnapshot(8);
      const scheduled = await scheduleMatchdayReminders(snapshot.upcoming, preferences);

      if (scheduled.scheduledNotifications > 0 || snapshot.upcoming.length > 0) {
        return BackgroundFetch.BackgroundFetchResult.NewData;
      }

      return BackgroundFetch.BackgroundFetchResult.NoData;
    } catch {
      return BackgroundFetch.BackgroundFetchResult.Failed;
    }
  });
}

export async function registerDailyBackgroundSync(): Promise<boolean> {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(DAILY_SYNC_TASK);
    if (isRegistered) {
      return true;
    }

    await BackgroundFetch.registerTaskAsync(DAILY_SYNC_TASK, {
      minimumInterval: ONE_DAY_SECONDS,
      stopOnTerminate: false,
      startOnBoot: true,
    });

    return true;
  } catch {
    return false;
  }
}
