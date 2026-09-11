import { useEffect, useMemo, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, useWindowDimensions } from "react-native";
import { StatusBar } from "expo-status-bar";
import { type MatchdayInfo, type MatchdaysSource } from "./src/services/serieA";
import { savePreferences, type UserPreferences } from "./src/storage/preferences";
import {
  buildReminderGroupId,
  clearTestNotifications,
  markReminderGroupDone,
  requestPushPermission,
  scheduleImmediateTestNotifications,
  scheduleMatchdayReminders,
} from "./src/services/notifications";
import { bootstrapLocalBackend } from "./src/services/localBackend";
import { registerDailyBackgroundSync } from "./src/services/backgroundSync";

type ScreenKey = "home" | "settings" | "calendar" | "test";

function formatDateTime(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString("it-IT", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCountdown(iso: string): string {
  const diffMs = new Date(iso).getTime() - Date.now();
  if (diffMs <= 0) {
    return "0m";
  }
  const totalMinutes = Math.floor(diffMs / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  return `${days}g ${hours}h ${minutes}m`;
}

export default function App() {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const isMobile = !isTablet;
  const isDesktop = width >= 1024;
  const pagePadding = isDesktop ? 24 : isTablet ? 20 : 16;
  const maxContentWidth = isDesktop ? 1080 : 920;

  const [screen, setScreen] = useState<ScreenKey>("home");
  const [nextMatchday, setNextMatchday] = useState<MatchdayInfo | null>(null);
  const [calendar, setCalendar] = useState<MatchdayInfo[]>([]);
  const [preferences, setPreferences] = useState<UserPreferences>({
    minutesBefore: 120,
    leagueLockMinutes: 15,
    repeatIntervalMinutes: 3,
    maxExtraNotifications: 0,
  });
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
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

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
      } catch (e) {
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

  async function onDoneAlarmGroup() {
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

  function goToScreen(nextScreen: ScreenKey) {
    setScreen(nextScreen);
    if (isMobile) {
      setMobileSidebarOpen(false);
    }
  }

  function getScreenLabel(current: ScreenKey): string {
    if (current === "home") {
      return "Home";
    }
    if (current === "calendar") {
      return "Calendario";
    }
    if (current === "settings") {
      return "Impostazioni";
    }
    return "Test";
  }

  function renderSidebarItems() {
    return (
      <>
        <TouchableOpacity style={[styles.sidebarItem, screen === "home" && styles.sidebarItemActive]} onPress={() => goToScreen("home")}>
          <Text style={[styles.sidebarItemText, screen === "home" && styles.sidebarItemTextActive]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.sidebarItem, screen === "calendar" && styles.sidebarItemActive]} onPress={() => goToScreen("calendar")}>
          <Text style={[styles.sidebarItemText, screen === "calendar" && styles.sidebarItemTextActive]}>Calendario</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.sidebarItem, screen === "settings" && styles.sidebarItemActive]} onPress={() => goToScreen("settings")}>
          <Text style={[styles.sidebarItemText, screen === "settings" && styles.sidebarItemTextActive]}>Impostazioni</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.sidebarItem, screen === "test" && styles.sidebarItemActive]} onPress={() => goToScreen("test")}>
          <Text style={[styles.sidebarItemText, screen === "test" && styles.sidebarItemTextActive]}>Test</Text>
        </TouchableOpacity>
      </>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={[styles.title, isTablet && styles.titleTablet]}>
          Fanta Deadline
        </Text>
        <Text style={styles.subtitle}>
          Cosi non te la scordi.{"\n"}Cretino.{"\n"}Bomber Merda.
        </Text>
      </View>

      <View
        style={[
          styles.pageContainer,
          { paddingHorizontal: pagePadding, maxWidth: maxContentWidth },
        ]}
      >
        {isMobile && (
          <View style={styles.mobileNavRow}>
            <TouchableOpacity
              style={styles.mobileMenuButton}
              onPress={() => setMobileSidebarOpen(true)}
            >
              <Text style={styles.mobileMenuButtonText}>Menu</Text>
            </TouchableOpacity>
            <Text style={styles.mobileCurrentSection}>
              {getScreenLabel(screen)}
            </Text>
          </View>
        )}

        <View style={[styles.layout, isTablet && styles.layoutWide]}>
          {isTablet && (
            <View style={[styles.sidebar, styles.sidebarWide]}>
              {renderSidebarItems()}
            </View>
          )}

          <ScrollView
            style={styles.contentScroll}
            contentContainerStyle={styles.body}
          >
            {loading && <Text style={styles.loading}>Caricamento...</Text>}
            {!loading && error && <Text style={styles.error}>{error}</Text>}

            {!loading && screen === "home" && (
              <View
                style={[styles.homeLayout, isTablet && styles.homeLayoutWide]}
              >
                <View
                  style={[
                    styles.card,
                    styles.heroCard,
                    isTablet && styles.heroCardWide,
                  ]}
                >
                  <Text style={[styles.sectionTitle, styles.heroTitle]}>
                    Prossima giornata
                  </Text>
                  <Text style={styles.heroMeta}>
                    Fonte: {dataSource}{" "}
                    {lastSyncAt ? `- sync ${formatDateTime(lastSyncAt)}` : ""}
                  </Text>
                  {!nextMatchday && (
                    <Text style={styles.heroLabel}>
                      Nessun dato disponibile.
                    </Text>
                  )}
                  {nextMatchday && (
                    <>
                      <Text style={styles.badge}>
                        GIORNATA {nextMatchday.matchday}
                      </Text>
                      <Text style={styles.bigMatch}>
                        {nextMatchday.homeTeam} - {nextMatchday.awayTeam}
                      </Text>
                      <Text style={styles.heroLabel}>
                        Prima partita:{" "}
                        {formatDateTime(nextMatchday.firstMatchAt)}
                      </Text>
                      {notificationTime && (
                        <Text style={styles.heroLabel}>
                          Reminder: {formatDateTime(notificationTime)}
                        </Text>
                      )}
                      <Text style={styles.countdown}>
                        Mancano {formatCountdown(nextMatchday.firstMatchAt)}
                      </Text>
                    </>
                  )}
                </View>
                <View
                  style={[
                    styles.card,
                    styles.actionCard,
                    isTablet && styles.actionCardWide,
                  ]}
                >
                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={onEnableNotifications}
                  >
                    <Text style={styles.primaryText}>Abilita notifiche</Text>
                  </TouchableOpacity>
                  {preferences.maxExtraNotifications > 0 && nextMatchday && (
                    <TouchableOpacity
                      style={styles.secondaryButton}
                      onPress={onDoneAlarmGroup}
                    >
                      <Text style={styles.secondaryText}>
                        Fatto (stop ripetizioni)
                      </Text>
                    </TouchableOpacity>
                  )}
                  <View style={styles.statePill}>
                    <Text style={styles.statePillText}>
                      Stato notifiche: {notificationState.toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.label}>
                    Controlla nella tab Impostazioni i minuti di anticipo.
                  </Text>
                </View>
              </View>
            )}

            {!loading && screen === "settings" && (
              <View style={[styles.card, styles.standardCard]}>
                <Text style={styles.sectionTitle}>Promemoria</Text>
                <Text style={styles.label}>
                  Minuti prima della chiusura formazione
                </Text>
                <TextInput
                  value={inputMinutes}
                  onChangeText={setInputMinutes}
                  keyboardType="number-pad"
                  style={styles.input}
                />
                <Text style={styles.label}>
                  Minuti anticipo chiusura lega (default 15)
                </Text>
                <TextInput
                  value={inputLockMinutes}
                  onChangeText={setInputLockMinutes}
                  keyboardType="number-pad"
                  style={styles.input}
                />
                <Text style={styles.label}>
                  Numero max notifiche extra (opzionale, 0 = solo una)
                </Text>
                <TextInput
                  value={inputMaxNotifications}
                  onChangeText={setInputMaxNotifications}
                  keyboardType="number-pad"
                  style={styles.input}
                />
                {Number.parseInt(inputMaxNotifications, 10) > 0 && (
                  <>
                    <Text style={styles.label}>
                      Ogni quanti minuti ripetere (opzionale)
                    </Text>
                    <TextInput
                      value={inputRepeatMinutes}
                      onChangeText={setInputRepeatMinutes}
                      keyboardType="number-pad"
                      style={styles.input}
                    />
                  </>
                )}
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={onSaveSettings}
                >
                  <Text style={styles.primaryText}>Salva</Text>
                </TouchableOpacity>
              </View>
            )}

            {!loading && screen === "calendar" && (
              <View style={[styles.card, styles.standardCard]}>
                <Text style={styles.sectionTitle}>Prossime giornate</Text>
                {calendar.map((item) => (
                  <View
                    key={`${item.matchday}-${item.firstMatchAt}`}
                    style={styles.listItem}
                  >
                    <Text style={styles.value}>Giornata {item.matchday}</Text>
                    <Text style={styles.labelStrong}>
                      {item.homeTeam} - {item.awayTeam}
                    </Text>
                    <Text style={styles.label}>
                      {formatDateTime(item.firstMatchAt)}
                    </Text>
                  </View>
                ))}
                {calendar.length === 0 && (
                  <Text style={styles.label}>Nessuna giornata trovata.</Text>
                )}
              </View>
            )}

            {!loading && screen === "test" && (
              <View style={[styles.card, styles.standardCard]}>
                <Text style={styles.sectionTitle}>Test notifiche</Text>
                <Text style={styles.label}>
                  Avvia un test immediato senza attendere la vera giornata.
                </Text>
                <Text style={styles.label}>
                  Testa subito il numero di notifiche extra e l'intervallo
                  impostato.
                </Text>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={onRunTestNow}
                >
                  <Text style={styles.primaryText}>Esegui test ora</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={onClearTests}
                >
                  <Text style={styles.secondaryText}>
                    Pulisci test pianificati
                  </Text>
                </TouchableOpacity>
                <View style={styles.statePill}>
                  <Text style={styles.statePillText}>
                    Stato test: {testState.toUpperCase()}
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>
        </View>

        {isMobile && mobileSidebarOpen && (
          <View style={styles.mobileSidebarLayer}>
            <Pressable
              style={styles.mobileSidebarBackdrop}
              onPress={() => setMobileSidebarOpen(false)}
            />
            <View style={styles.mobileSidebarPanel}>
              <View style={styles.mobileSidebarHeader}>
                <Text style={styles.mobileSidebarTitle}>Sezioni</Text>
                <TouchableOpacity
                  style={styles.mobileCloseButton}
                  onPress={() => setMobileSidebarOpen(false)}
                >
                  <Text style={styles.mobileCloseButtonText}>Chiudi</Text>
                </TouchableOpacity>
              </View>
              {renderSidebarItems()}
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#08111f",
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
  },
  title: {
    fontSize: 29,
    fontWeight: "800",
    color: "#ffffff",
  },
  titleTablet: {
    fontSize: 34,
  },
  subtitle: {
    marginTop: 4,
    color: "#c4d0ea",
    maxWidth: 340,
  },
  mobileNavRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  mobileMenuButton: {
    borderRadius: 10,
    backgroundColor: "#d71921",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  mobileMenuButtonText: {
    color: "#ffffff",
    fontWeight: "800",
  },
  mobileCurrentSection: {
    color: "#dce9ff",
    fontWeight: "700",
    fontSize: 15,
  },
  layout: {
    width: "100%",
    flexDirection: "row",
    gap: 10,
    minHeight: 480,
  },
  layoutWide: {
    gap: 14,
  },
  sidebar: {
    width: 112,
    backgroundColor: "#0b1a36",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#1d376d",
    padding: 8,
    gap: 8,
    alignSelf: "stretch",
  },
  sidebarWide: {
    width: 180,
    padding: 10,
  },
  mobileSidebarLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 50,
    flexDirection: "row",
  },
  mobileSidebarBackdrop: {
    flex: 1,
    backgroundColor: "rgba(2,8,20,0.55)",
  },
  mobileSidebarPanel: {
    width: 250,
    backgroundColor: "#0b1a36",
    borderLeftWidth: 1,
    borderLeftColor: "#1d376d",
    padding: 10,
    gap: 8,
  },
  mobileSidebarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  mobileSidebarTitle: {
    color: "#dce9ff",
    fontWeight: "800",
    fontSize: 16,
  },
  mobileCloseButton: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#355291",
    backgroundColor: "#14274f",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  mobileCloseButtonText: {
    color: "#dce9ff",
    fontWeight: "700",
    fontSize: 12,
  },
  sidebarItem: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#355291",
    backgroundColor: "#14274f",
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  sidebarItemActive: {
    borderColor: "#d71921",
    backgroundColor: "#d71921",
  },
  sidebarItemText: {
    color: "#dce9ff",
    fontWeight: "700",
    fontSize: 13,
  },
  sidebarItemTextActive: {
    color: "#ffffff",
  },
  contentScroll: {
    flex: 1,
  },
  body: {
    paddingVertical: 2,
    gap: 14,
    paddingBottom: 14,
  },
  pageContainer: {
    width: "100%",
    alignSelf: "center",
    position: "relative",
  },
  homeLayout: {
    width: "100%",
    gap: 14,
  },
  homeLayoutWide: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: "#e4e8f4",
  },
  heroCard: {
    backgroundColor: "#0f1f3f",
    borderColor: "#1f3970",
  },
  heroCardWide: {
    flex: 2,
  },
  actionCard: {
    justifyContent: "center",
  },
  actionCardWide: {
    flex: 1,
    minWidth: 280,
  },
  standardCard: {
    width: "100%",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#11172a",
  },
  heroTitle: {
    color: "#ffffff",
  },
  heroMeta: {
    color: "#8ca8db",
    fontWeight: "600",
    fontSize: 12,
  },
  value: {
    fontWeight: "800",
    color: "#d71921",
  },
  bigMatch: {
    fontSize: 24,
    fontWeight: "800",
    color: "#ffffff",
    lineHeight: 30,
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "#d71921",
    color: "#ffffff",
    fontWeight: "800",
    fontSize: 12,
    letterSpacing: 0.7,
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  countdown: {
    color: "#8cc2ff",
    fontWeight: "800",
    fontSize: 16,
    marginTop: 4,
  },
  primaryButton: {
    backgroundColor: "#d71921",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignSelf: "flex-start",
  },
  primaryText: {
    color: "#fff",
    fontWeight: "800",
  },
  secondaryButton: {
    backgroundColor: "#f0f5ff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#c5d5ff",
    paddingVertical: 11,
    paddingHorizontal: 14,
    alignSelf: "flex-start",
  },
  secondaryText: {
    color: "#0d3d8f",
    fontWeight: "800",
  },
  statePill: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#4d6db4",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#12264c",
  },
  statePillText: {
    color: "#dce9ff",
    fontWeight: "700",
  },
  error: {
    color: "#ffd5d8",
    fontWeight: "700",
    backgroundColor: "#741018",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  loading: {
    color: "#dce9ff",
    fontWeight: "600",
  },
  label: {
    color: "#5f6780",
    fontWeight: "500",
  },
  heroLabel: {
    color: "#cfddff",
    fontWeight: "500",
  },
  labelStrong: {
    color: "#1f2b45",
    fontWeight: "700",
  },
  input: {
    borderWidth: 1,
    borderColor: "#c6d1ed",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#f8faff",
    color: "#0d1a32",
  },
  listItem: {
    borderBottomWidth: 1,
    borderBottomColor: "#e8edf8",
    paddingVertical: 12,
    gap: 2,
  },
});
