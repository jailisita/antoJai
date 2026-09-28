import { useEffect, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../lib/supabase';
import { uploadImageToCloudinary } from '../../lib/cloudinary';
import { StoreSettings } from '../../types';
import PrimaryButton from '../../components/PrimaryButton';
import Field from '../../components/Field';
import { COLORS, RADIUS, SHADOW } from '../../constants/theme';

export default function AdminSettings() {
  const [qrUri, setQrUri] = useState<string | null>(null);
  const [newQrPicked, setNewQrPicked] = useState(false);
  const [nequiKey, setNequiKey] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [address, setAddress] = useState('');
  const [openingHours, setOpeningHours] = useState('');
  const [instructions, setInstructions] = useState('');
  const [acceptsCash, setAcceptsCash] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    supabase
      .from('store_settings')
      .select('*')
      .eq('id', 1)
      .single()
      .then(({ data }) => {
        const s = data as StoreSettings;
        if (s) {
          setQrUri(s.qr_image_url);
          setNequiKey(s.nequi_key ?? '');
          setWhatsapp(s.whatsapp_number ?? '');
          setAddress(s.address ?? '');
          setOpeningHours(s.opening_hours ?? '');
          setInstructions(s.payment_instructions ?? '');
          setAcceptsCash(s.accepts_cash);
        }
      });
  }, []);

  const pickQr = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return Alert.alert('Necesitamos acceso a tus fotos');
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (!result.canceled) {
      setQrUri(result.assets[0].uri);
      setNewQrPicked(true);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      let qrUrl = qrUri;
      if (newQrPicked && qrUri) {
        setUploadingImage(true);
        const uploaded = await uploadImageToCloudinary(qrUri, 'settings');
        qrUrl = uploaded.url;
        setUploadingImage(false);
      }

      const { error } = await supabase
        .from('store_settings')
        .update({
          qr_image_url: qrUrl,
          nequi_key: nequiKey.trim() || null,
          whatsapp_number: whatsapp.trim() || null,
          address: address.trim() || null,
          opening_hours: openingHours.trim() || null,
          payment_instructions: instructions.trim() || null,
          accepts_cash: acceptsCash,
        })
        .eq('id', 1);
      if (error) throw error;
      Alert.alert('Guardado', 'La configuración se actualizó correctamente.');
      setNewQrPicked(false);
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'No se pudo guardar');
    } finally {
      setSaving(false);
      setUploadingImage(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, paddingBottom: 50 }} keyboardShouldPersistTaps="handled">
      <Text style={styles.section}>Pago con Nequi / Bre-B</Text>
      <View style={[styles.card, SHADOW]}>
        <Text style={styles.label}>QR de cobro</Text>
        <Pressable style={styles.qrPicker} onPress={pickQr}>
          {qrUri ? (
            <Image source={{ uri: qrUri }} style={styles.qr} resizeMode="contain" />
          ) : (
            <View style={{ alignItems: 'center' }}>
              <Ionicons name="qr-code-outline" size={34} color={COLORS.accent} />
              <Text style={{ color: COLORS.muted, marginTop: 6 }}>Toca para subir el QR</Text>
            </View>
          )}
        </Pressable>
        <View style={{ height: 14 }} />
        <Field label="Llave Bre-B / número Nequi" value={nequiKey} onChangeText={setNequiKey} placeholder="Ej: @antojai o 300 000 0000" />
        <Field
          label="Instrucciones para el cliente"
          value={instructions}
          onChangeText={setInstructions}
          multiline
          placeholder="Ej: Transfiere el valor exacto y sube el pantallazo. Confirmamos en minutos."
        />
        <View style={styles.switchRow}>
          <Text style={[styles.label, { flex: 1, marginBottom: 0 }]}>Aceptar efectivo contra entrega</Text>
          <Switch
            value={acceptsCash}
            onValueChange={setAcceptsCash}
            trackColor={{ true: COLORS.accent, false: '#E5D5DD' }}
            thumbColor={acceptsCash ? COLORS.primary : '#f4f3f4'}
          />
        </View>
      </View>

      <Text style={styles.section}>Información del puesto</Text>
      <View style={[styles.card, SHADOW]}>
        <Field label="WhatsApp de contacto" value={whatsapp} onChangeText={setWhatsapp} keyboardType="phone-pad" placeholder="Ej: 3000000000" />
        <Field label="Dirección" value={address} onChangeText={setAddress} placeholder="Ej: Cra 5 #10-20, frente al parque" />
        <Field label="Horario de atención" value={openingHours} onChangeText={setOpeningHours} placeholder="Ej: Mar a Dom, 4pm - 10pm" hint="El horario y la dirección se muestran en la pantalla principal." />
      </View>

      <PrimaryButton
        title={uploadingImage ? 'Subiendo QR...' : 'Guardar configuración'}
        onPress={save}
        loading={saving}
        icon="checkmark-circle-outline"
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  section: { fontSize: 13, fontWeight: '800', color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10, marginTop: 4 },
  card: { backgroundColor: '#fff', borderRadius: RADIUS.lg, padding: 16, marginBottom: 18 },
  label: { fontSize: 13, fontWeight: '700', color: COLORS.primaryDark, marginBottom: 8 },
  qrPicker: {
    height: 230,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.softer,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  qr: { width: '100%', height: '100%' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
