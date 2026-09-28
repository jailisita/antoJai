import { useCallback, useState } from 'react';
import { Alert, FlatList, Image, Linking, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { Order, OrderItem } from '../../../types';
import OrderStatusBadge from '../../../components/OrderStatusBadge';
import PrimaryButton from '../../../components/PrimaryButton';
import { COLORS, RADIUS, SHADOW } from '../../../constants/theme';
import { formatCOP, whatsappUrl } from '../../../lib/format';

export default function AdminOrderDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [updating, setUpdating] = useState(false);

  const load = useCallback(async () => {
    const { data: o } = await supabase.from('orders').select('*').eq('id', id).single();
    setOrder(o as Order);
    const { data: its } = await supabase.from('order_items').select('*').eq('order_id', id);
    setItems(its ?? []);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (!order) return <View style={{ flex: 1, backgroundColor: COLORS.bg }} />;

  const updateStatus = async (status: Order['status']) => {
    setUpdating(true);
    try {
      const { error } = await supabase.from('orders').update({ status, updated_at: new Date().toISOString() }).eq('id', order.id);
      if (error) throw error;
      await load();
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'No se pudo actualizar');
    } finally {
      setUpdating(false);
    }
  };

  const confirmCancel = () =>
    Alert.alert('Cancelar pedido', '¿Seguro que quieres cancelar este pedido?', [
      { text: 'No', style: 'cancel' },
      { text: 'Sí, cancelar', style: 'destructive', onPress: () => updateStatus('cancelado') },
    ]);

  const contactCustomer = () => {
    if (!order.contact_phone) return;
    const msg = `Hola ${order.contact_name ?? ''}, te escribimos de AntoJai sobre tu pedido #${order.id.slice(0, 8)} 🍢`;
    Linking.openURL(whatsappUrl(order.contact_phone, msg)).catch(() => Alert.alert('No se pudo abrir WhatsApp'));
  };

  const isNequi = order.payment_method === 'nequi';
  const needsReview = order.status === 'pago_reportado' || order.status === 'pendiente_confirmacion';
  const active = !['entregado', 'rechazado', 'cancelado'].includes(order.status);

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: COLORS.bg }}
      data={items}
      keyExtractor={(i) => i.id}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      ListHeaderComponent={
        <View style={[styles.infoCard, SHADOW]}>
          <Text style={styles.id}>Pedido #{order.id.slice(0, 8)}</Text>
          <OrderStatusBadge status={order.status} />
          <Text style={styles.infoLabel}>Cliente</Text>
          <Text style={styles.infoValue}>{order.contact_name} · {order.contact_phone}</Text>
          <Text style={styles.infoLabel}>Método de pago</Text>
          <Text style={styles.infoValue}>{isNequi ? 'Nequi / Bre-B' : 'Efectivo contra entrega'}</Text>
          <Text style={styles.infoLabel}>Fecha</Text>
          <Text style={styles.infoValue}>{new Date(order.created_at).toLocaleString('es-CO')}</Text>
          {order.delivery_note ? (
            <>
              <Text style={styles.infoLabel}>Nota del cliente</Text>
              <Text style={styles.infoValue}>{order.delivery_note}</Text>
            </>
          ) : null}
          {order.payment_proof_url ? (
            <>
              <Text style={styles.infoLabel}>Comprobante de pago</Text>
              <Image source={{ uri: order.payment_proof_url }} style={styles.proof} resizeMode="contain" />
            </>
          ) : null}
          {order.contact_phone ? (
            <View style={{ marginTop: 14 }}>
              <PrimaryButton title="Escribir por WhatsApp" variant="soft" icon="logo-whatsapp" onPress={contactCustomer} />
            </View>
          ) : null}
        </View>
      }
      renderItem={({ item }) => (
        <View style={styles.itemRow}>
          <Text style={styles.itemName} numberOfLines={2}>{item.quantity}x {item.product_name}</Text>
          <Text style={styles.itemPrice}>{formatCOP(item.unit_price * item.quantity)}</Text>
        </View>
      )}
      ListFooterComponent={
        <View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatCOP(order.total)}</Text>
          </View>

          {needsReview && (
            <>
              <PrimaryButton title={isNequi ? 'Confirmar pago' : 'Aceptar pedido'} icon="checkmark-circle-outline" onPress={() => updateStatus('confirmado')} loading={updating} />
              <View style={{ height: 10 }} />
              <PrimaryButton title={isNequi ? 'Rechazar pago' : 'Rechazar pedido'} variant="danger" onPress={() => updateStatus('rechazado')} disabled={updating} />
              <View style={{ height: 10 }} />
            </>
          )}
          {order.status === 'confirmado' && (
            <PrimaryButton title="Marcar en preparación" variant="dark" icon="flame-outline" onPress={() => updateStatus('en_preparacion')} loading={updating} />
          )}
          {order.status === 'en_preparacion' && (
            <PrimaryButton title="Marcar como listo" variant="dark" icon="bag-check-outline" onPress={() => updateStatus('listo')} loading={updating} />
          )}
          {order.status === 'listo' && (
            <PrimaryButton title="Marcar como entregado" icon="checkmark-done-outline" onPress={() => updateStatus('entregado')} loading={updating} />
          )}
          {active && !needsReview && (
            <>
              <View style={{ height: 10 }} />
              <PrimaryButton title="Cancelar pedido" variant="soft" onPress={confirmCancel} disabled={updating} />
            </>
          )}
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  id: { fontSize: 18, fontWeight: '900', color: COLORS.text, marginBottom: 8 },
  infoCard: { backgroundColor: '#fff', borderRadius: RADIUS.lg, padding: 16, marginBottom: 14 },
  infoLabel: { color: COLORS.muted, fontSize: 12, marginTop: 12 },
  infoValue: { color: COLORS.text, fontSize: 14, fontWeight: '700' },
  proof: { width: '100%', height: 280, borderRadius: RADIUS.md, marginTop: 8, backgroundColor: COLORS.softer },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#fff', padding: 14, borderRadius: RADIUS.md, marginBottom: 8 },
  itemName: { flex: 1, color: COLORS.text, marginRight: 8, fontWeight: '600' },
  itemPrice: { fontWeight: '800', color: COLORS.primaryDark },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 6, marginBottom: 14 },
  totalLabel: { fontSize: 15, color: COLORS.muted },
  totalValue: { fontSize: 24, fontWeight: '900', color: COLORS.text },
});
