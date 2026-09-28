import { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { Category } from '../../types';
import EmptyState from '../../components/EmptyState';
import { COLORS, INPUT_STYLE, RADIUS, SHADOW } from '../../constants/theme';

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const load = useCallback(async () => {
    const [c, p] = await Promise.all([
      supabase.from('categories').select('*').order('sort_order'),
      supabase.from('products').select('category_id'),
    ]);
    setCategories(c.data ?? []);
    const map: Record<string, number> = {};
    (p.data ?? []).forEach((x) => {
      if (x.category_id) map[x.category_id] = (map[x.category_id] ?? 0) + 1;
    });
    setCounts(map);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const addCategory = async () => {
    if (!name.trim()) return;
    setSaving(true);
    const { error } = await supabase.from('categories').insert({
      name: name.trim(),
      slug: slugify(name) + '-' + Date.now().toString(36),
      sort_order: categories.length,
    });
    setSaving(false);
    if (error) return Alert.alert('Error', error.message);
    setName('');
    load();
  };

  const saveEdit = async () => {
    if (!editingId || !editName.trim()) return;
    const { error } = await supabase.from('categories').update({ name: editName.trim() }).eq('id', editingId);
    if (error) return Alert.alert('Error', error.message);
    setEditingId(null);
    load();
  };

  const move = async (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= categories.length) return;
    const reordered = [...categories];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    setCategories(reordered);
    const results = await Promise.all(
      reordered.map((c, i) => supabase.from('categories').update({ sort_order: i }).eq('id', c.id))
    );
    const failed = results.find((r) => r.error);
    if (failed?.error) Alert.alert('Error', failed.error.message);
    load();
  };

  const removeCategory = (c: Category) => {
    Alert.alert('Eliminar categoría', `¿Eliminar "${c.name}"? Sus productos quedarán sin categoría.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('categories').delete().eq('id', c.id);
          if (error) Alert.alert('Error', error.message);
          load();
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.addRow}>
        <TextInput
          placeholder="Nueva categoría (ej: Empanadas)"
          placeholderTextColor="#C9A6B9"
          value={name}
          onChangeText={setName}
          onSubmitEditing={addCategory}
          style={[INPUT_STYLE, { flex: 1, marginRight: 10 }]}
        />
        <Pressable style={[styles.addBtn, SHADOW, saving && { opacity: 0.6 }]} onPress={addCategory} disabled={saving}>
          <Ionicons name="add" size={26} color="#fff" />
        </Pressable>
      </View>

      <FlatList
        data={categories}
        keyExtractor={(c) => c.id}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={<EmptyState icon="grid-outline" title="No hay categorías todavía" subtitle="Crea la primera arriba (ej: Empanadas, Bebidas)." />}
        renderItem={({ item, index }) => (
          <View style={[styles.row, SHADOW]}>
            <View style={styles.arrows}>
              <Pressable onPress={() => move(index, -1)} hitSlop={6} disabled={index === 0}>
                <Ionicons name="chevron-up" size={18} color={index === 0 ? '#E5D5DD' : COLORS.primary} />
              </Pressable>
              <Pressable onPress={() => move(index, 1)} hitSlop={6} disabled={index === categories.length - 1}>
                <Ionicons name="chevron-down" size={18} color={index === categories.length - 1 ? '#E5D5DD' : COLORS.primary} />
              </Pressable>
            </View>

            {editingId === item.id ? (
              <TextInput
                autoFocus
                value={editName}
                onChangeText={setEditName}
                onSubmitEditing={saveEdit}
                style={[INPUT_STYLE, { flex: 1, paddingVertical: 8 }]}
              />
            ) : (
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.count}>{counts[item.id] ?? 0} productos</Text>
              </View>
            )}

            {editingId === item.id ? (
              <>
                <Pressable onPress={saveEdit} style={styles.iconBtn}>
                  <Ionicons name="checkmark" size={20} color={COLORS.success} />
                </Pressable>
                <Pressable onPress={() => setEditingId(null)} style={styles.iconBtn}>
                  <Ionicons name="close" size={20} color={COLORS.muted} />
                </Pressable>
              </>
            ) : (
              <>
                <Pressable
                  onPress={() => {
                    setEditingId(item.id);
                    setEditName(item.name);
                  }}
                  style={styles.iconBtn}
                >
                  <Ionicons name="pencil-outline" size={18} color={COLORS.primary} />
                </Pressable>
                <Pressable onPress={() => removeCategory(item)} style={styles.iconBtn}>
                  <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
                </Pressable>
              </>
            )}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  addRow: { flexDirection: 'row', padding: 16, paddingBottom: 0, alignItems: 'center' },
  addBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 12, borderRadius: RADIUS.lg, marginBottom: 10 },
  arrows: { marginRight: 10, alignItems: 'center' },
  name: { fontSize: 15, color: COLORS.text, fontWeight: '800' },
  count: { fontSize: 12, color: COLORS.muted, marginTop: 1 },
  iconBtn: { padding: 8 },
});
