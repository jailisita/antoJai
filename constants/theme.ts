import { Platform, ViewStyle } from 'react-native';

export const COLORS = {
  bg: '#FFF5F9',
  card: '#FFFFFF',
  text: '#3B1226',
  muted: '#9A7488',
  primary: '#DB2777', // rosa principal
  primaryDark: '#9D174D',
  accent: '#F472B6', // rosa claro / acentos
  soft: '#FCE7F3', // fondos suaves rosados
  softer: '#FDF2F8',
  dark: '#831843', // frambuesa profundo
  border: '#F8D7E8',
  success: '#16A34A',
  warning: '#D97706',
  danger: '#DC2626',
};

export const RADIUS = { sm: 10, md: 14, lg: 20, pill: 999 };

export const SHADOW: ViewStyle = Platform.select({
  ios: {
    shadowColor: '#BE185D',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  android: { elevation: 3 },
  default: { boxShadow: '0 4px 12px rgba(190, 24, 93, 0.12)' } as any,
}) as ViewStyle;

export const INPUT_STYLE = {
  backgroundColor: '#fff',
  borderWidth: 1.5,
  borderColor: COLORS.border,
  borderRadius: RADIUS.md,
  paddingHorizontal: 14,
  paddingVertical: 12,
  fontSize: 15,
  color: COLORS.text,
} as const;
