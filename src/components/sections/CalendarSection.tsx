import { StyleSheet, Text, View } from "react-native";
import type { MatchdayInfo } from "../../services/serieA";
import { formatDateTime } from "../../common/utils/date";
import { sectionStyles } from "./sharedStyles";
import { colors } from "../../common/theme/tokens";

type CalendarSectionProps = {
  calendar: MatchdayInfo[];
};

export function CalendarSection({ calendar }: CalendarSectionProps) {
  return (
    <View style={sectionStyles.card}>
      <Text style={styles.kicker}>ROADMAP</Text>
      <Text style={sectionStyles.sectionTitle}>Calendario giornate</Text>
      <Text style={sectionStyles.label}>Timeline dei prossimi kickoff rilevati dal backend locale/API.</Text>
      {calendar.map((item) => (
        <View key={`${item.matchday}-${item.firstMatchAt}`} style={styles.listItem}>
          <View style={styles.row}>
            <Text style={styles.value}>Giornata {item.matchday}</Text>
            <Text style={styles.date}>{formatDateTime(item.firstMatchAt)}</Text>
          </View>
          <Text style={styles.labelStrong}>{item.homeTeam} vs {item.awayTeam}</Text>
        </View>
      ))}
      {calendar.length === 0 && <Text style={sectionStyles.label}>Nessuna giornata trovata.</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  kicker: {
    color: colors.nerazzurro,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  listItem: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 12,
    gap: 6,
    borderLeftWidth: 3,
    borderLeftColor: colors.nerazzurroSoft,
    paddingLeft: 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  value: {
    fontWeight: "700",
    color: colors.nerazzurro,
  },
  labelStrong: {
    color: colors.textPrimary,
    fontWeight: "800",
    fontSize: 17,
  },
  date: {
    color: colors.biancorosso,
    fontSize: 12,
    fontWeight: "700",
  },
});
