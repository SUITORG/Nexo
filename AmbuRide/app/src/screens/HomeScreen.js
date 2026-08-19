import * as Location from 'expo-location';
import { useState } from 'react';
import { ActivityIndicator, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { supabase } from '../lib/supabase';
import { theme } from '../theme';

const TIPOS = [
  { id: 'emergencia', label: 'Dolor de pecho / Dificultad respiratoria', tipo: 'emergencia' },
  { id: 'accidente', label: 'Accidente', tipo: 'emergencia' },
  { id: 'otro', label: 'Otra emergencia', tipo: 'emergencia' },
];

export default function HomeScreen() {
  const [buscando, setBuscando] = useState(false);
  const [servicio, setServicio] = useState(null);
  const [error, setError] = useState('');

  async function solicitar(motivo) {
    setError('');
    setBuscando(true);

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setBuscando(false);
      setError('Necesitamos tu ubicación para enviar la ambulancia.');
      return;
    }

    const pos = await Location.getCurrentPositionAsync({});
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data, error: insertError } = await supabase
      .from('servicios')
      .insert({
        id_usuario: user.id,
        tipo: motivo.tipo,
        estado: 'pendiente',
        origen_json: {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          motivo: motivo.label,
        },
      })
      .select()
      .single();

    setBuscando(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }

    // El trigger de la DB ya asignó unidad (o no) antes de que esto llegue —
    // data.id_ambulancia refleja el resultado real, no una suposición del cliente.
    let unidad = null;
    if (data.id_ambulancia) {
      const { data: amb } = await supabase
        .from('ambulancias')
        .select('placa, tipo, paramedicos(nombre, rating)')
        .eq('id', data.id_ambulancia)
        .single();
      unidad = amb;
    }
    setServicio({ ...data, unidad });
  }

  if (servicio) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.headline}>
            {servicio.unidad ? 'Unidad en camino' : 'Solicitud enviada'}
          </Text>
          <Text style={styles.subtitle}>
            {servicio.unidad
              ? 'Un paramédico ya viene hacia ti.'
              : 'No hay unidades disponibles ahora mismo — te avisamos en cuanto haya una.'}
          </Text>
          <Text style={styles.meta}>Folio: {servicio.id.slice(0, 8)}</Text>
          {servicio.unidad && (
            <>
              <Text style={styles.meta}>
                Unidad {servicio.unidad.tipo} — placa {servicio.unidad.placa}
              </Text>
              <Text style={styles.meta}>Paramédico: {servicio.unidad.paramedicos?.nombre}</Text>
            </>
          )}
        </View>
        <Pressable style={styles.secondaryButton} onPress={() => setServicio(null)}>
          <Text style={styles.secondaryButtonText}>Volver</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.headline}>¿Qué está pasando?</Text>
      <Text style={styles.subtitle}>Selecciona el motivo — enviamos tu ubicación automáticamente.</Text>

      <View style={styles.options}>
        {TIPOS.map((t) => (
          <Pressable key={t.id} style={styles.sosButton} onPress={() => solicitar(t)} disabled={buscando}>
            {buscando ? (
              <ActivityIndicator color={theme.colors.onPrimary} />
            ) : (
              <Text style={styles.sosButtonText}>{t.label}</Text>
            )}
          </Pressable>
        ))}
      </View>

      {!!error && <Text style={styles.error}>{error}</Text>}

      <Text style={styles.disclaimer}>
        AmbuRide no reemplaza al 911 ni a tu número de emergencia local.
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background, padding: theme.spacing.lg, justifyContent: 'space-between' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: theme.spacing.sm },
  headline: { ...theme.typography.headlineMd, color: theme.colors.onBackground },
  subtitle: { ...theme.typography.bodyMd, color: theme.colors.textMuted, marginTop: theme.spacing.xs, marginBottom: theme.spacing.lg, textAlign: 'center' },
  meta: { ...theme.typography.bodyMd, color: theme.colors.textMuted },
  options: { gap: theme.spacing.md },
  sosButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.sm,
    minHeight: 64,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.md,
  },
  sosButtonText: { ...theme.typography.labelBold, color: theme.colors.onPrimary, textAlign: 'center' },
  secondaryButton: {
    borderColor: theme.colors.secondary,
    borderWidth: 1,
    borderRadius: theme.radius.sm,
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: { ...theme.typography.labelBold, color: theme.colors.secondary },
  error: { ...theme.typography.labelSm, color: theme.colors.error, textAlign: 'center', marginTop: theme.spacing.md },
  disclaimer: { ...theme.typography.labelSm, color: theme.colors.textMuted, textAlign: 'center' },
});
