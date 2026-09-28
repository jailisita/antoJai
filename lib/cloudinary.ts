// Sube imágenes directo a Cloudinary usando un "unsigned upload preset".
// No necesita backend propio ni Supabase Storage: la app sube la foto
// directo desde el celular y Cloudinary devuelve la URL pública.
//
// Configuración necesaria en tu cuenta de Cloudinary (gratis):
// 1. Ve a Settings > Upload > Upload presets > Add upload preset.
// 2. Ponle un nombre (ej: "antojai_unsigned"), modo "Unsigned", guarda.
// 3. Copia tu "Cloud name" (aparece en el Dashboard).
// 4. Pon ambos valores en tu archivo .env:
//    EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=tu_cloud_name
//    EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET=antojai_unsigned

import { Platform } from 'react-native';

const CLOUD_NAME =process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME as string;
const UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET as string;

export type CloudinaryUploadResult = {
  url: string;
  publicId: string;
};

/**
 * Sube una imagen local (uri de expo-image-picker) a Cloudinary.
 * `folder` agrupa las imágenes dentro de Cloudinary (ej: "products", "settings", "payment-proofs").
 */
export async function uploadImageToCloudinary(
  localUri: string,
  folder: string
): Promise<CloudinaryUploadResult> {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error(
      'Cloudinary no está configurado. Revisa EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME y EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET en tu archivo .env'
    );
  }

  const filename = localUri.split('/').pop() || `photo-${Date.now()}.jpg`;
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1] === 'jpg' ? 'jpeg' : match[1]}` : 'image/jpeg';

  const formData = new FormData();
  if (Platform.OS === 'web') {
    // En web el FormData necesita un Blob real, no el objeto {uri, name, type}.
    const blob = await (await fetch(localUri)).blob();
    formData.append('file', blob, filename);
  } else {
    // @ts-expect-error React Native's FormData accepts this file-like shape
    formData.append('file', { uri: localUri, name: filename, type });
  }
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('folder', `antojai/${folder}`);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error?.message || 'No se pudo subir la imagen a Cloudinary');
  }

  return { url: data.secure_url as string, publicId: data.public_id as string };
}
