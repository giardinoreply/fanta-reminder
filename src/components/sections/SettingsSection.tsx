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
      <Text style={sectionStyles.sectionTitle}>Promemoria</Text>

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

      <Text style={sectionStyles.label} onPress={() => lockMinutesRef.current?.focus()}>
        Minuti anticipo chiusura lega (default 15)
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

      <Text style={sectionStyles.label} onPress={() => maxNotificationsRef.current?.focus()}>
        Numero max notifiche extra (opzionale, 0 = solo una)
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

      {Number.parseInt(inputMaxNotifications, 10) > 0 && (
        <>
          <Text style={sectionStyles.label} onPress={() => repeatMinutesRef.current?.focus()}>
            Ogni quanti minuti ripetere (opzionale)
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
        </>
      )}

      <View style={styles.saveRow}>
        <Pressable onPress={onSave} disabled={isSaveDisabled} style={[sectionStyles.primaryButton, isSaveDisabled && styles.saveDisabled]}>
          <Text style={sectionStyles.primaryText}>Salva</Text>
        </Pressable>
        {showSavedFeedback && <Text style={styles.savedText}>Salvato!</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
