import { useEffect, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { supabase } from '../lib/supabase';
import { uploadImageToCloudinary } from '../lib/cloudinary';
import { Category, Product } from '../types';
import PrimaryButton from './PrimaryButton';
import Field from './Field';
import { COLORS, RADIUS, SHADOW } from '../constants/theme';

export default function ProductForm({ product }: { product?: Product }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState(product?.name ?? '');
  const [description, setDescription] = useState(product?.description ?? '');
  const [extraInfo, setExtraInfo] = useState(product?.extra_info ?? '');
  const [price, setPrice] = useState(product ? String(product.price) : '');
  const [categoryId, setCategoryId] = useState<string | null>(product?.category_id ?? null);
  const [isAvailable, setIsAvailable] = useState(product?.is_available ?? true);
  const [imageUri, setImageUri] = useState<string | null>(product?.image_url ?? null);
  const [newImagePicked, setNewImagePicked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    supabase.from('categories').select('*').order('sort_order').then(({ data }) => setCategories(data ?? []));
  }, []);

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return Alert.alert('Necesitamos acceso a tus fotos');
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      setNewImagePicked(true);
    }
  };

  const save = async () => {
    const priceNum = Number(price.replace(/[^\d]/g, ''));
    if (!name.trim()) return Alert.alert('Ponle un nombre al producto');
    if (!price.trim() || isNaN(priceNum) || priceNum < 0) return Alert.alert('Ingresa un precio válido');

    setSaving(true);
    try {
      let imageUrl = product?.image_url ?? null;
      let imagePublicId = product?.image_public_id ?? null;

      if (newImagePicked && imageUri) {
        setUploadingImage(true);
        const uploaded = await uploadImageToCloudinary(imageUri, 'products');
        imageUrl = uploaded.url;
        imagePublicId = uploaded.publicId;
        setUploadingImage(false);
      }

      const payload = {
        name: name.trim(),
        description: description.trim() || null,
        extra_info: extraInfo.trim() || null,
        price: priceNum,
        category_id: categoryId,
        is_available: isAvailable,
        image_url: imageUrl,
        image_public_id: imagePublicId,
      };

      if (product) {
        const { error } = await supabase.from('products').update(payload).eq('id', product.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('products').insert(payload);
        if (error) throw error;
      }
      router.back();
    } catch (e: any) {
      Alert.alert('No se pudo guardar', e?.message ?? 'Intenta de nuevo');
    } finally {
      setSaving(false);
      setUploadingImage(false);
    }
  };

  const remove = () => {
    if (!product) return;
    Alert.alert('Eliminar producto', '¿Seguro que quieres eliminarlo?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('products').delete().eq('id', product.id);
          if (error) return Alert.alert('Error', error.message);
          router.back();
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 18, paddingBottom: 50 }} keyboardShouldPersistTaps="handled">
      <Pressable style={[styles.imagePicker, SHADOW]} onPress={pickImage}>
        {imageUri ? (
          <>
            <Image source={{ uri: imageUri }} style={styles.image} />
            <View style={styles.changeBadge}>
              <Ionicons name="camera" size={14} color="#fff" />
              <Text style={styles.changeText}>Cambiar foto</Text>
            </View>
          </>
        ) : (
          <View style={{ alignItems: 'center' }}>
            <View style={styles.camCircle}>
              <Ionicons name="camera-outline" size={28} color={COLORS.primary} />
            </View>
            <Text style={styles.pickText}>Toca para elegir una foto</Text>
          </View>
        )}
      </Pressable>

      <View style={[styles.section, SHADOW]}>
        <Field label="Nombre" value={name} onChangeText={setName} placeholder="Ej: Empanada de carne" />
        <Field
          label="Precio (COP)"
          value={price}
          onChangeText={(t) => setPrice(t.replace(/[^\d]/g, ''))}
          keyboardType="numeric"
          placeholder="3000"
        />
        <Field
          label="Descripción"
          value={description}
          onChangeText={setDescription}
          multiline
          placeholder="Ej: Empanada frita, hecha en casa, con ají incluido"
        />
        <Field
          label="Información adicional (opcional)"
          value={extraInfo}
          onChangeText={setExtraInfo}
          multiline
          placeholder="Ej: Picante, tamaño grande, sin gluten, etc."
          style={{ minHeight: 64 }}
        />
      </View>

      <View style={[styles.section, SHADOW]}>
        <Text style={styles.label}>Categoría</Text>
        <View style={styles.chipsRow}>
          {categories.map((c) => (
            <Pressable
              key={c.id}
              style={[styles.chip, categoryId === c.id && styles.chipActive]}
              onPress={() => setCategoryId(categoryId === c.id ? null : c.id)}
            >
              <Text style={[styles.chipText, categoryId === c.id && styles.chipTextActive]}>{c.name}</Text>
            </Pressable>
          ))}
          {categories.length === 0 && <Text style={styles.muted}>Crea categorías primero en Panel admin → Categorías.</Text>}
        </View>

        <View style={styles.switchRow}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={[styles.label, { marginBottom: 0 }]}>Disponible hoy</Text>
            <Text style={styles.muted}>Si lo apagas, se muestra como agotado.</Text>
          </View>
          <Switch
            value={isAvailable}
            onValueChange={setIsAvailable}
            trackColor={{ true: COLORS.accent, false: '#E5D5DD' }}
            thumbColor={isAvailable ? COLORS.primary : '#f4f3f4'}
          />
        </View>
      </View>

      <PrimaryButton
        title={uploadingImage ? 'Subiendo foto...' : product ? 'Guardar cambios' : 'Publicar producto'}
        onPress={save}
        loading={saving}
        icon="checkmark-circle-outline"
      />
      {product && (
        <>
          <View style={{ height: 10 }} />
          <PrimaryButton title="Eliminar producto" variant="soft" icon="trash-outline" onPress={remove} />
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  imagePicker: {
    height: 220,
    borderRadius: RADIUS.lg,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  image: { width: '100%', height: '100%' },
  camCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: COLORS.soft, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  pickText: { color: COLORS.muted, fontWeight: '600' },
  changeBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59,18,38,0.7)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
  },
  changeText: { color: '#fff', fontSize: 12, fontWeight: '700', marginLeft: 4 },
  section: { backgroundColor: '#fff', borderRadius: RADIUS.lg, padding: 16, marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '700', color: COLORS.primaryDark, marginBottom: 8 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.softer,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    marginRight: 8,
    marginBottom: 8,
  },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { color: COLORS.primaryDark, fontSize: 13, fontWeight: '700' },
  chipTextActive: { color: '#fff' },
  muted: { color: COLORS.muted, fontSize: 12 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 },
});
