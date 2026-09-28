import { ActivityIndicator, View } from 'react-native';
import { Stack } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import EmptyState from '../../components/EmptyState';
import { COLORS } from '../../constants/theme';

// Un solo guard para TODO el panel: si no eres admin no se renderiza ninguna pantalla
// (y por tanto no se hace ninguna consulta). La seguridad real está en las políticas RLS de Supabase.
export default function AdminLayout() {
  const { loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }

  if (!isAdmin) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
        <EmptyState
          icon="lock-closed-outline"
          title="Acceso restringido"
          subtitle="Esta sección es solo para el administrador de AntoJai."
        />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.dark },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '800' },
        headerShadowVisible: false,
        headerBackTitleVisible: false,
        contentStyle: { backgroundColor: COLORS.bg },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Panel admin' }} />
      <Stack.Screen name="categories" options={{ title: 'Categorías' }} />
      <Stack.Screen name="products/index" options={{ title: 'Productos' }} />
      <Stack.Screen name="products/new" options={{ title: 'Nuevo producto' }} />
      <Stack.Screen name="products/[id]" options={{ title: 'Editar producto' }} />
      <Stack.Screen name="orders/index" options={{ title: 'Pedidos' }} />
      <Stack.Screen name="orders/[id]" options={{ title: 'Detalle de pedido' }} />
      <Stack.Screen name="settings" options={{ title: 'Tienda y pagos' }} />
    </Stack>
  );
}
