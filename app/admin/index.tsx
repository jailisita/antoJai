import { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { formatCOP } from '../../lib/format';
import { COLORS, RADIUS, SHADOW } from '../../constants/theme';

type Stats = { pending: number; inProgress: number; salesToday: number; ordersToday: number; products: number; soldOut: number };

const ITEMS = [
  { title: 'Pedidos', subtitle: 'Confirma pagos y avanza entregas', icon: 'receipt-outline', href: '/admin/orders' },
  { title: 'Productos', subtitle: 'Crea, edita y activa/desactiva', icon: 'fast-food-outline', href: '/admin/products' },
  { title: 'Categorías', subtitle: 'Organiza y ordena el menú', icon: 'grid-outline', href: '/admin/categories' },
  { title: 'Tienda y pagos', subtitle: 'QR, llave Nequi/Bre-B, horario', icon: 'storefront-outline', href: '/admin/settings' },
] as const;

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const [orders, today, products] = await Promise.all([
      supabase.from('orders').select('status'),
      supabase.from('orders').select('total,status').gte('created_at', start.toISOString()),
      supabase.from('products').select('is_available'),
    ]);

    const o = orders.data ?? [];
    const t = (today.data ?? []).filter((x) => x.status !== 'rechazado' && x.status !== 'cancelado');
    const p = products.data ?? [];
    setStats({
      pending: o.filter((x) => x.status === 'pendiente_confirmacion' || x.status === 'pago_reportado').length,
      inProgress: o.filter((x) => ['confirmado', 'en_preparacion', 'listo'].includes(x.status)).length,
      salesToday: t.reduce((sum, x) => sum + Number(x.total), 0),
      ordersToday: t.length,
      products: p.length,
      soldOut: p.filter((x) => !x.is_available).length,
    });
    setRefreshing(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 40 }}
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
    >
      <View style={styles.hero}>
        <Text style={styles.heroLabel}>Ventas de hoy</Text>
        <Text style={styles.heroValue}>{formatCOP(stats?.salesToday ?? 0)}</Text>
        <Text style={styles.heroSub}>{stats?.ordersToday ?? 0} pedidos hoy</Text>
      </View>

      <View style={styles.statsRow}>
        <Pressable style={[styles.stat, SHADOW]} onPress={() => router.push('/admin/orders')}>
          <Text style={[styles.statValue, (stats?.pending ?? 0) > 0 && { color: COLORS.warning }]}>{stats?.pending ?? '–'}</Text>
          <Text style={styles.statLabel}>Por atender</Text>
        </Pressable>
        <Pressable style={[styles.stat, SHADOW]} onPress={() => router.push('/admin/orders')}>
          <Text style={styles.statValue}>{stats?.inProgress ?? '–'}</Text>
          <Text style={styles.statLabel}>En curso</Text>
        </Pressable>
        <Pressable style={[styles.stat, SHADOW]} onPress={() => router.push('/admin/products')}>
          <Text style={styles.statValue}>{stats?.products ?? '–'}</Text>
          <Text style={styles.statLabel}>{stats?.soldOut ? `Productos (${stats.soldOut} agot.)` : 'Productos'}</Text>
        </Pressable>
      </View>

      <View style={{ paddingHorizontal: 16 }}>
        <Text style={styles.section}>Administrar</Text>
        {ITEMS.map((item) => (
          <Pressable key={item.href} style={({ pressed }) => [styles.card, SHADOW, pressed && { opacity: 0.9 }]} onPress={() => router.push(item.href)}>
            <View style={styles.iconWrap}>
              <Ionicons name={item.icon as any} size={22} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.subtitle}>{item.subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.accent} />
          </Pressable>
        ))}
        <Pressable style={styles.viewStore} onPress={() => router.replace('/')}>
          <Ionicons name="eye-outline" size={16} color={COLORS.primaryDark} />
          <Text style={styles.viewStoreText}>Ver la tienda como cliente</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  hero: {
    backgroundColor: COLORS.dark,
    padding: 24,
    paddingBottom: 56,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  heroLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: '600' },
  heroValue: { color: '#fff', fontSize: 34, fontWeight: '900', marginTop: 2 },
  heroSub: { color: COLORS.accent, fontSize: 13, fontWeight: '700', marginTop: 2 },
  statsRow: { flexDirection: 'row', paddingHorizontal: 16, marginTop: -34, marginBottom: 8 },
  stat: { flex: 1, backgroundColor: '#fff', borderRadius: RADIUS.lg, padding: 14, marginHorizontal: 4, alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: '900', color: COLORS.primaryDark },
  statLabel: { fontSize: 11, color: COLORS.muted, fontWeight: '700', marginTop: 2, textAlign: 'center' },
  section: { fontSize: 14, fontWeight: '800', color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginVertical: 14 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: RADIUS.lg, padding: 16, marginBottom: 12 },
  iconWrap: { width: 46, height: 46, borderRadius: 23, backgroundColor: COLORS.soft, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  title: { fontSize: 16, fontWeight: '800', color: COLORS.text },
  subtitle: { fontSize: 12, color: COLORS.muted, marginTop: 2 },
  viewStore: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14 },
  viewStoreText: { color: COLORS.primaryDark, fontWeight: '700', marginLeft: 6 },
});
