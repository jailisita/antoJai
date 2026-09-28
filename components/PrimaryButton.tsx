import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SHADOW } from '../constants/theme';

type Variant = 'primary' | 'dark' | 'danger' | 'outline' | 'soft';

export default function PrimaryButton({
  title,
  onPress,
  loading,
  disabled,
  variant = 'primary',
  icon,
}: {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: Variant;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  const bg: Record<Variant, string> = {
    primary: COLORS.primary,
    dark: COLORS.dark,
    danger: COLORS.danger,
    outline: '#fff',
    soft: COLORS.soft,
  };
  const fg = variant === 'outline' ? COLORS.primaryDark : variant === 'soft' ? COLORS.primaryDark : '#fff';
  const filled = variant === 'primary' || variant === 'dark' || variant === 'danger';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.btn,
        filled && SHADOW,
        {
          backgroundColor: bg[variant],
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
          borderWidth: variant === 'outline' ? 1.5 : 0,
          borderColor: COLORS.primary,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={18} color={fg} style={{ marginRight: 8 }} />}
          <Text style={[styles.text, { color: fg }]}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    paddingVertical: 15,
    paddingHorizontal: 18,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { fontWeight: '800', fontSize: 15, letterSpacing: 0.2 },
});
