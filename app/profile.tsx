import { useEffect } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { router, Stack } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import PrimaryButton from '../components/PrimaryButton';
import { COLORS, RADIUS, SHADOW } from '../constants/theme';

export default function Profile() {
  const { session, profile, isAdmin, signOut } = useAuth();

  useEffect(() => {
    if (!session) router.replace('/login?redirect=/profile');
  }, [session]);

  if (!session) return null;

  const display = profile?.full_name || session.user.email || '';

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Mi perfil' }} />
      <View style={styles.card}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{display.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.name}>{display}</Text>
        <Text style={styles.email}>{session.user.email}</Text>
        {isAdmin && (
          <View style={styles.adminPill}>
            <Text style={styles.adminPillText}>Administrador</Text>
          </View>
        )}
      </View>

      <PrimaryButton title="Mis pedidos" variant="outline" icon="receipt-outline" onPress={() => router.push('/orders')} />
      <View style={{ height: 12 }} />
      {isAdmin && (
        <>
          <PrimaryButton title="Panel de administración" variant="dark" icon="sparkles" onPress={() => router.push('/admin')} />
          <View style={{ height: 12 }} />
        </>
      )}
      <PrimaryButton
        title="Cerrar sesión"
        variant="soft"
        icon="log-out-outline"
        onPress={() =>
          Alert.alert('Cerrar sesión', '¿Seguro que deseas salir?', [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Salir',
              style: 'destructive',
              onPress: async () => {
                await signOut();
                router.replace('/');
              },
            },
          ])
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, padding: 20 },
  card: { backgroundColor: '#fff', borderRadius: RADIUS.lg + 6, padding: 24, marginBottom: 24, alignItems: 'center', ...SHADOW },
  avatar: { width: 76, height: 76, borderRadius: 38, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { color: '#fff', fontSize: 32, fontWeight: '900' },
  name: { fontSize: 19, fontWeight: '900', color: COLORS.text, marginBottom: 2 },
  email: { color: COLORS.muted, fontSize: 13 },
  adminPill: { marginTop: 10, backgroundColor: COLORS.soft, paddingHorizontal: 12, paddingVertical: 4, borderRadius: RADIUS.pill },
  adminPillText: { color: COLORS.primaryDark, fontWeight: '800', fontSize: 12 },
});
