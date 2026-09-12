import { Pressable, Text, View } from "react-native";
import { sectionStyles } from "./sharedStyles";

type TestSectionProps = {
  testState: string;
  onRunTestNow: () => void;
  onClearTests: () => void;
};

export function TestSection({ testState, onRunTestNow, onClearTests }: TestSectionProps) {
  return (
    <View style={sectionStyles.card}>
      <Text style={sectionStyles.sectionTitle}>Test notifiche</Text>
      <Text style={sectionStyles.label}>Avvia un test immediato senza attendere la vera giornata.</Text>
      <Text style={sectionStyles.label}>Testa subito il numero di notifiche extra e l'intervallo impostato.</Text>

      <Pressable onPress={onRunTestNow} style={sectionStyles.primaryButton}>
        <Text style={sectionStyles.primaryText}>Esegui test ora</Text>
      </Pressable>
      <Pressable onPress={onClearTests} style={sectionStyles.secondaryButton}>
        <Text style={sectionStyles.secondaryText}>Pulisci test pianificati</Text>
      </Pressable>
      <View style={sectionStyles.statePill}>
        <Text style={sectionStyles.statePillText}>Stato test: {testState.toUpperCase()}</Text>
      </View>
    </View>
  );
}
