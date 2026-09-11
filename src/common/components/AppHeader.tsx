import { StyleSheet, Text, View } from "react-native";

type AppHeaderProps = {
  isTablet: boolean;
};

export function AppHeader({ isTablet }: AppHeaderProps) {
  return (
    <View style={styles.header}>
      <Text style={[styles.title, isTablet && styles.titleTablet]}>Fanta Deadline</Text>
      <Text style={styles.subtitle}>Cosi non te la scordi.{"\n"}Cretino.{"\n"}Bomber Merda.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
  },
  title: {
    fontSize: 29,
    fontWeight: "800",
    color: "#ffffff",
  },
  titleTablet: {
    fontSize: 34,
  },
  subtitle: {
    marginTop: 4,
    color: "#c4d0ea",
    maxWidth: 340,
  },
});
