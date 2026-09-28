import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { Category, Product, StoreSettings } from '../types';
import ProductCard from '../components/ProductCard';
import CategoryChip from '../components/CategoryChip';
import EmptyState from '../components/EmptyState';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { COLORS, RADIUS, SHADOW } from '../constants/theme';

export default function Home() {
  const { session, isAdmin, profile } = useAuth();
  const { count } = useCart();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [{ data: cats }, { data: st }] = await Promise.all([
      supabase.from('categories').select('*').order('sort_order'),
      supabase.from('store_settings').select('*').eq('id', 1).single(),
    ]);
    setCategories(cats ?? []);
    setSettings(st as StoreSettings | null);

    let query = supabase.from('products').select('*').order('sort_order').order('created_at', { ascending: false });
    if (activeCategory) query = query.eq('category_id', activeCategory);
    if (search.trim()) query = query.ilike('name', `%${search.trim()}%`);
    const { data: prods } = await query;
    setProducts(prods ?? []);
    setLoading(false);
    setRefreshing(false);
  }, [activeCategory, search]);

  useEffect(() => {
    load();
  }, [load]);

  const firstName = profile?.full_name?.split(' ')[0];

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <View style={styles.blobA} />
        <View style={styles.blobB} />
        <View style={styles.topRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.hello}>{firstName ? `Hola, ${firstName} 💕` : '¿Se te antoja algo? 💕'}</Text>
            <Text style={styles.logo}>AntoJai 🍢</Text>
          </View>
          <Pressable onPress={() => router.push('/cart')} style={styles.iconBtn}>
            <Ionicons name="bag-handle-outline" size={22} color="#fff" />
            {count > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{count}</Text>
              </View>
            )}
          </Pressable>
          <Pressable onPress={() => router.push(session ? '/profile' : '/login')} style={[styles.iconBtn, { marginLeft: 10 }]}>
            <Ionicons name="person-outline" size={22} color="#fff" />
          </Pressable>
        </View>

        <View style={styles.searchWrap}>
          <Ionicons name="search" size={18} color={COLORS.accent} />
          <TextInput
            placeholder="Buscar empanadas, papas..."
            placeholderTextColor="#C9A6B9"
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={COLORS.muted} />
            </Pressable>
          )}
        </View>
      </View>

      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: 'space-between' }}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
        ListHeaderComponent={
          <View>
            {isAdmin && (
              <Pressable style={styles.adminBanner} onPress={() => router.push('/admin')}>
                <Ionicons name="sparkles" size={16} color="#fff" />
                <Text style={styles.adminBannerText}>Ir al panel de administración</Text>
                <Ionicons name="chevron-forward" size={16} color="#fff" />
              </Pressable>
            )}

            {(settings?.opening_hours || settings?.address) && (
              <View style={styles.infoCard}>
                {settings?.opening_hours ? (
                  <View style={styles.infoRow}>
                    <Ionicons name="time-outline" size={15} color={COLORS.primary} />
                    <Text style={styles.infoText}>{settings.opening_hours}</Text>
                  </View>
                ) : null}
                {settings?.address ? (
                  <View style={styles.infoRow}>
                    <Ionicons name="location-outline" size={15} color={COLORS.primary} />
                    <Text style={styles.infoText}>{settings.address}</Text>
                  </View>
                ) : null}
              </View>
            )}

            {categories.length > 0 && (
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={categories}
                keyExtractor={(c) => c.id}
                style={{ marginBottom: 16 }}
                renderItem={({ item }) => (
                  <CategoryChip
                    label={item.name}
                    active={activeCategory === item.id}
                    onPress={() => setActiveCategory(activeCategory === item.id ? null : item.id)}
                  />
                )}
                ListHeaderComponent={
                  <CategoryChip label="Todo" active={activeCategory === null} onPress={() => setActiveCategory(null)} />
                }
              />
            )}
          </View>
        }
        renderItem={({ item }) => <ProductCard product={item} />}
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              icon="cafe-outline"
              title={search ? 'No encontramos eso' : 'Aún no hay productos'}
              subtitle={search ? 'Prueba con otra palabra.' : 'Vuelve pronto, estamos preparando el menú.'}
            />
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  hero: {
    backgroundColor: COLORS.primary,
    paddingTop: 56,
    paddingBottom: 22,
    paddingHorizontal: 18,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
  },
  blobA: { position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(255,255,255,0.12)', top: -50, right: -40 },
  blobB: { position: 'absolute', width: 110, height: 110, borderRadius: 55, backgroundColor: 'rgba(255,255,255,0.10)', bottom: -30, left: -20 },
  topRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  hello: { color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '600' },
  logo: { color: '#fff', fontSize: 28, fontWeight: '900', letterSpacing: 0.3 },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: '#fff',
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { color: COLORS.primary, fontSize: 11, fontWeight: '900' },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    borderRadius: RADIUS.pill,
  },
  searchInput: { flex: 1, paddingVertical: 12, paddingHorizontal: 8, fontSize: 14, color: COLORS.text },
  list: { padding: 16, paddingTop: 18 },
  adminBanner: {
    backgroundColor: COLORS.dark,
    padding: 12,
    borderRadius: RADIUS.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  adminBannerText: { color: '#fff', fontWeight: '800', marginHorizontal: 8, fontSize: 13 },
  infoCard: { backgroundColor: '#fff', borderRadius: RADIUS.md, padding: 12, marginBottom: 14, ...SHADOW },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 2 },
  infoText: { color: COLORS.text, fontSize: 13, marginLeft: 8, flex: 1 },
});
