import { StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing } from "../theme/tokens";

type AppHeaderProps = {
  isTablet: boolean;
};

export function AppHeader({ isTablet }: AppHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>SERIE A</Text>
      </View>
      <Text style={[styles.title, isTablet && styles.titleTablet]}>Fanta Deadline</Text>
      <Text style={styles.subtitle}>Cosi non te la scordi.{"\n"}Cretino.{"\n"}Bomber Merda.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: colors.nerazzurro,
    borderWidth: 1,
    borderColor: colors.nerazzurroSoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    marginBottom: spacing.xs,
  },
  badgeText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.7,
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  titleTablet: {
    fontSize: 36,
  },
  subtitle: {
    marginTop: 4,
    color: colors.textSecondary,
    maxWidth: 360,
    lineHeight: 20,
  },
});
