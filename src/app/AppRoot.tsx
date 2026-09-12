import { StatusBar } from "expo-status-bar";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { AppHeader } from "../common/components/AppHeader";
import { SCREEN_ITEMS } from "../common/constants/screens";
import { CalendarSection } from "../components/sections/CalendarSection";
import { HomeSection } from "../components/sections/HomeSection";
import { SettingsSection } from "../components/sections/SettingsSection";
import { TestSection } from "../components/sections/TestSection";
import { useAppController } from "../hooks/useAppController";
import { colors, radius, spacing } from "../common/theme/tokens";

export function AppRoot() {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const isDesktop = width >= 1024;
  const pagePadding = isDesktop ? 24 : isTablet ? 20 : 14;
  const maxContentWidth = isDesktop ? 1080 : 920;

  const app = useAppController();

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <AppHeader isTablet={isTablet} />

      <View style={[styles.pageContainer, { paddingHorizontal: pagePadding, maxWidth: maxContentWidth }]}>
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
              dataSource={app.dataSource}
              lastSyncAt={app.lastSyncAt}
              notificationState={app.notificationState}
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
        </ScrollView>
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
    position: "relative",
  },
  tabsRow: {
    flexDirection: "row",
    gap: spacing.xs,
    marginBottom: spacing.md,
    paddingBottom: 2,
    alignItems: "center",
  },
  tabsScroll: {
    flexGrow: 0,
    flexShrink: 0,
  },
  tabButton: {
    borderRadius: radius.pill,
    overflow: "hidden",
    paddingHorizontal: spacing.sm,
    paddingVertical: 7,
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 34,
    justifyContent: "center",
  },
  tabButtonActive: {
    backgroundColor: colors.nerazzurro,
    borderColor: colors.nerazzurroSoft,
  },
  tabText: {
    color: colors.textSecondary,
    fontWeight: "700",
    fontSize: 13,
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
    paddingVertical: 2,
    gap: spacing.md,
    paddingBottom: spacing.md,
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
