import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Link, router, Stack, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import PrimaryButton from '../components/PrimaryButton';
import Field from '../components/Field';
import { COLORS, RADIUS, SHADOW } from '../constants/theme';

export default function Login() {
  const { redirect } = useLocalSearchParams<{ redirect?: string }>();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!email || !password) return Alert.alert('Completa correo y contraseña');
    setLoading(true);
    const { error } = await signIn(email.trim(), password);
    setLoading(false);
    if (error) return Alert.alert('No pudimos iniciar sesión', error);
    router.replace((redirect as string) || '/');
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <Stack.Screen options={{ title: 'Iniciar sesión' }} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.logoWrap}>
          <Text style={styles.emoji}>🍢</Text>
          <Text style={styles.brand}>AntoJai</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.title}>Bienvenido de nuevo</Text>
          <Text style={styles.subtitle}>Inicia sesión para hacer tu pedido</Text>

          <Field label="Correo electrónico" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} placeholder="tucorreo@ejemplo.com" />
          <Field label="Contraseña" secureTextEntry value={password} onChangeText={setPassword} placeholder="••••••" />
          <PrimaryButton title="Iniciar sesión" onPress={onSubmit} loading={loading} />

          <View style={styles.footer}>
            <Text style={styles.footerText}>¿No tienes cuenta? </Text>
            <Link href={{ pathname: '/register', params: { redirect } }} style={styles.link}>
              Regístrate
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { flexGrow: 1, padding: 20, justifyContent: 'center' },
  logoWrap: { alignItems: 'center', marginBottom: 20 },
  emoji: { fontSize: 54 },
  brand: { fontSize: 30, fontWeight: '900', color: COLORS.primary },
  card: { backgroundColor: '#fff', borderRadius: RADIUS.lg + 6, padding: 22, ...SHADOW },
  title: { fontSize: 22, fontWeight: '900', color: COLORS.text, marginBottom: 4 },
  subtitle: { fontSize: 14, color: COLORS.muted, marginBottom: 20 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  footerText: { color: COLORS.muted },
  link: { color: COLORS.primary, fontWeight: '800' },
});
