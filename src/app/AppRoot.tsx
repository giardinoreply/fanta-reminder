import { StatusBar } from "expo-status-bar";
import { SafeAreaView, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { AppHeader } from "../common/components/AppHeader";
import { MobileDrawer } from "../components/navigation/MobileDrawer";
import { SidebarNav } from "../components/navigation/SidebarNav";
import { CalendarSection } from "../components/sections/CalendarSection";
import { HomeSection } from "../components/sections/HomeSection";
import { SettingsSection } from "../components/sections/SettingsSection";
import { TestSection } from "../components/sections/TestSection";
import { useAppController } from "../hooks/useAppController";
import { useState } from "react";
import type { ScreenKey } from "../types/app";

export function AppRoot() {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const isMobile = !isTablet;
  const isDesktop = width >= 1024;
  const pagePadding = isDesktop ? 24 : isTablet ? 20 : 16;
  const maxContentWidth = isDesktop ? 1080 : 920;

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const app = useAppController();

  function onSelectScreen(screen: ScreenKey) {
    app.setScreen(screen);
    if (isMobile) {
      setMobileSidebarOpen(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <AppHeader isTablet={isTablet} />

      <View style={[styles.pageContainer, { paddingHorizontal: pagePadding, maxWidth: maxContentWidth }]}>
        {isMobile && (
          <MobileDrawer
            open={mobileSidebarOpen}
            current={app.screen}
            onOpen={() => setMobileSidebarOpen(true)}
            onClose={() => setMobileSidebarOpen(false)}
            onSelect={onSelectScreen}
          />
        )}

        <View style={[styles.layout, isTablet && styles.layoutWide]}>
          {isTablet && <SidebarNav current={app.screen} onSelect={onSelectScreen} />}

          <ScrollView style={styles.contentScroll} contentContainerStyle={styles.body}>
            {app.loading && <Text style={styles.loading}>Caricamento...</Text>}
            {!app.loading && app.error && <Text style={styles.error}>{app.error}</Text>}

            {!app.loading && app.screen === "home" && (
              <HomeSection
                isTablet={isTablet}
                nextMatchday={app.nextMatchday}
                notificationTime={app.notificationTime}
                dataSource={app.dataSource}
                lastSyncAt={app.lastSyncAt}
                notificationState={app.notificationState}
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
              />
            )}

            {!app.loading && app.screen === "test" && (
              <TestSection testState={app.testState} onRunTestNow={app.onRunTestNow} onClearTests={app.onClearTests} />
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
    backgroundColor: "#08111f",
  },
  pageContainer: {
    width: "100%",
    alignSelf: "center",
    position: "relative",
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
  contentScroll: {
    flex: 1,
  },
  body: {
    paddingVertical: 2,
    gap: 14,
    paddingBottom: 14,
  },
  loading: {
    color: "#dce9ff",
    fontWeight: "600",
  },
  error: {
    color: "#ffd5d8",
    fontWeight: "700",
    backgroundColor: "#741018",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
});
