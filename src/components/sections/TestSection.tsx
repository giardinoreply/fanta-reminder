import { Pressable, StyleSheet, Text, View } from "react-native";
import { sectionStyles } from "./sharedStyles";
import { colors, spacing } from "../../common/theme/tokens";

type TestSectionProps = {
  testState: string;
  onRunTestNow: () => void;
  onClearTests: () => void;
};

export function TestSection({ testState, onRunTestNow, onClearTests }: TestSectionProps) {
  return (
    <View style={sectionStyles.card}>
      <Text style={styles.kicker}>DIAGNOSTICS</Text>
      <Text style={sectionStyles.sectionTitle}>Test notifiche</Text>
      <Text style={sectionStyles.label}>Esegue un invio immediato per validare permessi, repeat e scheduling locale.</Text>

      <View style={styles.actions}>
        <Pressable onPress={onRunTestNow} style={sectionStyles.primaryButton}>
          <Text style={sectionStyles.primaryText}>ESEGUI TEST ORA</Text>
        </Pressable>
        <Pressable onPress={onClearTests} style={sectionStyles.secondaryButton}>
          <Text style={sectionStyles.secondaryText}>PULISCI TEST PIANIFICATI</Text>
        </Pressable>
      </View>
      <View style={sectionStyles.statePill}>
        <Text style={sectionStyles.statePillText}>Stato test: {testState}</Text>
      </View>
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
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
});
