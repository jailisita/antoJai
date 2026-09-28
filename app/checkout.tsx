import { useEffect, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, Stack } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../lib/supabase';
import { uploadImageToCloudinary } from '../lib/cloudinary';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { PaymentMethod, StoreSettings } from '../types';
import PrimaryButton from '../components/PrimaryButton';
import Field from '../components/Field';
import { COLORS, RADIUS, SHADOW } from '../constants/theme';
import { formatCOP } from '../lib/format';

export default function Checkout() {
  const { session } = useAuth();
  const { items, total, clear } = useCart();
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('nequi');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');
  const [proofUri, setProofUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase
      .from('store_settings')
      .select('*')
      .eq('id', 1)
      .single()
      .then(({ data }) => setSettings(data as StoreSettings));
  }, []);

  useEffect(() => {
    if (!session) router.replace('/login?redirect=/checkout');
  }, [session]);

  if (!session) return null;

  const pickProof = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return Alert.alert('Necesitamos acceso a tus fotos para subir el comprobante');
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
    if (!result.canceled) setProofUri(result.assets[0].uri);
  };

  const submitOrder = async () => {
    if (items.length === 0) return Alert.alert('Tu carrito está vacío');
    if (!name.trim() || !phone.trim()) return Alert.alert('Ingresa tu nombre y teléfono de contacto');
    if (paymentMethod === 'nequi' && !proofUri) {
      return Alert.alert('Sube el pantallazo del pago por Nequi / Bre-B antes de continuar');
    }

    setSubmitting(true);
    try {
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: session.user.id,
          status: paymentMethod === 'nequi' ? 'pago_reportado' : 'pendiente_confirmacion',
          payment_method: paymentMethod,
          total,
          contact_name: name.trim(),
          contact_phone: phone.trim(),
          delivery_note: note.trim() || null,
        })
        .select()
        .single();
      if (orderError || !order) throw orderError;

      const itemsPayload = items.map((i) => ({
        order_id: order.id,
        product_id: i.product.id,
        product_name: i.product.name,
        unit_price: i.product.price,
        quantity: i.quantity,
      }));
      const { error: itemsError } = await supabase.from('order_items').insert(itemsPayload);
      if (itemsError) throw itemsError;

      if (paymentMethod === 'nequi' && proofUri) {
        const uploaded = await uploadImageToCloudinary(proofUri, 'payment-proofs');
        await supabase.from('orders').update({ payment_proof_url: uploaded.url }).eq('id', order.id);
      }

      clear();
      router.replace(`/orders/${order.id}`);
    } catch (e: any) {
      Alert.alert('No pudimos registrar tu pedido', e?.message ?? 'Intenta de nuevo');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 18 }}>
      <Stack.Screen options={{ title: 'Confirmar pedido' }} />
      <View style={styles.totalBox}>
        <Text style={styles.totalLabel}>Total a pagar</Text>
        <Text style={styles.total}>{formatCOP(total)}</Text>
      </View>

      <Text style={styles.label}>¿Cómo vas a pagar?</Text>
      <View style={styles.methodRow}>
        <Pressable
          style={[styles.methodBtn, paymentMethod === 'nequi' && styles.methodBtnActive]}
          onPress={() => setPaymentMethod('nequi')}
        >
          <Text style={[styles.methodText, paymentMethod === 'nequi' && styles.methodTextActive]}>Nequi / Bre-B</Text>
        </Pressable>
        {settings?.accepts_cash !== false && (
          <Pressable
            style={[styles.methodBtn, paymentMethod === 'efectivo' && styles.methodBtnActive]}
            onPress={() => setPaymentMethod('efectivo')}
          >
            <Text style={[styles.methodText, paymentMethod === 'efectivo' && styles.methodTextActive]}>Efectivo contra entrega</Text>
          </Pressable>
        )}
      </View>

      {paymentMethod === 'nequi' && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Paga con Nequi / Llave Bre-B</Text>
          {settings?.qr_image_url ? (
            <Image source={{ uri: settings.qr_image_url }} style={styles.qr} />
          ) : (
            <Text style={styles.muted}>El vendedor aún no ha configurado el QR de pago.</Text>
          )}
          {settings?.nequi_key ? <Text style={styles.key}>Llave Bre-B / Nequi: {settings.nequi_key}</Text> : null}
          <Text style={styles.instructions}>
            {settings?.payment_instructions ||
              'Escanea el QR o usa la llave para transferir el valor exacto y luego sube el pantallazo del pago.'}
          </Text>
        </View>
      )}

      <View style={{ height: 8 }} />
      <Field label="Tu nombre" value={name} onChangeText={setName} placeholder="¿Cómo te llamas?" />
      <Field label="Teléfono de contacto" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="300 000 0000" />
      <Field
        label="Nota (recoges o te lo llevamos, dirección, etc.)"
        value={note}
        onChangeText={setNote}
        multiline
        placeholder="Ej: Paso a recogerlo en 20 min / Entregar en Cra 5 #10-20"
      />

      {paymentMethod === 'nequi' && (
        <>
          <Text style={styles.label}>Comprobante de pago</Text>
          <PrimaryButton title={proofUri ? 'Cambiar comprobante' : 'Subir pantallazo del pago'} variant="outline" onPress={pickProof} />
          {proofUri && <Image source={{ uri: proofUri }} style={styles.proof} />}
        </>
      )}

      <View style={{ height: 20 }} />
      <PrimaryButton title="Confirmar pedido" onPress={submitOrder} loading={submitting} />
      <Text style={styles.note}>
        {paymentMethod === 'nequi'
          ? 'Tu pedido quedará en revisión hasta que el vendedor confirme el pago recibido.'
          : 'Tu pedido quedará pendiente de confirmación; pagas en efectivo al recibirlo.'}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  totalBox: { backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, padding: 18, marginBottom: 18, ...SHADOW },
  totalLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '600' },
  total: { fontSize: 30, fontWeight: '900', color: '#fff' },
  label: { fontSize: 13, fontWeight: '700', color: COLORS.primaryDark, marginBottom: 8, marginTop: 4 },
  methodRow: { flexDirection: 'row', marginBottom: 6 },
  methodBtn: {
    flex: 1,
    padding: 13,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: '#fff',
    marginRight: 8,
    alignItems: 'center',
  },
  methodBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  methodText: { fontSize: 13, fontWeight: '800', color: COLORS.primaryDark },
  methodTextActive: { color: '#fff' },
  card: { backgroundColor: '#fff', borderRadius: RADIUS.lg, padding: 16, marginTop: 14, marginBottom: 10, alignItems: 'center', ...SHADOW },
  cardTitle: { fontSize: 15, fontWeight: '800', color: COLORS.text, marginBottom: 12 },
  qr: { width: 220, height: 220, borderRadius: RADIUS.md, marginBottom: 12 },
  key: { fontWeight: '800', color: COLORS.primaryDark, marginBottom: 8 },
  instructions: { color: COLORS.muted, fontSize: 13, textAlign: 'center', lineHeight: 18 },
  muted: { color: COLORS.muted, marginBottom: 8 },
  proof: { width: 140, height: 140, borderRadius: RADIUS.md, marginTop: 10 },
  note: { color: COLORS.muted, fontSize: 12, textAlign: 'center', marginTop: 12, marginBottom: 20 },
});
