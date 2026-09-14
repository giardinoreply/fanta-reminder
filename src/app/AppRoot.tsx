import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { AppHeader } from "../common/components/AppHeader";
import { SCREEN_ITEMS } from "../common/constants/screens";
import { formatDateTime } from "../common/utils/date";
import { CalendarSection } from "../components/sections/CalendarSection";
import { HomeSection } from "../components/sections/HomeSection";
import { LineupSection } from "../components/sections/LineupSection";
import { SettingsSection } from "../components/sections/SettingsSection";
import { TestSection } from "../components/sections/TestSection";
import { useAppController } from "../hooks/useAppController";
import { colors, radius, spacing } from "../common/theme/tokens";

export function AppRoot() {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const pagePadding = isTablet ? 22 : 14;
  const maxContentWidth = 1260;

  const app = useAppController();

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <AppHeader />

      <View style={[styles.pageContainer, { paddingHorizontal: pagePadding, maxWidth: maxContentWidth }]}>
        <View style={styles.infoRibbon}>
          <View style={styles.infoChip}>
            <Text style={styles.infoChipLabel}>Ultimo aggiornamento</Text>
            <Text style={styles.infoChipValue}>{app.lastSyncAt ? formatDateTime(app.lastSyncAt) : "N/D"}</Text>
          </View>
          <View style={styles.infoChip}>
            <Text style={styles.infoChipLabel}>Permesso notifiche</Text>
            <Text style={styles.infoChipValue}>{app.notificationsPermissionGranted ? "ATTIVO" : "NON ATTIVO"}</Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.tabsCard}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.tabsScroll}
              contentContainerStyle={styles.tabsRow}
            >
              {SCREEN_ITEMS.map((item) => {
                const selected = app.screen === item.key;
                return (
                  <Pressable key={item.key} onPress={() => app.setScreen(item.key)} style={[styles.tabButton, selected && styles.tabButtonActive]}>
                    <Text style={[styles.tabText, selected && styles.tabTextActive]}>{item.label}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          <ScrollView style={styles.contentScroll} contentContainerStyle={styles.body}>

          {app.loading && (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="small" color={colors.nerazzurroSoft} />
              <Text style={styles.loading}>Caricamento...</Text>
            </View>
          )}
          {!app.loading && app.error && <Text style={styles.error}>{app.error}</Text>}

          {!app.loading && app.screen === "home" && (
            <HomeSection
              isTablet={isTablet}
              nextMatchday={app.nextMatchday}
              notificationTime={app.notificationTime}
              showEnableNotificationsButton={!app.notificationsPermissionGranted}
              showDoneButton={Boolean(app.preferences.maxExtraNotifications > 0 && app.nextMatchday)}
              onEnableNotifications={app.onEnableNotifications}
              onDoneReminderGroup={app.onDoneReminderGroup}
            />
          )}

          {!app.loading && app.screen === "calendar" && <CalendarSection calendar={app.calendar} />}

          {!app.loading && app.screen === "settings" && (
            <SettingsSection
              inputMinutes={app.inputMinutes}
              inputLockMinutes={app.inputLockMinutes}
              inputMaxNotifications={app.inputMaxNotifications}
              inputRepeatMinutes={app.inputRepeatMinutes}
              onChangeMinutes={app.setInputMinutes}
              onChangeLockMinutes={app.setInputLockMinutes}
              onChangeMaxNotifications={app.setInputMaxNotifications}
              onChangeRepeatMinutes={app.setInputRepeatMinutes}
              onSave={app.onSaveSettings}
              showSavedFeedback={app.showSavedFeedback}
              isSaveDisabled={app.isSaveDisabled}
            />
          )}

          {!app.loading && app.screen === "test" && (
            <TestSection testState={app.testState} onRunTestNow={app.onRunTestNow} onClearTests={app.onClearTests} />
          )}

          {!app.loading && app.screen === "lineup" && (
            <LineupSection
              username={app.lineupUsername}
              password={app.lineupPassword}
              idSquadra={app.lineupIdSquadra}
              idComp={app.lineupIdComp}
              division={app.lineupDivision}
              modulo={app.lineupModulo}
              playersByRole={app.lineupPlayersByRole}
              assignments={app.lineupAssignments}
              validation={app.lineupValidation}
              lineupState={app.lineupState}
              lineupBusy={app.lineupBusy}
              lineupLocked={app.lineupLocked}
              lineupDayState={app.lineupDayState}
              lineupFetchError={app.lineupFetchError}
              isFetchDisabled={app.isLineupFetchDisabled}
              onChangeUsername={app.setLineupUsername}
              onChangePassword={app.setLineupPassword}
              onChangeIdSquadra={app.setLineupIdSquadra}
              onChangeIdComp={app.setLineupIdComp}
              onChangeDivision={app.setLineupDivision}
              onChangeModulo={app.setLineupModulo}
              onSetAssignment={app.onSetLineupAssignment}
              onFetchStatus={app.onFetchLineupStatus}
              onSuggestLineup={app.onSuggestLineup}
              onSubmitLineup={app.onSubmitLineup}
            />
          )}
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  pageContainer: {
    flex: 1,
    width: "100%",
    alignSelf: "center",
    paddingBottom: spacing.sm,
    gap: spacing.md,
  },
  sectionCard: {
    flex: 1,
    backgroundColor: "#0d1a2e",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingTop: spacing.sm,
    gap: spacing.sm,
    overflow: "hidden",
  },
  tabsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexGrow: 1,
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  tabsScroll: {
    width: "100%",
    flexGrow: 0,
  },
  tabButton: {
    borderRadius: radius.md,
    overflow: "hidden",
    paddingHorizontal: spacing.sm,
    paddingVertical: 9,
    backgroundColor: "#162b46",
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 38,
    justifyContent: "center",
  },
  tabButtonActive: {
    backgroundColor: colors.nerazzurro,
    borderColor: colors.nerazzurroSoft,
  },
  tabText: {
    color: colors.textSecondary,
    fontWeight: "700",
    fontSize: 14,
  },
  tabTextActive: {
    color: colors.white,
  },
  contentScroll: {
    flex: 1,
    width: "100%",
  },
  body: {
    flexGrow: 1,
    paddingTop: spacing.xs,
    paddingHorizontal: spacing.md,
    gap: spacing.md,
    paddingBottom: spacing.md,
  },
  infoRibbon: {
    flexDirection: "row",
    gap: spacing.sm,
    flexWrap: "wrap",
  },
  infoChip: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: "48%",
    minWidth: 0,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#11243f",
    borderRadius: radius.md,
    paddingVertical: 8,
    paddingHorizontal: spacing.sm,
    minWidth: 140,
    gap: 2,
  },
  tabsCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: "#11243f",
    paddingVertical: spacing.xs,
  },
  infoChipLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  infoChipValue: {
    color: colors.nerazzurro,
    fontWeight: "800",
    fontSize: 12,
  },
  loadingWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  loading: {
    color: colors.textSecondary,
    fontWeight: "600",
  },
  error: {
    color: colors.errorText,
    fontWeight: "700",
    backgroundColor: colors.errorBg,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
  },
});
