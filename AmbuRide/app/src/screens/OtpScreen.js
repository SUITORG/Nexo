import { useState } from 'react';
import { ActivityIndicator, Pressable, SafeAreaView, StyleSheet, Text, TextInput } from 'react-native';
import { supabase } from '../lib/supabase';
import { theme } from '../theme';

export default function OtpScreen({ phone, onBack }) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function verify() {
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({ phone, token: code, type: 'sms' });
    setLoading(false);
    if (error) setError(error.message);
    // éxito: onAuthStateChange en App.js toma el control de la navegación
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Código de verificación</Text>
      <Text style={styles.subtitle}>Enviado a {phone}</Text>
      <TextInput
        style={styles.input}
        value={code}
        onChangeText={setCode}
        keyboardType="number-pad"
        placeholder="123456"
        maxLength={6}
        autoFocus
      />
      {!!error && <Text style={styles.error}>{error}</Text>}
      <Pressable style={styles.button} onPress={verify} disabled={loading || code.length < 4}>
        {loading ? (
          <ActivityIndicator color={theme.colors.onSecondary} />
        ) : (
          <Text style={styles.buttonText}>Verificar</Text>
        )}
      </Pressable>
      <Pressable onPress={onBack}>
        <Text style={styles.link}>Cambiar número</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background, padding: theme.spacing.lg, justifyContent: 'center' },
  title: { ...theme.typography.headlineMd, color: theme.colors.onBackground },
  subtitle: { ...theme.typography.bodyMd, color: theme.colors.textMuted, marginTop: theme.spacing.xs, marginBottom: theme.spacing.lg },
  input: {
    height: 56,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.md,
    ...theme.typography.headlineMd,
    letterSpacing: 8,
    backgroundColor: theme.colors.surface,
    marginBottom: theme.spacing.sm,
  },
  error: { ...theme.typography.labelSm, color: theme.colors.error, marginBottom: theme.spacing.sm },
  button: {
    backgroundColor: theme.colors.secondary,
    borderRadius: theme.radius.sm,
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.md,
  },
  buttonText: { ...theme.typography.headlineMd, color: theme.colors.onSecondary },
  link: { ...theme.typography.labelBold, color: theme.colors.secondary, textAlign: 'center', marginTop: theme.spacing.lg },
});
