import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import type { MatchdayInfo } from "./serieA";
import type { UserPreferences } from "../storage/preferences";

const SCHEDULED_REMINDERS_KEY = "fanta_scheduled_reminders_v1";
const DONE_REMINDER_GROUPS_KEY = "fanta_done_reminder_groups_v1";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export type PushPermissionResult = {
  granted: boolean;
  expoPushToken: string | null;
};

type StoredReminder = {
  id: string;
  matchday: number;
  reminderAt: string;
  reminderGroupId: string;
};

type ScheduleResult = {
  scheduledNotifications: number;
  scheduledGroups: number;
};

async function loadStoredReminders(): Promise<StoredReminder[]> {
  const raw = await AsyncStorage.getItem(SCHEDULED_REMINDERS_KEY);
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw) as StoredReminder[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function saveStoredReminders(reminders: StoredReminder[]): Promise<void> {
  await AsyncStorage.setItem(SCHEDULED_REMINDERS_KEY, JSON.stringify(reminders));
}

async function loadDoneReminderGroups(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(DONE_REMINDER_GROUPS_KEY);
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function saveDoneReminderGroups(groups: string[]): Promise<void> {
  await AsyncStorage.setItem(DONE_REMINDER_GROUPS_KEY, JSON.stringify(groups));
}

export async function getNotificationPermissionStatus(): Promise<Notifications.PermissionStatus> {
  const permission = await Notifications.getPermissionsAsync();
  return permission.status;
}

export async function requestPushPermission(): Promise<PushPermissionResult> {
  if (!Device.isDevice) {
    return { granted: false, expoPushToken: null };
  }

  const permissions = await Notifications.getPermissionsAsync();
  let finalStatus = permissions.status;

  if (finalStatus !== "granted") {
    const request = await Notifications.requestPermissionsAsync();
    finalStatus = request.status;
  }

  if (finalStatus !== "granted") {
    return { granted: false, expoPushToken: null };
  }

  const token = await Notifications.getExpoPushTokenAsync();
  return { granted: true, expoPushToken: token.data };
}

function getReminderTimestamp(matchday: MatchdayInfo, preferences: UserPreferences): number {
  const lockOffsetMs = preferences.leagueLockMinutes * 60 * 1000;
  const beforeOffsetMs = preferences.minutesBefore * 60 * 1000;
  return new Date(matchday.firstMatchAt).getTime() - lockOffsetMs - beforeOffsetMs;
}

export function buildReminderGroupId(matchday: MatchdayInfo): string {
  return `md-${matchday.matchday}-${matchday.firstMatchAt}`;
}

async function cancelStoredScheduledReminders(): Promise<void> {
  const reminders = await loadStoredReminders();
  await Promise.all(
    reminders.map(async (item) => {
      try {
        await Notifications.cancelScheduledNotificationAsync(item.id);
      } catch {
        return;
      }
    }),
  );
  await saveStoredReminders([]);
}

export async function markReminderGroupDone(reminderGroupId: string): Promise<void> {
  const groups = await loadDoneReminderGroups();
  if (!groups.includes(reminderGroupId)) {
    groups.push(reminderGroupId);
    await saveDoneReminderGroups(groups);
  }

  const reminders = await loadStoredReminders();
  const toCancel = reminders.filter((item) => item.reminderGroupId === reminderGroupId);
  await Promise.all(
    toCancel.map(async (item) => {
      try {
        await Notifications.cancelScheduledNotificationAsync(item.id);
      } catch {
        return;
      }
    }),
  );
  await saveStoredReminders(reminders.filter((item) => item.reminderGroupId !== reminderGroupId));
}

function getRepeats(preferences: UserPreferences): number[] {
  const repeatMinutes = Math.max(1, preferences.repeatIntervalMinutes);
  const maxRepeats = Math.max(0, preferences.maxExtraNotifications);
  const repeats: number[] = [];
  for (let idx = 0; idx <= maxRepeats; idx += 1) {
    repeats.push(idx * repeatMinutes);
  }
  return repeats;
}

export async function scheduleMatchdayReminders(
  matchdays: MatchdayInfo[],
  preferences: UserPreferences,
): Promise<ScheduleResult> {
  try {
    const permissionStatus = await getNotificationPermissionStatus();
    if (permissionStatus !== "granted") {
      return { scheduledNotifications: 0, scheduledGroups: 0 };
    }

    const doneGroups = await loadDoneReminderGroups();
    await cancelStoredScheduledReminders();

    const now = Date.now();
    const repeatOffsetsMinutes = getRepeats(preferences);
    const futureGroups = matchdays
      .map((matchday) => ({ matchday, reminderTs: getReminderTimestamp(matchday, preferences) }))
      .filter((entry) => entry.reminderTs > now + 60 * 1000)
      .filter((entry) => !doneGroups.includes(buildReminderGroupId(entry.matchday)));

    const scheduled: StoredReminder[] = [];

    for (const item of futureGroups) {
      const reminderGroupId = buildReminderGroupId(item.matchday);

      for (const offsetMinutes of repeatOffsetsMinutes) {
        const reminderTs = item.reminderTs + offsetMinutes * 60 * 1000;
        if (reminderTs <= now + 60 * 1000) {
          continue;
        }

        const triggerSeconds = Math.floor((reminderTs - now) / 1000);
        const id = await Notifications.scheduleNotificationAsync({
          content: {
            title: "Fanta Deadline",
            body: `Giornata ${item.matchday.matchday}: Ricordati la formazione, cretino.`,
            data: {
              matchday: item.matchday.matchday,
              reminderGroupId,
            },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: triggerSeconds,
          },
        });

        scheduled.push({
          id,
          matchday: item.matchday.matchday,
          reminderAt: new Date(reminderTs).toISOString(),
          reminderGroupId,
        });
      }
    }

    await saveStoredReminders(scheduled);
    const uniqueGroups = new Set(scheduled.map((item) => item.reminderGroupId));
    return { scheduledNotifications: scheduled.length, scheduledGroups: uniqueGroups.size };
  } catch {
    return { scheduledNotifications: 0, scheduledGroups: 0 };
  }
}

export async function clearTestNotifications(): Promise<number> {
  try {
    const all = await Notifications.getAllScheduledNotificationsAsync();
    const testNotifications = all.filter((item) => {
      const data = item.content.data as { isTest?: boolean } | undefined;
      return data?.isTest === true;
    });

    await Promise.all(
      testNotifications.map(async (item) => {
        try {
          await Notifications.cancelScheduledNotificationAsync(item.identifier);
        } catch {
          return;
        }
      }),
    );

    return testNotifications.length;
  } catch {
    return 0;
  }
}

export async function scheduleImmediateTestNotifications(preferences: UserPreferences): Promise<number> {
  try {
    const permissionStatus = await getNotificationPermissionStatus();
    if (permissionStatus !== "granted") {
      return 0;
    }

    await clearTestNotifications();

    const baseDelaySeconds = 5;
    const quickRepeatSeconds = 10;
    const repeats = Math.max(0, preferences.maxExtraNotifications);
    const totalNotifications = repeats + 1;

    for (let idx = 0; idx < totalNotifications; idx += 1) {
      const seconds = baseDelaySeconds + idx * quickRepeatSeconds;
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Fanta Deadline (TEST)",
          body:
            repeats > 0 ? `Test notifica ${idx + 1}/${totalNotifications}` : "Test notifica singola",
          data: {
            isTest: true,
            repeatIndex: idx,
          },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds,
        },
      });
    }

    return totalNotifications;
  } catch {
    return 0;
  }
}
