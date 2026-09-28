import { StyleSheet, Text, View } from 'react-native';
import { OrderStatus } from '../types';
import { COLORS } from '../constants/theme';

export const STATUS_LABELS: Record<OrderStatus, string> = {
  pendiente_confirmacion: 'Pendiente de confirmación',
  pago_reportado: 'Pago en revisión',
  confirmado: 'Confirmado',
  en_preparacion: 'En preparación',
  listo: 'Listo para recoger/entregar',
  entregado: 'Entregado',
  rechazado: 'Rechazado',
  cancelado: 'Cancelado',
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  pendiente_confirmacion: COLORS.muted,
  pago_reportado: COLORS.warning,
  confirmado: COLORS.success,
  en_preparacion: COLORS.primary,
  listo: COLORS.primaryDark,
  entregado: COLORS.success,
  rechazado: COLORS.danger,
  cancelado: COLORS.danger,
};

export default function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const color = STATUS_COLORS[status];
  return (
    <View style={[styles.badge, { backgroundColor: color + '1F' }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.text, { color }]}>{STATUS_LABELS[status]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  dot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  text: { fontSize: 12, fontWeight: '700' },
});
