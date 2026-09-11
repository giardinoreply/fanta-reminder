import { Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { getScreenLabel } from "../../common/constants/screens";
import type { ScreenKey } from "../../types/app";
import { SidebarNav } from "./SidebarNav";

type MobileDrawerProps = {
  open: boolean;
  current: ScreenKey;
  onOpen: () => void;
  onClose: () => void;
  onSelect: (screen: ScreenKey) => void;
};

export function MobileDrawer({ open, current, onOpen, onClose, onSelect }: MobileDrawerProps) {
  return (
    <>
      <View style={styles.navRow}>
        <TouchableOpacity style={styles.menuButton} onPress={onOpen}>
          <Text style={styles.menuButtonText}>Menu</Text>
        </TouchableOpacity>
        <Text style={styles.currentSection}>{getScreenLabel(current)}</Text>
      </View>

      {open && (
        <View style={styles.layer}>
          <Pressable style={styles.backdrop} onPress={onClose} />
          <View style={styles.panel}>
            <View style={styles.panelHeader}>
              <Text style={styles.panelTitle}>Sezioni</Text>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Text style={styles.closeButtonText}>Chiudi</Text>
              </TouchableOpacity>
            </View>
            <SidebarNav current={current} onSelect={onSelect} compact />
          </View>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  menuButton: {
    borderRadius: 10,
    backgroundColor: "#d71921",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  menuButtonText: {
    color: "#ffffff",
    fontWeight: "800",
  },
  currentSection: {
    color: "#dce9ff",
    fontWeight: "700",
    fontSize: 15,
  },
  layer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 50,
    flexDirection: "row",
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(2,8,20,0.55)",
  },
  panel: {
    width: 250,
    backgroundColor: "#0b1a36",
    borderLeftWidth: 1,
    borderLeftColor: "#1d376d",
    padding: 10,
    gap: 8,
  },
  panelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  panelTitle: {
    color: "#dce9ff",
    fontWeight: "800",
    fontSize: 16,
  },
  closeButton: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#355291",
    backgroundColor: "#14274f",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  closeButtonText: {
    color: "#dce9ff",
    fontWeight: "700",
    fontSize: 12,
  },
});
