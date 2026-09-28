import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import PrimaryButton from '../components/PrimaryButton';
import EmptyState from '../components/EmptyState';
import { COLORS, RADIUS, SHADOW } from '../constants/theme';
import { formatCOP } from '../lib/format';

export default function Cart() {
  const { items, setQuantity, removeItem, total } = useCart();
  const { session } = useAuth();

  if (items.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
        <Stack.Screen options={{ title: 'Mi carrito' }} />
        <EmptyState
          icon="bag-handle-outline"
          title="Tu carrito está vacío"
          subtitle="Agrega productos desde el menú para verlos aquí."
        />
        <View style={{ padding: 20, paddingBottom: 40 }}>
          <PrimaryButton title="Ver el menú" onPress={() => router.replace('/')} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Mi carrito' }} />
      <FlatList
        data={items}
        keyExtractor={(i) => i.product.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <View style={styles.row}>
            {item.product.image_url ? (
              <Image source={{ uri: item.product.image_url }} style={styles.thumb} />
            ) : (
              <View style={[styles.thumb, { backgroundColor: COLORS.soft }]} />
            )}
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text numberOfLines={2} style={styles.name}>{item.product.name}</Text>
              <Text style={styles.price}>{formatCOP(item.product.price * item.quantity)}</Text>
              <View style={styles.qtyRow}>
                <Pressable onPress={() => setQuantity(item.product.id, item.quantity - 1)} style={styles.qtyBtn}>
                  <Ionicons name="remove" size={16} color={COLORS.primary} />
                </Pressable>
                <Text style={styles.qtyText}>{item.quantity}</Text>
                <Pressable onPress={() => setQuantity(item.product.id, item.quantity + 1)} style={styles.qtyBtn}>
                  <Ionicons name="add" size={16} color={COLORS.primary} />
                </Pressable>
              </View>
            </View>
            <Pressable onPress={() => removeItem(item.product.id)} hitSlop={8} style={{ padding: 4 }}>
              <Ionicons name="trash-outline" size={19} color={COLORS.danger} />
            </Pressable>
          </View>
        )}
      />
      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{formatCOP(total)}</Text>
        </View>
        <PrimaryButton
          title="Continuar pedido"
          onPress={() => router.push(session ? '/checkout' : '/login?redirect=/checkout')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: RADIUS.lg,
    padding: 10,
    marginBottom: 12,
    ...SHADOW,
  },
  thumb: { width: 72, height: 72, borderRadius: RADIUS.md },
  name: { fontSize: 14, color: COLORS.text, marginBottom: 2, fontWeight: '700' },
  price: { fontSize: 15, fontWeight: '800', color: COLORS.primary, marginBottom: 8 },
  qtyRow: { flexDirection: 'row', alignItems: 'center' },
  qtyBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: { marginHorizontal: 14, fontWeight: '800', color: COLORS.text, fontSize: 15 },
  footer: { padding: 18, paddingBottom: 32, backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  totalLabel: { fontSize: 15, color: COLORS.muted, fontWeight: '600' },
  totalValue: { fontSize: 24, fontWeight: '900', color: COLORS.text },
});
