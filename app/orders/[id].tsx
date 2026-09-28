import { useEffect, useState } from 'react';
import { FlatList, Image, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Order, OrderItem } from '../../types';
import OrderStatusBadge from '../../components/OrderStatusBadge';
import { COLORS, RADIUS, SHADOW } from '../../constants/theme';
import { formatCOP } from '../../lib/format';

export default function OrderDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);

  useEffect(() => {
    (async () => {
      const { data: o } = await supabase.from('orders').select('*').eq('id', id).single();
      setOrder(o as Order);
      const { data: its } = await supabase.from('order_items').select('*').eq('order_id', id);
      setItems(its ?? []);
    })();
  }, [id]);

  if (!order) return <View style={styles.container} />;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Detalle del pedido' }} />
      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: 16 }}
        ListHeaderComponent={
          <View style={styles.infoCard}>
            <Text style={styles.id}>Pedido #{order.id.slice(0, 8)}</Text>
            <OrderStatusBadge status={order.status} />
            <Text style={styles.infoLabel}>Contacto</Text>
            <Text style={styles.infoValue}>{order.contact_name} · {order.contact_phone}</Text>
            <Text style={styles.infoLabel}>Método de pago</Text>
            <Text style={styles.infoValue}>{order.payment_method === 'nequi' ? 'Nequi / Bre-B' : 'Efectivo contra entrega'}</Text>
            {order.delivery_note && (
              <>
                <Text style={styles.infoLabel}>Nota</Text>
                <Text style={styles.infoValue}>{order.delivery_note}</Text>
              </>
            )}
            {order.payment_proof_url && (
              <>
                <Text style={styles.infoLabel}>Comprobante enviado</Text>
                <Image source={{ uri: order.payment_proof_url }} style={styles.proof} />
              </>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.itemRow}>
            <Text style={styles.itemName} numberOfLines={2}>
              {item.quantity}x {item.product_name}
            </Text>
            <Text style={styles.itemPrice}>{formatCOP(item.unit_price * item.quantity)}</Text>
          </View>
        )}
        ListFooterComponent={
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatCOP(order.total)}</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  id: { fontSize: 18, fontWeight: '900', color: COLORS.text, marginBottom: 8 },
  infoCard: { backgroundColor: '#fff', borderRadius: RADIUS.lg, padding: 16, marginBottom: 14, ...SHADOW },
  infoLabel: { color: COLORS.muted, fontSize: 12, marginTop: 12 },
  infoValue: { color: COLORS.text, fontSize: 14, fontWeight: '700' },
  proof: { width: 120, height: 120, borderRadius: RADIUS.md, marginTop: 8 },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: RADIUS.md,
    marginBottom: 8,
  },
  itemName: { flex: 1, color: COLORS.text, marginRight: 8, fontWeight: '600' },
  itemPrice: { fontWeight: '800', color: COLORS.primaryDark },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 14, marginTop: 4 },
  totalLabel: { fontSize: 15, color: COLORS.muted },
  totalValue: { fontSize: 22, fontWeight: '900', color: COLORS.text },
});
