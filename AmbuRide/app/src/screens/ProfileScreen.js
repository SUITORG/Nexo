import { useState } from 'react';
import { ActivityIndicator, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput } from 'react-native';
import { supabase } from '../lib/supabase';
import { theme } from '../theme';

// Datos médicos mínimos (regla del plan: no historial clínico completo).
export default function ProfileScreen({ userId, phone, onDone }) {
  const [nombre, setNombre] = useState('');
  const [tipoSangre, setTipoSangre] = useState('');
  const [alergias, setAlergias] = useState('');
  const [contactoNombre, setContactoNombre] = useState('');
  const [contactoTelefono, setContactoTelefono] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function guardar() {
    setError('');
    setLoading(true);
    const { error } = await supabase.from('usuarios').insert({
      id: userId,
      telefono: phone,
      nombre,
      tipo_sangre: tipoSangre || null,
      alergias: alergias ? alergias.split(',').map((a) => a.trim()).filter(Boolean) : [],
      contacto_emergencia_json: contactoNombre || contactoTelefono
        ? { nombre: contactoNombre, telefono: contactoTelefono }
        : null,
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    onDone();
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Datos básicos</Text>
        <Text style={styles.subtitle}>
          Solo lo esencial para una emergencia. Nada de esto se comparte sin tu consentimiento.
        </Text>

        <Text style={styles.label}>Nombre completo</Text>
        <TextInput style={styles.input} value={nombre} onChangeText={setNombre} placeholder="Juan Pérez" />

        <Text style={styles.label}>Tipo de sangre</Text>
        <TextInput style={styles.input} value={tipoSangre} onChangeText={setTipoSangre} placeholder="O+" autoCapitalize="characters" />

        <Text style={styles.label}>Alergias (separadas por coma)</Text>
        <TextInput style={styles.input} value={alergias} onChangeText={setAlergias} placeholder="Penicilina, Yodo" />

        <Text style={styles.label}>Contacto de emergencia — nombre</Text>
        <TextInput style={styles.input} value={contactoNombre} onChangeText={setContactoNombre} placeholder="María Pérez" />

        <Text style={styles.label}>Contacto de emergencia — teléfono</Text>
        <TextInput style={styles.input} value={contactoTelefono} onChangeText={setContactoTelefono} placeholder="+52 55 8765 4321" keyboardType="phone-pad" />

        {!!error && <Text style={styles.error}>{error}</Text>}

        <Pressable style={styles.button} onPress={guardar} disabled={loading || !nombre}>
          {loading ? <ActivityIndicator color={theme.colors.onPrimary} /> : <Text style={styles.buttonText}>Continuar</Text>}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.lg },
  title: { ...theme.typography.headlineMd, color: theme.colors.onBackground },
  subtitle: { ...theme.typography.bodyMd, color: theme.colors.textMuted, marginTop: theme.spacing.xs, marginBottom: theme.spacing.lg },
  label: { ...theme.typography.labelBold, color: theme.colors.onBackground, marginBottom: theme.spacing.xs },
  input: {
    height: 56,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.md,
    ...theme.typography.bodyMd,
    backgroundColor: theme.colors.surface,
    marginBottom: theme.spacing.md,
  },
  error: { ...theme.typography.labelSm, color: theme.colors.error, marginBottom: theme.spacing.sm },
  button: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.sm,
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.sm,
  },
  buttonText: { ...theme.typography.headlineMd, color: theme.colors.onPrimary },
});
