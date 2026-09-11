import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SCREEN_ITEMS } from "../../common/constants/screens";
import type { ScreenKey } from "../../types/app";

type SidebarNavProps = {
  current: ScreenKey;
  onSelect: (screen: ScreenKey) => void;
  compact?: boolean;
};

export function SidebarNav({ current, onSelect, compact = false }: SidebarNavProps) {
  return (
    <View style={[styles.sidebar, compact ? styles.sidebarCompact : styles.sidebarWide]}>
      {SCREEN_ITEMS.map((item) => (
        <TouchableOpacity
          key={item.key}
          style={[styles.item, current === item.key && styles.itemActive]}
          onPress={() => onSelect(item.key)}
        >
          <Text style={[styles.itemText, current === item.key && styles.itemTextActive]}>{item.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    backgroundColor: "#0b1a36",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#1d376d",
    padding: 10,
    gap: 8,
  },
  sidebarCompact: {
    width: 112,
    padding: 8,
  },
  sidebarWide: {
    width: 180,
  },
  item: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#355291",
    backgroundColor: "#14274f",
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  itemActive: {
    borderColor: "#d71921",
    backgroundColor: "#d71921",
  },
  itemText: {
    color: "#dce9ff",
    fontWeight: "700",
    fontSize: 13,
  },
  itemTextActive: {
    color: "#ffffff",
  },
});
