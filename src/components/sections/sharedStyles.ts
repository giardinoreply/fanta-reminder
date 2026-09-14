import { StyleSheet } from "react-native";
import { colors, radius, spacing } from "../../common/theme/tokens";

export const sectionStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    width: "100%",
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  label: {
    color: colors.textSecondary,
    fontWeight: "500",
    lineHeight: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.surfaceSoft,
    color: colors.textPrimary,
  },
  primaryButton: {
    backgroundColor: colors.nerazzurro,
    borderRadius: radius.md,
    overflow: "hidden",
    paddingVertical: 13,
    paddingHorizontal: 16,
    alignSelf: "flex-start",
  },
  primaryText: {
    color: colors.white,
    fontWeight: "800",
  },
  secondaryButton: {
    backgroundColor: colors.surfaceSoft,
    borderRadius: radius.md,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.nerazzurroSoft,
    paddingVertical: 11,
    paddingHorizontal: 14,
    alignSelf: "flex-start",
  },
  secondaryText: {
    color: colors.textSecondary,
    fontWeight: "800",
  },
  statePill: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: colors.nerazzurroSoft,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.bgAlt,
  },
  statePillText: {
    color: colors.textSecondary,
    fontWeight: "700",
  },
});
