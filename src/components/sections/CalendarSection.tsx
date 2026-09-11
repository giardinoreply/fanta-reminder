import { StyleSheet, Text, View } from "react-native";
import type { MatchdayInfo } from "../../services/serieA";
import { formatDateTime } from "../../common/utils/date";
import { sectionStyles } from "./sharedStyles";

type CalendarSectionProps = {
  calendar: MatchdayInfo[];
};

export function CalendarSection({ calendar }: CalendarSectionProps) {
  return (
    <View style={sectionStyles.card}>
      <Text style={sectionStyles.sectionTitle}>Prossime giornate</Text>
      {calendar.map((item) => (
        <View key={`${item.matchday}-${item.firstMatchAt}`} style={styles.listItem}>
          <Text style={styles.value}>Giornata {item.matchday}</Text>
          <Text style={styles.labelStrong}>{item.homeTeam} - {item.awayTeam}</Text>
          <Text style={sectionStyles.label}>{formatDateTime(item.firstMatchAt)}</Text>
        </View>
      ))}
      {calendar.length === 0 && <Text style={sectionStyles.label}>Nessuna giornata trovata.</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  listItem: {
    borderBottomWidth: 1,
    borderBottomColor: "#e8edf8",
    paddingVertical: 12,
    gap: 2,
  },
  value: {
    fontWeight: "800",
    color: "#d71921",
  },
  labelStrong: {
    color: "#1f2b45",
    fontWeight: "700",
  },
});
