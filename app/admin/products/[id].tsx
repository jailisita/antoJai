import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { Product } from '../../../types';
import ProductForm from '../../../components/ProductForm';
import { COLORS } from '../../../constants/theme';

export default function EditProduct() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);

  useEffect(() => {
    supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data }) => setProduct(data as Product));
  }, [id]);

  if (!product) return <View style={{ flex: 1, backgroundColor: COLORS.bg }} />;
  return <ProductForm product={product} />;
}
