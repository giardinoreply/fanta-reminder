import { Pressable, StyleSheet, Text, View } from "react-native";
import type { MatchdayInfo } from "../../services/serieA";
import { formatCountdown, formatDateTime } from "../../common/utils/date";
import { sectionStyles } from "./sharedStyles";
import { colors, radius, spacing } from "../../common/theme/tokens";

type HomeSectionProps = {
  isTablet: boolean;
  nextMatchday: MatchdayInfo | null;
  notificationTime: string | null;
  showEnableNotificationsButton: boolean;
  showDoneButton: boolean;
  onEnableNotifications: () => void;
  onDoneReminderGroup: () => void;
};

export function HomeSection({
  isTablet,
  nextMatchday,
  notificationTime,
  showEnableNotificationsButton,
  showDoneButton,
  onEnableNotifications,
  onDoneReminderGroup,
}: HomeSectionProps) {
  const hasNotificationPermission = !showEnableNotificationsButton;

  return (
    <View style={[styles.layout, isTablet && styles.layoutWide]}>
      <View style={[sectionStyles.card, styles.heroCard, isTablet && styles.heroCardWide]}>
        <Text style={styles.kicker}>MATCHDAY COMMAND</Text>
        <Text style={[sectionStyles.sectionTitle, styles.heroTitle]}>Prossima giornata</Text>
        <Text style={styles.heroMeta}>Stream calendario attivo</Text>
        {!nextMatchday && <Text style={styles.heroLabel}>Nessun dato disponibile.</Text>}
        {nextMatchday && (
          <>
            <Text style={styles.badge}>GIORNATA {nextMatchday.matchday}</Text>
            <Text style={styles.bigMatch}>{nextMatchday.homeTeam} vs {nextMatchday.awayTeam}</Text>
            <Text style={styles.heroLabel}>Prima partita: {formatDateTime(nextMatchday.firstMatchAt)}</Text>
            {notificationTime && <Text style={styles.heroLabel}>Reminder base: {formatDateTime(notificationTime)}</Text>}
            <Text style={styles.countdown}>Tra {formatCountdown(nextMatchday.firstMatchAt)}</Text>
          </>
        )}
      </View>

      <View
        style={[
          sectionStyles.card,
          styles.actionCard,
          hasNotificationPermission && styles.actionCardGranted,
          isTablet && styles.actionCardWide,
        ]}
      >
        <Text style={styles.actionsTitle}>Automazioni notifica</Text>
        <Text style={styles.actionsCopy}>
          {hasNotificationPermission
            ? "Permesso concesso."
            : "Gestisci permessi e blocca subito i reminder quando hai gia inviato la formazione."}
        </Text>
        <View style={styles.actionsCenter}>
          {showEnableNotificationsButton && (
            <Pressable onPress={onEnableNotifications} style={[sectionStyles.primaryButton, styles.actionButton]}>
              <Text style={[sectionStyles.primaryText, styles.centerText]}>ABILITA NOTIFICHE</Text>
            </Pressable>
          )}
          {showDoneButton && (
            <Pressable onPress={onDoneReminderGroup} style={[sectionStyles.secondaryButton, styles.actionButton]}>
              <Text style={[sectionStyles.secondaryText, styles.centerText]}>SEGNA GIORNATA COMPLETATA</Text>
            </Pressable>
          )}
        </View>
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
    backgroundColor: "#0f223d",
    borderColor: colors.nerazzurroSoft,
  },
  heroCardWide: {
    flex: 2,
  },
  kicker: {
    color: colors.nerazzurro,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  heroTitle: {
    color: colors.textPrimary,
  },
  heroMeta: {
    color: colors.textMuted,
    fontWeight: "700",
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
    fontSize: 26,
    fontWeight: "800",
    color: colors.textPrimary,
    lineHeight: 32,
  },
  countdown: {
    color: colors.nerazzurro,
    fontWeight: "800",
    fontSize: 16,
    marginTop: 4,
  },
  actionCard: {
    justifyContent: "space-between",
    backgroundColor: "#2a1020",
    borderColor: colors.biancorossoSoft,
  },
  actionCardGranted: {
    backgroundColor: "#122b1f",
    borderColor: colors.success,
  },
  actionsTitle: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: "800",
  },
  actionsCopy: {
    color: colors.textSecondary,
    lineHeight: 21,
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
  actionCardWide: {
    flex: 1,
    minWidth: 280,
  },
});
