import { StyleSheet, Text, View } from "react-native";
import { colors, spacing } from "../theme/tokens";

export function AppHeader() {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>Fanta Reminder</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.textPrimary,
  },
});
