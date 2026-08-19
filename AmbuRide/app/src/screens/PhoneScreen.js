import { useState } from 'react';
import { ActivityIndicator, Pressable, SafeAreaView, StyleSheet, Text, TextInput } from 'react-native';
import { supabase } from '../lib/supabase';
import { theme } from '../theme';

export default function PhoneScreen({ onCodeSent, onBack }) {
  const [phone, setPhone] = useState('+52');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function sendCode() {
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ phone });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    onCodeSent(phone);
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Tu número de teléfono</Text>
      <Text style={styles.subtitle}>Te enviamos un código por SMS para verificarte.</Text>
      <TextInput
        style={styles.input}
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        placeholder="+52 55 1234 5678"
        autoFocus
      />
      {!!error && <Text style={styles.error}>{error}</Text>}
      <Pressable style={styles.button} onPress={sendCode} disabled={loading}>
        {loading ? (
          <ActivityIndicator color={theme.colors.onSecondary} />
        ) : (
          <Text style={styles.buttonText}>Enviar código</Text>
        )}
      </Pressable>
      <Pressable onPress={onBack}>
        <Text style={styles.link}>Volver</Text>
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
    ...theme.typography.bodyLg,
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
