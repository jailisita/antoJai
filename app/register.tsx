import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Link, router, Stack, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import PrimaryButton from '../components/PrimaryButton';
import Field from '../components/Field';
import { COLORS, RADIUS, SHADOW } from '../constants/theme';

export default function Register() {
  const { redirect } = useLocalSearchParams<{ redirect?: string }>();
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!fullName || !email || !password) return Alert.alert('Completa todos los campos');
    if (password.length < 6) return Alert.alert('La contraseña debe tener al menos 6 caracteres');
    setLoading(true);
    const { error } = await signUp(email.trim(), password, fullName.trim());
    setLoading(false);
    if (error) return Alert.alert('No pudimos crear tu cuenta', error);
    Alert.alert('¡Cuenta creada!', 'Revisa tu correo si tu proyecto de Supabase requiere confirmación.');
    router.replace((redirect as string) || '/');
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <Stack.Screen options={{ title: 'Crear cuenta' }} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.logoWrap}>
          <Text style={styles.emoji}>🍢</Text>
          <Text style={styles.brand}>AntoJai</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.title}>Crea tu cuenta</Text>
          <Text style={styles.subtitle}>Regístrate para pedir y seguir tus antojos</Text>

          <Field label="Nombre completo" value={fullName} onChangeText={setFullName} placeholder="Tu nombre" />
          <Field label="Correo electrónico" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} placeholder="tucorreo@ejemplo.com" />
          <Field label="Contraseña" secureTextEntry value={password} onChangeText={setPassword} placeholder="Mínimo 6 caracteres" />
          <PrimaryButton title="Crear cuenta" onPress={onSubmit} loading={loading} />

          <View style={styles.footer}>
            <Text style={styles.footerText}>¿Ya tienes cuenta? </Text>
            <Link href={{ pathname: '/login', params: { redirect } }} style={styles.link}>
              Inicia sesión
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
