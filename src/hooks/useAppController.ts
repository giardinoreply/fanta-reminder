import { useEffect, useMemo, useState } from "react";
import { bootstrapLocalBackend } from "../services/localBackend";
import { registerDailyBackgroundSync } from "../services/backgroundSync";
import { savePreferences, type UserPreferences } from "../storage/preferences";
import { type MatchdayInfo, type MatchdaysSource } from "../services/serieA";
import {
  buildReminderGroupId,
  clearTestNotifications,
  markReminderGroupDone,
  requestPushPermission,
  scheduleImmediateTestNotifications,
  scheduleMatchdayReminders,
} from "../services/notifications";
import type { ScreenKey } from "../types/app";

const DEFAULT_PREFERENCES: UserPreferences = {
  minutesBefore: 120,
  leagueLockMinutes: 15,
  repeatIntervalMinutes: 3,
  maxExtraNotifications: 0,
};

export function useAppController() {
  const [screen, setScreen] = useState<ScreenKey>("home");
  const [nextMatchday, setNextMatchday] = useState<MatchdayInfo | null>(null);
  const [calendar, setCalendar] = useState<MatchdayInfo[]>([]);
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inputMinutes, setInputMinutes] = useState("120");
  const [inputLockMinutes, setInputLockMinutes] = useState("15");
  const [inputRepeatMinutes, setInputRepeatMinutes] = useState("3");
  const [inputMaxNotifications, setInputMaxNotifications] = useState("0");
  const [notificationState, setNotificationState] = useState("non richiesto");
  const [dataSource, setDataSource] = useState<MatchdaysSource>("fallback");
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [testState, setTestState] = useState("nessun test inviato");

  useEffect(() => {
    async function boot() {
      setLoading(true);
      setError(null);
      try {
        const bootData = await bootstrapLocalBackend(8);
        setPreferences(bootData.preferences);
        setInputMinutes(String(bootData.preferences.minutesBefore));
        setInputLockMinutes(String(bootData.preferences.leagueLockMinutes));
        setInputRepeatMinutes(String(bootData.preferences.repeatIntervalMinutes));
        setInputMaxNotifications(String(bootData.preferences.maxExtraNotifications));
        setNextMatchday(bootData.nextMatchday);
        setCalendar(bootData.upcoming);
        setDataSource(bootData.source);
        setLastSyncAt(bootData.syncedAt);
        if (bootData.scheduledReminders > 0) {
          setNotificationState(`abilitato (${bootData.scheduledReminders} notifiche pianificate)`);
        }
      } catch {
        setError("Errore caricamento dati.");
      } finally {
        setLoading(false);
      }
    }

    void boot();
  }, []);

  useEffect(() => {
    void registerDailyBackgroundSync();
  }, []);

  const notificationTime = useMemo(() => {
    if (!nextMatchday) {
      return null;
    }
    const matchTime = new Date(nextMatchday.firstMatchAt).getTime();
    const lockMs = preferences.leagueLockMinutes * 60 * 1000;
    const beforeMs = preferences.minutesBefore * 60 * 1000;
    return new Date(matchTime - lockMs - beforeMs).toISOString();
  }, [nextMatchday, preferences.leagueLockMinutes, preferences.minutesBefore]);

  async function onSaveSettings() {
    const minutesBefore = Number.parseInt(inputMinutes, 10);
    const leagueLockMinutes = Number.parseInt(inputLockMinutes, 10);
    const repeatIntervalMinutes = Number.parseInt(inputRepeatMinutes, 10);
    const maxExtraNotifications = Number.parseInt(inputMaxNotifications, 10);

    if (Number.isNaN(minutesBefore) || minutesBefore < 0 || Number.isNaN(leagueLockMinutes) || leagueLockMinutes < 0) {
      setError("Valori non validi.");
      return;
    }
    if (
      Number.isNaN(repeatIntervalMinutes) ||
      repeatIntervalMinutes < 1 ||
      Number.isNaN(maxExtraNotifications) ||
      maxExtraNotifications < 0
    ) {
      setError("Valori notifiche non validi.");
      return;
    }

    const next = { minutesBefore, leagueLockMinutes, repeatIntervalMinutes, maxExtraNotifications };
    await savePreferences(next);
    setPreferences(next);
    const scheduled = await scheduleMatchdayReminders(calendar, next);
    if (scheduled.scheduledNotifications > 0) {
      setNotificationState(`abilitato (${scheduled.scheduledNotifications} notifiche pianificate)`);
    } else {
      setNotificationState("abilitato (nessuna futura)");
    }
    setError(null);
  }

  async function onEnableNotifications() {
    const result = await requestPushPermission();
    if (result.granted) {
      const scheduled = await scheduleMatchdayReminders(calendar, preferences);
      if (scheduled.scheduledNotifications > 0) {
        setNotificationState(`abilitato (${scheduled.scheduledNotifications} notifiche pianificate)`);
      } else {
        setNotificationState("abilitato");
      }
    } else {
      setNotificationState("negato");
    }
  }

  async function onDoneReminderGroup() {
    if (!nextMatchday) {
      return;
    }
    await markReminderGroupDone(buildReminderGroupId(nextMatchday));
    const scheduled = await scheduleMatchdayReminders(calendar, preferences);
    if (scheduled.scheduledNotifications > 0) {
      setNotificationState(`abilitato (${scheduled.scheduledNotifications} notifiche pianificate)`);
    } else {
      setNotificationState("abilitato (nessuna futura)");
    }
  }

  async function onRunTestNow() {
    const result = await requestPushPermission();
    if (!result.granted) {
      setTestState("permesso notifiche negato");
      return;
    }
    const scheduledCount = await scheduleImmediateTestNotifications(preferences);
    if (scheduledCount > 0) {
      setTestState(`${scheduledCount} notifiche test pianificate (inizio tra ~5s)`);
    } else {
      setTestState("impossibile pianificare test");
    }
  }

  async function onClearTests() {
    const removed = await clearTestNotifications();
    setTestState(`test rimossi: ${removed}`);
  }

  return {
    screen,
    setScreen,
    nextMatchday,
    calendar,
    preferences,
    loading,
    error,
    inputMinutes,
    setInputMinutes,
    inputLockMinutes,
    setInputLockMinutes,
    inputRepeatMinutes,
    setInputRepeatMinutes,
    inputMaxNotifications,
    setInputMaxNotifications,
    notificationState,
    dataSource,
    lastSyncAt,
    testState,
    notificationTime,
    onSaveSettings,
    onEnableNotifications,
    onDoneReminderGroup,
    onRunTestNow,
    onClearTests,
  };
}
