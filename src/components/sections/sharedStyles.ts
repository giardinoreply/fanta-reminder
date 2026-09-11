import { StyleSheet } from "react-native";

export const sectionStyles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: "#e4e8f4",
    width: "100%",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#11172a",
  },
  label: {
    color: "#5f6780",
    fontWeight: "500",
  },
  input: {
    borderWidth: 1,
    borderColor: "#c6d1ed",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#f8faff",
    color: "#0d1a32",
  },
  primaryButton: {
    backgroundColor: "#d71921",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignSelf: "flex-start",
  },
  primaryText: {
    color: "#fff",
    fontWeight: "800",
  },
  secondaryButton: {
    backgroundColor: "#f0f5ff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#c5d5ff",
    paddingVertical: 11,
    paddingHorizontal: 14,
    alignSelf: "flex-start",
  },
  secondaryText: {
    color: "#0d3d8f",
    fontWeight: "800",
  },
  statePill: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#4d6db4",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#12264c",
  },
  statePillText: {
    color: "#dce9ff",
    fontWeight: "700",
  },
});
