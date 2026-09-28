import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { Order, OrderStatus } from '../../../types';
import OrderStatusBadge from '../../../components/OrderStatusBadge';
import EmptyState from '../../../components/EmptyState';
import CategoryChip from '../../../components/CategoryChip';
import { COLORS, RADIUS, SHADOW } from '../../../constants/theme';
import { formatCOP } from '../../../lib/format';

const FILTERS: { key: string; label: string; statuses: OrderStatus[] | null }[] = [
  { key: 'attend', label: 'Por atender', statuses: ['pendiente_confirmacion', 'pago_reportado'] },
  { key: 'progress', label: 'En curso', statuses: ['confirmado', 'en_preparacion', 'listo'] },
  { key: 'done', label: 'Finalizados', statuses: ['entregado', 'rechazado', 'cancelado'] },
  { key: 'all', label: 'Todos', statuses: null },
];

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState('attend');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    setOrders(data ?? []);
    setRefreshing(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    FILTERS.forEach((f) => (c[f.key] = f.statuses ? orders.filter((o) => f.statuses!.includes(o.status)).length : orders.length));
    return c;
  }, [orders]);

  const visible = useMemo(() => {
    const f = FILTERS.find((x) => x.key === filter)!;
    return f.statuses ? orders.filter((o) => f.statuses!.includes(o.status)) : orders;
  }, [orders, filter]);

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={FILTERS}
        keyExtractor={(f) => f.key}
        style={{ flexGrow: 0, paddingLeft: 16, paddingTop: 14, paddingBottom: 4 }}
        renderItem={({ item }) => (
          <CategoryChip label={`${item.label} (${counts[item.key] ?? 0})`} active={filter === item.key} onPress={() => setFilter(item.key)} />
        )}
      />
      <FlatList
        contentContainerStyle={{ padding: 16 }}
        data={visible}
        keyExtractor={(o) => o.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={<EmptyState icon="receipt-outline" title="No hay pedidos aquí" subtitle="Desliza hacia abajo para actualizar." />}
        renderItem={({ item }) => (
          <Pressable style={[styles.card, SHADOW]} onPress={() => router.push(`/admin/orders/${item.id}`)}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={styles.name} numberOfLines={1}>{item.contact_name || 'Cliente'}</Text>
              <Text style={styles.meta}>#{item.id.slice(0, 8)} · {item.payment_method === 'nequi' ? 'Nequi / Bre-B' : 'Efectivo'}</Text>
              <Text style={styles.meta}>{new Date(item.created_at).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.total}>{formatCOP(item.total)}</Text>
              <OrderStatusBadge status={item.status} />
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#fff', padding: 16, borderRadius: RADIUS.lg, marginBottom: 12 },
  name: { fontWeight: '800', color: COLORS.text, fontSize: 15, marginBottom: 4 },
  meta: { color: COLORS.muted, fontSize: 12, marginTop: 1 },
  total: { fontWeight: '900', color: COLORS.primaryDark, marginBottom: 6, fontSize: 16 },
});
