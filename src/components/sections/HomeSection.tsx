import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { MatchdayInfo, MatchdaysSource } from "../../services/serieA";
import { formatCountdown, formatDateTime } from "../../common/utils/date";
import { sectionStyles } from "./sharedStyles";

type HomeSectionProps = {
  isTablet: boolean;
  nextMatchday: MatchdayInfo | null;
  notificationTime: string | null;
  dataSource: MatchdaysSource;
  lastSyncAt: string | null;
  notificationState: string;
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
  showDoneButton,
  onEnableNotifications,
  onDoneReminderGroup,
}: HomeSectionProps) {
  return (
    <View style={[styles.layout, isTablet && styles.layoutWide]}>
      <View style={[sectionStyles.card, styles.heroCard, isTablet && styles.heroCardWide]}>
        <Text style={[sectionStyles.sectionTitle, styles.heroTitle]}>Prossima giornata</Text>
        <Text style={styles.heroMeta}>Fonte: {dataSource} {lastSyncAt ? `- sync ${formatDateTime(lastSyncAt)}` : ""}</Text>
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

      <View style={[sectionStyles.card, styles.actionCard, isTablet && styles.actionCardWide]}>
        <TouchableOpacity style={sectionStyles.primaryButton} onPress={onEnableNotifications}>
          <Text style={sectionStyles.primaryText}>Abilita notifiche</Text>
        </TouchableOpacity>
        {showDoneButton && (
          <TouchableOpacity style={sectionStyles.secondaryButton} onPress={onDoneReminderGroup}>
            <Text style={sectionStyles.secondaryText}>Fatto (stop ripetizioni)</Text>
          </TouchableOpacity>
        )}
        <View style={sectionStyles.statePill}>
          <Text style={sectionStyles.statePillText}>Stato notifiche: {notificationState.toUpperCase()}</Text>
        </View>
        <Text style={sectionStyles.label}>Controlla nella tab Impostazioni i minuti di anticipo.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  layout: {
    width: "100%",
    gap: 14,
  },
  layoutWide: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  heroCard: {
    backgroundColor: "#0f1f3f",
    borderColor: "#1f3970",
  },
  heroCardWide: {
    flex: 2,
  },
  heroTitle: {
    color: "#ffffff",
  },
  heroMeta: {
    color: "#8ca8db",
    fontWeight: "600",
    fontSize: 12,
  },
  heroLabel: {
    color: "#cfddff",
    fontWeight: "500",
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
  bigMatch: {
    fontSize: 24,
    fontWeight: "800",
    color: "#ffffff",
    lineHeight: 30,
  },
  countdown: {
    color: "#8cc2ff",
    fontWeight: "800",
    fontSize: 16,
    marginTop: 4,
  },
  actionCard: {
    justifyContent: "center",
  },
  actionCardWide: {
    flex: 1,
    minWidth: 280,
  },
});
