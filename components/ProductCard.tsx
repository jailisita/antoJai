import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { COLORS, RADIUS, SHADOW } from '../constants/theme';
import { formatCOP } from '../lib/format';

export default function ProductCard({ product }: { product: Product }) {
  const { addItem, items } = useCart();
  const available = product.is_available && product.stock > 0;
  const inCart = items.find((i) => i.product.id === product.id)?.quantity ?? 0;
  return (
    <Pressable
      style={({ pressed }) => [styles.card, SHADOW, pressed && { opacity: 0.92 }]}
      onPress={() => router.push(`/product/${product.id}`)}
    >
      <View style={styles.imageWrap}>
        {product.image_url ? (
          <Image source={{ uri: product.image_url }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.placeholder]}>
            <Ionicons name="fast-food-outline" size={34} color={COLORS.accent} />
          </View>
        )}
        {!available && (
          <View style={styles.soldOut}>
            <Text style={styles.soldOutText}>Agotado</Text>
          </View>
        )}
      </View>
      <Text numberOfLines={2} style={styles.name}>{product.name}</Text>
      <View style={styles.bottom}>
        <Text style={styles.price}>{formatCOP(product.price)}</Text>
        {available && inCart < product.stock && (
          <Pressable style={styles.addBtn} hitSlop={6} onPress={() => addItem(product)}>
            <Ionicons name="add" size={20} color="#fff" />
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '48%',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: 8,
    marginBottom: 14,
  },
  imageWrap: { aspectRatio: 1, borderRadius: RADIUS.md, overflow: 'hidden', marginBottom: 10 },
  image: { width: '100%', height: '100%' },
  placeholder: { backgroundColor: COLORS.soft, alignItems: 'center', justifyContent: 'center' },
  soldOut: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(59,18,38,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  soldOutText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  name: { fontSize: 13, color: COLORS.text, marginBottom: 6, minHeight: 34, fontWeight: '700', paddingHorizontal: 4 },
  bottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4, paddingBottom: 2 },
  price: { fontSize: 16, fontWeight: '800', color: COLORS.primaryDark },
  addBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
