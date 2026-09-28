import { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, Image, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../lib/supabase';
import { Category, Product } from '../../../types';
import EmptyState from '../../../components/EmptyState';
import CategoryChip from '../../../components/CategoryChip';
import { COLORS, RADIUS, SHADOW } from '../../../constants/theme';
import { formatCOP } from '../../../lib/format';

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [activeCat, setActiveCat] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [p, c] = await Promise.all([
      supabase.from('products').select('*').order('created_at', { ascending: false }),
      supabase.from('categories').select('*').order('sort_order'),
    ]);
    setProducts(p.data ?? []);
    setCategories(c.data ?? []);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => (!q || p.name.toLowerCase().includes(q)) && (!activeCat || p.category_id === activeCat));
  }, [products, search, activeCat]);

  const toggleAvailable = async (p: Product, value: boolean) => {
    setProducts((prev) => prev.map((x) => (x.id === p.id ? { ...x, is_available: value } : x)));
    const { error } = await supabase.from('products').update({ is_available: value }).eq('id', p.id);
    if (error) {
      Alert.alert('Error', error.message);
      load();
    }
  };

  const remove = (p: Product) => {
    Alert.alert('Eliminar producto', `¿Eliminar "${p.name}"? Los pedidos anteriores conservan su registro.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('products').delete().eq('id', p.id);
          if (error) Alert.alert('Error', error.message);
          load();
        },
      },
    ]);
  };

  const catName = (id: string | null) => categories.find((c) => c.id === id)?.name;

  return (
    <View style={styles.container}>
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color={COLORS.accent} />
        <TextInput
          placeholder="Buscar producto..."
          placeholderTextColor="#C9A6B9"
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
        />
      </View>

      {categories.length > 0 && (
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categories}
          keyExtractor={(c) => c.id}
          style={{ flexGrow: 0, marginTop: 12, paddingLeft: 16 }}
          renderItem={({ item }) => (
            <CategoryChip label={item.name} active={activeCat === item.id} onPress={() => setActiveCat(activeCat === item.id ? null : item.id)} />
          )}
          ListHeaderComponent={<CategoryChip label="Todos" active={activeCat === null} onPress={() => setActiveCat(null)} />}
        />
      )}

      <FlatList
        data={filtered}
        keyExtractor={(p) => p.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        ListEmptyComponent={
          <EmptyState icon="fast-food-outline" title={products.length ? 'Sin resultados' : 'Aún no has publicado productos'} subtitle={products.length ? undefined : 'Toca el botón + para crear el primero.'} />
        }
        renderItem={({ item }) => (
          <Pressable style={[styles.row, SHADOW]} onPress={() => router.push(`/admin/products/${item.id}`)}>
            {item.image_url ? (
              <Image source={{ uri: item.image_url }} style={styles.thumb} />
            ) : (
              <View style={[styles.thumb, styles.thumbEmpty]}>
                <Ionicons name="image-outline" size={22} color={COLORS.accent} />
              </View>
            )}
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text numberOfLines={1} style={styles.name}>{item.name}</Text>
              <Text style={styles.price}>{formatCOP(item.price)}</Text>
              {catName(item.category_id) && <Text style={styles.cat}>{catName(item.category_id)}</Text>}
            </View>
            <View style={{ alignItems: 'center' }}>
              <Switch
                value={item.is_available}
                onValueChange={(v) => toggleAvailable(item, v)}
                trackColor={{ true: COLORS.accent, false: '#E5D5DD' }}
                thumbColor={item.is_available ? COLORS.primary : '#f4f3f4'}
              />
              <Text style={[styles.avail, { color: item.is_available ? COLORS.success : COLORS.muted }]}>
                {item.is_available ? 'Disponible' : 'Agotado'}
              </Text>
            </View>
            <Pressable onPress={() => remove(item)} hitSlop={8} style={{ marginLeft: 10 }}>
              <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
            </Pressable>
          </Pressable>
        )}
      />

      <Pressable style={[styles.fab, SHADOW]} onPress={() => router.push('/admin/products/new')}>
        <Ionicons name="add" size={24} color="#fff" />
        <Text style={styles.fabText}>Nuevo producto</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 14,
    paddingHorizontal: 14,
    borderRadius: RADIUS.pill,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  searchInput: { flex: 1, paddingVertical: 11, paddingHorizontal: 8, fontSize: 14, color: COLORS.text },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 10, borderRadius: RADIUS.lg, marginBottom: 10 },
  thumb: { width: 60, height: 60, borderRadius: RADIUS.md },
  thumbEmpty: { backgroundColor: COLORS.soft, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 15, fontWeight: '800', color: COLORS.text },
  price: { fontSize: 14, color: COLORS.primary, fontWeight: '800', marginTop: 2 },
  cat: { fontSize: 11, color: COLORS.muted, marginTop: 2 },
  avail: { fontSize: 10, fontWeight: '800', marginTop: 2 },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: RADIUS.pill,
  },
  fabText: { color: '#fff', fontWeight: '800', marginLeft: 6 },
});
