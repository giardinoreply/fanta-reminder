import { Pressable, StyleSheet, Text, View } from "react-native";
import type { MatchdayInfo, MatchdaysSource } from "../../services/serieA";
import { formatCountdown, formatDateTime } from "../../common/utils/date";
import { sectionStyles } from "./sharedStyles";
import { colors, radius, spacing } from "../../common/theme/tokens";

type HomeSectionProps = {
  isTablet: boolean;
  nextMatchday: MatchdayInfo | null;
  notificationTime: string | null;
  dataSource: MatchdaysSource;
  lastSyncAt: string | null;
  notificationState: string;
  showEnableNotificationsButton: boolean;
  showDoneButton: boolean;
  onEnableNotifications: () => void;
  onDoneReminderGroup: () => void;
};

export function HomeSection({
  isTablet,
  nextMatchday,
  notificationTime,
  dataSource,
  lastSyncAt,
  notificationState,
  showEnableNotificationsButton,
  showDoneButton,
  onEnableNotifications,
  onDoneReminderGroup,
}: HomeSectionProps) {
  return (
    <View style={[styles.layout, isTablet && styles.layoutWide]}>
      <View style={[sectionStyles.card, styles.actionCard, isTablet && styles.actionCardWide]}>
        <View style={styles.actionsCenter}>
          {showEnableNotificationsButton && (
            <Pressable onPress={onEnableNotifications} style={[sectionStyles.primaryButton, styles.actionButton]}>
              <Text style={[sectionStyles.primaryText, styles.centerText]}>Abilita notifiche</Text>
            </Pressable>
          )}
          {showDoneButton && (
            <Pressable onPress={onDoneReminderGroup} style={[sectionStyles.secondaryButton, styles.actionButton]}>
              <Text style={[sectionStyles.secondaryText, styles.centerText]}>Ho inserito la formazione per questa giornata</Text>
            </Pressable>
          )}
        </View>
        <Text style={styles.stateLabel}>Stato notifiche: {notificationState.toUpperCase()}</Text>
      </View>

      <View style={[sectionStyles.card, styles.heroCard, isTablet && styles.heroCardWide]}>
        <Text style={[sectionStyles.sectionTitle, styles.heroTitle]}>Prossima giornata</Text>
        <Text style={styles.heroMeta}>
          Fonte: {dataSource} {lastSyncAt ? `- sync ${formatDateTime(lastSyncAt)}` : ""}
        </Text>
        {!nextMatchday && <Text style={styles.heroLabel}>Nessun dato disponibile.</Text>}
        {nextMatchday && (
          <>
            <Text style={styles.badge}>GIORNATA {nextMatchday.matchday}</Text>
            <Text style={styles.bigMatch}>{nextMatchday.homeTeam} - {nextMatchday.awayTeam}</Text>
            <Text style={styles.heroLabel}>Prima partita: {formatDateTime(nextMatchday.firstMatchAt)}</Text>
            {notificationTime && <Text style={styles.heroLabel}>Reminder: {formatDateTime(notificationTime)}</Text>}
            <Text style={styles.countdown}>Mancano {formatCountdown(nextMatchday.firstMatchAt)}</Text>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  layout: {
    width: "100%",
    gap: spacing.md,
  },
  layoutWide: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  heroCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  heroCardWide: {
    flex: 2,
  },
  heroTitle: {
    color: colors.textPrimary,
  },
  heroMeta: {
    color: colors.textMuted,
    fontWeight: "600",
    fontSize: 12,
  },
  heroLabel: {
    color: colors.textSecondary,
    fontWeight: "500",
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: colors.biancorosso,
    color: colors.white,
    fontWeight: "800",
    fontSize: 12,
    letterSpacing: 0.7,
    borderRadius: radius.pill,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  bigMatch: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.textPrimary,
    lineHeight: 30,
  },
  countdown: {
    color: colors.nerazzurroSoft,
    fontWeight: "800",
    fontSize: 16,
    marginTop: 4,
  },
  actionCard: {
    justifyContent: "center",
  },
  actionsCenter: {
    width: "100%",
    alignItems: "center",
    gap: spacing.sm,
  },
  actionButton: {
    width: "100%",
    maxWidth: 360,
    alignSelf: "center",
  },
  centerText: {
    textAlign: "center",
  },
  stateLabel: {
    marginTop: spacing.xs,
    textAlign: "center",
    color: colors.textSecondary,
    fontWeight: "600",
  },
  actionCardWide: {
    flex: 1,
    minWidth: 280,
  },
});
