import { useEffect, useMemo, useRef, useState } from "react";
import { bootstrapLocalBackend } from "../services/localBackend";
import { registerDailyBackgroundSync } from "../services/backgroundSync";
import { savePreferences, type UserPreferences } from "../storage/preferences";
import { getStoredLineupCredentials, saveStoredLineupCredentials } from "../storage/lineupCredentials";
import { type MatchdayInfo, type MatchdaysSource } from "../services/serieA";
import { getOrCreateInstallationId } from "../storage/deviceIdentity";
import { isRemoteBackendConfigured, setRemoteMatchdayDismissal, upsertRemoteDevicePreferences } from "../services/remoteBackend";
import {
  ALLOWED_MODULI,
  FantaFunctionError,
  fetchFantaStatus,
  normalizeFantaRole,
  suggestFantaLineup,
  submitFantaLineup,
  type FantaLineupPlayer,
  type FantaLineupSpec,
  type FantaRole,
} from "../services/fantaLineupBackend";
import {
  buildReminderGroupId,
  clearTestNotifications,
  getExpoPushTokenSafe,
  getNotificationPermissionStatus,
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

const MODULO_REQUIRED: Record<string, Record<Exclude<FantaRole, "?">, number>> = {
  "343": { P: 1, D: 3, C: 4, A: 3 },
  "352": { P: 1, D: 3, C: 5, A: 2 },
  "433": { P: 1, D: 4, C: 3, A: 3 },
  "442": { P: 1, D: 4, C: 4, A: 2 },
  "451": { P: 1, D: 4, C: 5, A: 1 },
  "532": { P: 1, D: 5, C: 3, A: 2 },
  "541": { P: 1, D: 5, C: 4, A: 1 },
};

type LineupAssignment = "none" | "starter" | "bench";
type LineupDayState = "unknown" | "open" | "locked";

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
  const [notificationsPermissionGranted, setNotificationsPermissionGranted] = useState(false);
  const [dataSource, setDataSource] = useState<MatchdaysSource>("fallback");
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [testState, setTestState] = useState("nessun test inviato");
  const [showSavedFeedback, setShowSavedFeedback] = useState(false);
  const [installationId, setInstallationId] = useState<string | null>(null);
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [lineupUsername, setLineupUsername] = useState("");
  const [lineupPassword, setLineupPassword] = useState("");
  const [lineupIdSquadra, setLineupIdSquadra] = useState("");
  const [lineupIdComp, setLineupIdComp] = useState("");
  const [lineupDivision, setLineupDivision] = useState("A");
  const [lineupModulo, setLineupModulo] = useState<(typeof ALLOWED_MODULI)[number]>("433");
  const [lineupPlayers, setLineupPlayers] = useState<FantaLineupPlayer[]>([]);
  const [lineupAssignments, setLineupAssignments] = useState<Record<string, LineupAssignment>>({});
  const [lineupLocked, setLineupLocked] = useState(false);
  const [lineupDayState, setLineupDayState] = useState<LineupDayState>("unknown");
  const [lineupFetchError, setLineupFetchError] = useState("");
  const [lineupState, setLineupState] = useState("");
  const [lineupBusy, setLineupBusy] = useState(false);
  const [lineupCredentialsHydrated, setLineupCredentialsHydrated] = useState(false);
  const saveFeedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function syncRemoteSettings(
    token: string | null,
    notificationsEnabled: boolean,
    nextPreferences: UserPreferences,
    forcedInstallationId?: string,
  ): Promise<void> {
    const currentInstallationId = forcedInstallationId ?? installationId;
    if (!isRemoteBackendConfigured() || !currentInstallationId || !token) {
      return;
    }

    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Rome";
    await upsertRemoteDevicePreferences({
      installationId: currentInstallationId,
      expoPushToken: token,
      timezone,
      notificationsEnabled,
      preferences: nextPreferences,
    });
  }

  useEffect(() => {
    async function boot() {
      setLoading(true);
      setError(null);
      try {
        const bootInstallationId = await getOrCreateInstallationId();
        setInstallationId(bootInstallationId);
        const bootData = await bootstrapLocalBackend(8);
        const storedLineupCredentials = await getStoredLineupCredentials();
        setPreferences(bootData.preferences);
        setInputMinutes(String(bootData.preferences.minutesBefore));
        setInputLockMinutes(String(bootData.preferences.leagueLockMinutes));
        setInputRepeatMinutes(String(bootData.preferences.repeatIntervalMinutes));
        setInputMaxNotifications(String(bootData.preferences.maxExtraNotifications));
        setLineupUsername(storedLineupCredentials.username);
        setLineupPassword(storedLineupCredentials.password);
        setLineupIdSquadra(storedLineupCredentials.idSquadra);
        setLineupIdComp(storedLineupCredentials.idComp);
        setLineupDivision(storedLineupCredentials.division);
        setLineupCredentialsHydrated(true);
        setNextMatchday(bootData.nextMatchday);
        setCalendar(bootData.upcoming);
        setDataSource(bootData.source);
        setLastSyncAt(bootData.syncedAt);
        const permissionStatus = await getNotificationPermissionStatus();
        const granted = permissionStatus === "granted";
        setNotificationsPermissionGranted(granted);
        if (!granted) {
          setNotificationState("permesso notifiche non concesso");
        } else if (bootData.scheduledReminders > 0) {
          setNotificationState(`abilitato (${bootData.scheduledReminders} notifiche pianificate)`);
        } else {
          setNotificationState("permesso concesso (nessuna futura)");
        }

        if (granted) {
          const token = await getExpoPushTokenSafe();
          setExpoPushToken(token);
          await syncRemoteSettings(token, true, bootData.preferences, bootInstallationId);
        }
      } catch {
        setError("Errore caricamento dati.");
      } finally {
        setLineupCredentialsHydrated(true);
        setLoading(false);
      }
    }

    void boot();
  }, []);

  useEffect(() => {
    void registerDailyBackgroundSync();
  }, []);

  useEffect(() => {
    if (!lineupCredentialsHydrated) {
      return;
    }
    void saveStoredLineupCredentials({
      username: lineupUsername,
      password: lineupPassword,
      idSquadra: lineupIdSquadra,
      idComp: lineupIdComp,
      division: lineupDivision,
    });
  }, [lineupCredentialsHydrated, lineupDivision, lineupIdComp, lineupIdSquadra, lineupPassword, lineupUsername]);

  useEffect(() => {
    return () => {
      if (saveFeedbackTimeoutRef.current) {
        clearTimeout(saveFeedbackTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!notificationsPermissionGranted) {
      return;
    }

    async function rescheduleReminders() {
      const scheduled = await scheduleMatchdayReminders(calendar, preferences);
      if (scheduled.scheduledNotifications > 0) {
        setNotificationState(`abilitato (${scheduled.scheduledNotifications} notifiche pianificate)`);
      } else {
        setNotificationState("permesso concesso (nessuna futura)");
      }
    }

    void rescheduleReminders();
  }, [calendar, notificationsPermissionGranted, preferences]);

  const notificationTime = useMemo(() => {
    if (!nextMatchday) {
      return null;
    }
    const matchTime = new Date(nextMatchday.firstMatchAt).getTime();
    const lockMs = preferences.leagueLockMinutes * 60 * 1000;
    const beforeMs = preferences.minutesBefore * 60 * 1000;
    return new Date(matchTime - lockMs - beforeMs).toISOString();
  }, [nextMatchday, preferences.leagueLockMinutes, preferences.minutesBefore]);

  const isSaveDisabled = useMemo(() => {
    const minutesBefore = Number.parseInt(inputMinutes, 10);
    const leagueLockMinutes = Number.parseInt(inputLockMinutes, 10);
    const repeatIntervalMinutes = Number.parseInt(inputRepeatMinutes, 10);
    const maxExtraNotifications = Number.parseInt(inputMaxNotifications, 10);

    if (
      Number.isNaN(minutesBefore) ||
      Number.isNaN(leagueLockMinutes) ||
      Number.isNaN(repeatIntervalMinutes) ||
      Number.isNaN(maxExtraNotifications)
    ) {
      return true;
    }

    return (
      minutesBefore === preferences.minutesBefore &&
      leagueLockMinutes === preferences.leagueLockMinutes &&
      repeatIntervalMinutes === preferences.repeatIntervalMinutes &&
      maxExtraNotifications === preferences.maxExtraNotifications
    );
  }, [
    inputLockMinutes,
    inputMaxNotifications,
    inputMinutes,
    inputRepeatMinutes,
    preferences.leagueLockMinutes,
    preferences.maxExtraNotifications,
    preferences.minutesBefore,
    preferences.repeatIntervalMinutes,
  ]);

  const isLineupFetchDisabled = useMemo(() => {
    const hasUsername = lineupUsername.trim().length > 0;
    const hasPassword = lineupPassword.trim().length > 0;
    const idSquadra = Number.parseInt(lineupIdSquadra, 10);
    const idComp = Number.parseInt(lineupIdComp, 10);
    return !hasUsername || !hasPassword || Number.isNaN(idSquadra) || Number.isNaN(idComp);
  }, [lineupIdComp, lineupIdSquadra, lineupPassword, lineupUsername]);

  const lineupPlayersByRole = useMemo(() => {
    const grouped: Record<FantaRole, FantaLineupPlayer[]> = { P: [], D: [], C: [], A: [], "?": [] };
    for (const player of lineupPlayers) {
      grouped[normalizeFantaRole(player.role)].push(player);
    }
    return grouped;
  }, [lineupPlayers]);

  const lineupSelectionSummary = useMemo(() => {
    const starters: FantaLineupPlayer[] = [];
    const bench: FantaLineupPlayer[] = [];

    for (const player of lineupPlayers) {
      const assignment = lineupAssignments[player.plyr] ?? "none";
      if (assignment === "starter") {
        starters.push(player);
      } else if (assignment === "bench") {
        bench.push(player);
      }
    }

    const starterByRole: Record<FantaRole, number> = { P: 0, D: 0, C: 0, A: 0, "?": 0 };
    for (const player of starters) {
      starterByRole[normalizeFantaRole(player.role)] += 1;
    }

    return {
      starters,
      bench,
      starterByRole,
    };
  }, [lineupAssignments, lineupPlayers]);

  const lineupValidation = useMemo(() => {
    const required = MODULO_REQUIRED[lineupModulo];
    const startersOk =
      lineupSelectionSummary.starters.length === 11 &&
      lineupSelectionSummary.starterByRole.P === required.P &&
      lineupSelectionSummary.starterByRole.D === required.D &&
      lineupSelectionSummary.starterByRole.C === required.C &&
      lineupSelectionSummary.starterByRole.A === required.A;
    const benchOk = lineupSelectionSummary.bench.length <= 12;
    const canSubmit = startersOk && benchOk && lineupPlayers.length > 0 && !isLineupFetchDisabled && !lineupLocked;

    return {
      canSubmit,
      startersOk,
      benchOk,
      startersCount: lineupSelectionSummary.starters.length,
      benchCount: lineupSelectionSummary.bench.length,
      roleCounts: lineupSelectionSummary.starterByRole,
      required,
    };
  }, [isLineupFetchDisabled, lineupLocked, lineupModulo, lineupPlayers.length, lineupSelectionSummary]);

  async function onSaveSettings() {
    if (isSaveDisabled) {
      return;
    }

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
    await syncRemoteSettings(expoPushToken, notificationsPermissionGranted, next);
    setError(null);
    setShowSavedFeedback(true);
    if (saveFeedbackTimeoutRef.current) {
      clearTimeout(saveFeedbackTimeoutRef.current);
    }
    saveFeedbackTimeoutRef.current = setTimeout(() => {
      setShowSavedFeedback(false);
    }, 2000);
  }

  async function onEnableNotifications() {
    const result = await requestPushPermission();
    if (result.granted) {
      setNotificationsPermissionGranted(true);
      setExpoPushToken(result.expoPushToken);
      await syncRemoteSettings(result.expoPushToken, true, preferences);
      setNotificationState("permesso notifiche concesso");
    } else {
      setNotificationState("permesso notifiche negato");
    }
  }

  async function onDoneReminderGroup() {
    if (!nextMatchday) {
      return;
    }
    await markReminderGroupDone(buildReminderGroupId(nextMatchday));
    if (installationId && isRemoteBackendConfigured()) {
      await setRemoteMatchdayDismissal(installationId, nextMatchday.matchday, true);
    }
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

  async function onFetchLineupStatus() {
    const idSquadra = Number.parseInt(lineupIdSquadra, 10);
    const idComp = Number.parseInt(lineupIdComp, 10);
    if (!lineupUsername || !lineupPassword || Number.isNaN(idSquadra) || Number.isNaN(idComp)) {
      setLineupFetchError("Errore durante il recupero: compila username, password, id_squadra e id_comp.");
      return;
    }

    setLineupFetchError("");
    setLineupBusy(true);
    try {
      const response = await fetchFantaStatus({
        username: lineupUsername,
        password: lineupPassword,
        idSquadra,
        idComp,
        division: lineupDivision || "A",
      });
      const players = Array.isArray(response.lineup?.lineUpInfo) ? response.lineup.lineUpInfo : [];
      setLineupPlayers(players);
      setLineupAssignments({});
      const locked = Boolean(response.isLineupLocked);
      setLineupLocked(locked);
      setLineupDayState(locked ? "locked" : "open");
      const currentModulo = String(response.currentModulo ?? "").replaceAll("-", "").trim();
      if (ALLOWED_MODULI.includes(currentModulo as (typeof ALLOWED_MODULI)[number])) {
        setLineupModulo(currentModulo as (typeof ALLOWED_MODULI)[number]);
      }
      setLineupFetchError("");
      setLineupState("");
    } catch (error) {
      setLineupDayState("unknown");
      setLineupFetchError(`Errore durante il recupero: ${String(error)}`);
      setLineupState("");
    } finally {
      setLineupBusy(false);
    }
  }

  async function onSuggestLineup() {
    const idSquadra = Number.parseInt(lineupIdSquadra, 10);
    const idComp = Number.parseInt(lineupIdComp, 10);
    if (!lineupUsername || !lineupPassword || Number.isNaN(idSquadra) || Number.isNaN(idComp)) {
      setLineupState("Compila username, password, id_squadra e id_comp.");
      return;
    }
    if (lineupLocked) {
      setLineupState("Giornata bloccata: proposta disabilitata.");
      return;
    }

    setLineupBusy(true);
    try {
      const response = await suggestFantaLineup(
        {
          username: lineupUsername,
          password: lineupPassword,
          idSquadra,
          idComp,
          division: lineupDivision || "A",
        },
        lineupModulo,
      );

      const suggestedModulo = String(response.spec?.modulo ?? "").replaceAll("-", "").trim();
      if (ALLOWED_MODULI.includes(suggestedModulo as (typeof ALLOWED_MODULI)[number])) {
        setLineupModulo(suggestedModulo as (typeof ALLOWED_MODULI)[number]);
      }

      const starters = new Set((response.spec?.titolari ?? []).map((name) => String(name)));
      const bench = new Set((response.spec?.panchina ?? []).map((name) => String(name)));

      setLineupAssignments(() => {
        const next: Record<string, LineupAssignment> = {};
        for (const player of lineupPlayers) {
          if (starters.has(player.plyr)) {
            next[player.plyr] = "starter";
          } else if (bench.has(player.plyr)) {
            next[player.plyr] = "bench";
          } else {
            next[player.plyr] = "none";
          }
        }
        return next;
      });

      setLineupState("");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setLineupState(`Errore proposta: ${message}`);
    } finally {
      setLineupBusy(false);
    }
  }

  async function onSubmitLineup() {
    const idSquadra = Number.parseInt(lineupIdSquadra, 10);
    const idComp = Number.parseInt(lineupIdComp, 10);
    if (!lineupUsername || !lineupPassword || Number.isNaN(idSquadra) || Number.isNaN(idComp)) {
      setLineupState("Compila username, password, id_squadra e id_comp.");
      return;
    }

    if (!lineupValidation.canSubmit) {
      if (lineupLocked) {
        setLineupState("Giornata bloccata: il sito non consente piu modifiche alla formazione.");
      } else {
        setLineupState("Lineup non valida: seleziona 11 titolari coerenti col modulo e max 12 in panchina.");
      }
      return;
    }

    const parsedSpec: FantaLineupSpec = {
      modulo: lineupModulo,
      titolari: lineupSelectionSummary.starters.map((player) => player.plyr),
      panchina: lineupSelectionSummary.bench.map((player) => player.plyr),
      capitano: [],
    };

    setLineupBusy(true);
    try {
      const response = await submitFantaLineup(
        {
          username: lineupUsername,
          password: lineupPassword,
          idSquadra,
          idComp,
          division: lineupDivision || "A",
        },
        parsedSpec,
      );
      const verified = Boolean(response.verified);
      const sentModulo = String(response.sentModulo ?? "-");
      const currentModulo = String(response.currentModulo ?? "-");
      setLineupState(`Invio ${verified ? "OK" : "NON verificato"} - inviato ${sentModulo}, sito ${currentModulo}.`);
    } catch (error) {
      if (error instanceof FantaFunctionError && error.code === "LUP007") {
        setLineupState("Giornata bloccata: il sito non consente piu modifiche alla formazione.");
      } else {
        const message = error instanceof Error ? error.message : String(error);
        setLineupState(`Errore invio: ${message}`);
      }
    } finally {
      setLineupBusy(false);
    }
  }

  function onSetLineupAssignment(playerName: string, assignment: LineupAssignment) {
    setLineupAssignments((previous) => ({
      ...previous,
      [playerName]: assignment,
    }));
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
    notificationsPermissionGranted,
    dataSource,
    lastSyncAt,
    testState,
    showSavedFeedback,
    isSaveDisabled,
    notificationTime,
    onSaveSettings,
    onEnableNotifications,
    onDoneReminderGroup,
    onRunTestNow,
    onClearTests,
    lineupUsername,
    setLineupUsername,
    lineupPassword,
    setLineupPassword,
    lineupIdSquadra,
    setLineupIdSquadra,
    lineupIdComp,
    setLineupIdComp,
    lineupDivision,
    setLineupDivision,
    lineupModulo,
    setLineupModulo,
    lineupPlayers,
    lineupPlayersByRole,
    lineupAssignments,
    lineupLocked,
    lineupDayState,
    lineupFetchError,
    lineupValidation,
    lineupState,
    lineupBusy,
    isLineupFetchDisabled,
    onSetLineupAssignment,
    onFetchLineupStatus,
    onSuggestLineup,
    onSubmitLineup,
  };
}
