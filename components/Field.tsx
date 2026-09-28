import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { COLORS, INPUT_STYLE } from '../constants/theme';

export default function Field({
  label,
  hint,
  multiline,
  style,
  ...props
}: TextInputProps & { label: string; hint?: string }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor="#C9A6B9"
        multiline={multiline}
        style={[INPUT_STYLE, multiline && { minHeight: 84, textAlignVertical: 'top' }, style]}
        {...props}
      />
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: '700', color: COLORS.primaryDark, marginBottom: 6 },
  hint: { fontSize: 12, color: COLORS.muted, marginTop: 4 },
});
