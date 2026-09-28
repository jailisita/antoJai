import { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { Category, Product } from '../../types';
import PrimaryButton from '../../components/PrimaryButton';
import { useCart } from '../../context/CartContext';
import { COLORS, RADIUS } from '../../constants/theme';
import { formatCOP } from '../../lib/format';

export default function ProductDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [added, setAdded] = useState(false);
  const { addItem } = useCart();

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('products').select('*').eq('id', id).single();
      setProduct(data as Product);
      if (data?.category_id) {
        const { data: cat } = await supabase.from('categories').select('*').eq('id', data.category_id).single();
        setCategory(cat as Category);
      }
    })();
  }, [id]);

  if (!product) return <View style={styles.container} />;

  const available = product.is_available && product.stock > 0;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: '', headerTransparent: true }} />
      <ScrollView>
        {product.image_url ? (
          <Image source={{ uri: product.image_url }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={[styles.image, styles.placeholder]}>
            <Ionicons name="fast-food-outline" size={64} color={COLORS.accent} />
          </View>
        )}
        <View style={styles.body}>
          <View style={styles.pillsRow}>
            {category && (
              <View style={styles.pill}>
                <Text style={styles.pillText}>{category.name}</Text>
              </View>
            )}
            <View style={[styles.pill, { backgroundColor: available ? '#DCFCE7' : '#FEE2E2' }]}>
              <Text style={[styles.pillText, { color: available ? COLORS.success : COLORS.danger }]}>
                {available ? `Disponible · quedan ${product.stock}` : 'Agotado por ahora'}
              </Text>
            </View>
          </View>
          <Text style={styles.name}>{product.name}</Text>
          <Text style={styles.price}>{formatCOP(product.price)}</Text>
          {product.description ? <Text style={styles.description}>{product.description}</Text> : null}
          {product.extra_info ? (
            <View style={styles.extraBox}>
              <Ionicons name="information-circle-outline" size={18} color={COLORS.primary} />
              <Text style={styles.extraInfo}>{product.extra_info}</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={{ flex: 1, marginRight: 10 }}>
          <PrimaryButton
            title={added ? 'Agregado ✓' : 'Al carrito'}
            variant="outline"
            icon="bag-add-outline"
            disabled={!available}
            onPress={() => {
              addItem(product);
              setAdded(true);
              setTimeout(() => setAdded(false), 1200);
            }}
          />
        </View>
        <View style={{ flex: 1 }}>
          <PrimaryButton
            title="Pedir ahora"
            disabled={!available}
            onPress={() => {
              addItem(product);
              router.push('/checkout');
            }}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  image: { width: '100%', aspectRatio: 1, maxHeight: 380, backgroundColor: COLORS.soft },
  placeholder: { backgroundColor: COLORS.soft, alignItems: 'center', justifyContent: 'center' },
  body: {
    padding: 20,
    marginTop: -28,
    backgroundColor: COLORS.bg,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  pillsRow: { flexDirection: 'row', marginBottom: 12 },
  pill: { backgroundColor: COLORS.soft, paddingHorizontal: 12, paddingVertical: 5, borderRadius: RADIUS.pill, marginRight: 8 },
  pillText: { color: COLORS.primaryDark, fontSize: 12, fontWeight: '800' },
  name: { fontSize: 24, fontWeight: '900', color: COLORS.text, marginBottom: 6 },
  price: { fontSize: 28, fontWeight: '900', color: COLORS.primary, marginBottom: 14 },
  description: { color: COLORS.text, lineHeight: 22, fontSize: 15, marginBottom: 12 },
  extraBox: { flexDirection: 'row', backgroundColor: COLORS.soft, borderRadius: RADIUS.md, padding: 12, alignItems: 'flex-start' },
  extraInfo: { color: COLORS.primaryDark, lineHeight: 19, fontSize: 13, marginLeft: 8, flex: 1 },
  footer: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 30,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
});
