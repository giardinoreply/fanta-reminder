import { useRef } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { sectionStyles } from "./sharedStyles";
import { colors, spacing } from "../../common/theme/tokens";

type SettingsSectionProps = {
  inputMinutes: string;
  inputLockMinutes: string;
  inputMaxNotifications: string;
  inputRepeatMinutes: string;
  onChangeMinutes: (value: string) => void;
  onChangeLockMinutes: (value: string) => void;
  onChangeMaxNotifications: (value: string) => void;
  onChangeRepeatMinutes: (value: string) => void;
  onSave: () => void;
  showSavedFeedback: boolean;
  isSaveDisabled: boolean;
};

export function SettingsSection({
  inputMinutes,
  inputLockMinutes,
  inputMaxNotifications,
  inputRepeatMinutes,
  onChangeMinutes,
  onChangeLockMinutes,
  onChangeMaxNotifications,
  onChangeRepeatMinutes,
  onSave,
  showSavedFeedback,
  isSaveDisabled,
}: SettingsSectionProps) {
  const minutesRef = useRef<TextInput>(null);
  const lockMinutesRef = useRef<TextInput>(null);
  const maxNotificationsRef = useRef<TextInput>(null);
  const repeatMinutesRef = useRef<TextInput>(null);

  return (
    <View style={sectionStyles.card}>
      <Text style={styles.kicker}>AUTOMATION RULES</Text>
      <Text style={sectionStyles.sectionTitle}>Impostazioni reminder</Text>
      <Text style={sectionStyles.label}>Configura anticipo, lock lega e schema di ripetizione notifiche.</Text>

      <View style={styles.grid}>
        <View style={styles.field}>
          <Text style={sectionStyles.label} onPress={() => minutesRef.current?.focus()}>
            Minuti prima della chiusura formazione
          </Text>
          <TextInput
            ref={minutesRef}
            value={inputMinutes}
            onChangeText={onChangeMinutes}
            keyboardType="number-pad"
            style={sectionStyles.input}
            placeholder="120"
            placeholderTextColor={colors.textMuted}
          />
        </View>

        <View style={styles.field}>
          <Text style={sectionStyles.label} onPress={() => lockMinutesRef.current?.focus()}>
            Minuti anticipo chiusura lega
          </Text>
          <TextInput
            ref={lockMinutesRef}
            value={inputLockMinutes}
            onChangeText={onChangeLockMinutes}
            keyboardType="number-pad"
            style={sectionStyles.input}
            placeholder="15"
            placeholderTextColor={colors.textMuted}
          />
        </View>
      </View>

      <View style={styles.grid}>
        <View style={styles.field}>
          <Text style={sectionStyles.label} onPress={() => maxNotificationsRef.current?.focus()}>
            Max notifiche extra
          </Text>
          <TextInput
            ref={maxNotificationsRef}
            value={inputMaxNotifications}
            onChangeText={onChangeMaxNotifications}
            keyboardType="number-pad"
            style={sectionStyles.input}
            placeholder="0"
            placeholderTextColor={colors.textMuted}
          />
        </View>

        {Number.parseInt(inputMaxNotifications, 10) > 0 && (
          <View style={styles.field}>
            <Text style={sectionStyles.label} onPress={() => repeatMinutesRef.current?.focus()}>
              Intervallo ripetizione (minuti)
            </Text>
            <TextInput
              ref={repeatMinutesRef}
              value={inputRepeatMinutes}
              onChangeText={onChangeRepeatMinutes}
              keyboardType="number-pad"
              style={sectionStyles.input}
              placeholder="3"
              placeholderTextColor={colors.textMuted}
            />
          </View>
        )}
      </View>

      {Number.parseInt(inputMaxNotifications, 10) <= 0 && (
        <Text style={sectionStyles.label}>Con valore 0 viene inviata solo la notifica principale.</Text>
      )}

      <View style={styles.saveRow}>
        <Pressable onPress={onSave} disabled={isSaveDisabled} style={[sectionStyles.primaryButton, isSaveDisabled && styles.saveDisabled]}>
          <Text style={sectionStyles.primaryText}>SALVA</Text>
        </Pressable>
        {showSavedFeedback && <Text style={styles.savedText}>Salvato!</Text>}
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
  grid: {
    gap: spacing.sm,
  },
  field: {
    gap: spacing.xs,
  },
  saveRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  savedText: {
    color: colors.success,
    fontWeight: "700",
  },
  saveDisabled: {
    opacity: 0.5,
  },
});
