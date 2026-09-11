import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { sectionStyles } from "./sharedStyles";

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
}: SettingsSectionProps) {
  return (
    <View style={sectionStyles.card}>
      <Text style={sectionStyles.sectionTitle}>Promemoria</Text>

      <Text style={sectionStyles.label}>Minuti prima della chiusura formazione</Text>
      <TextInput value={inputMinutes} onChangeText={onChangeMinutes} keyboardType="number-pad" style={sectionStyles.input} />

      <Text style={sectionStyles.label}>Minuti anticipo chiusura lega (default 15)</Text>
      <TextInput value={inputLockMinutes} onChangeText={onChangeLockMinutes} keyboardType="number-pad" style={sectionStyles.input} />

      <Text style={sectionStyles.label}>Numero max notifiche extra (opzionale, 0 = solo una)</Text>
      <TextInput
        value={inputMaxNotifications}
        onChangeText={onChangeMaxNotifications}
        keyboardType="number-pad"
        style={sectionStyles.input}
      />

      {Number.parseInt(inputMaxNotifications, 10) > 0 && (
        <>
          <Text style={sectionStyles.label}>Ogni quanti minuti ripetere (opzionale)</Text>
          <TextInput
            value={inputRepeatMinutes}
            onChangeText={onChangeRepeatMinutes}
            keyboardType="number-pad"
            style={sectionStyles.input}
          />
        </>
      )}

      <TouchableOpacity style={sectionStyles.primaryButton} onPress={onSave}>
        <Text style={sectionStyles.primaryText}>Salva</Text>
      </TouchableOpacity>
    </View>
  );
}
