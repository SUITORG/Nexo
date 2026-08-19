import { StatusBar } from 'expo-status-bar';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme';

// Pantalla de entrada: acceso a emergencia en 1 toque (regla de "baja fricción"
// del research — el usuario puede estar en pánico, no puede navegar menús).
export default function WelcomeScreen({ onStart }) {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.logo}>AmbuRide</Text>
        <Text style={styles.tagline}>Ambulancia en minutos</Text>
      </View>

      <View style={styles.actions}>
        <Pressable style={styles.sosButton} onPress={onStart}>
          <Text style={styles.sosButtonText}>SOLICITAR AMBULANCIA</Text>
        </Pressable>

        <Pressable style={styles.secondaryButton} onPress={onStart}>
          <Text style={styles.secondaryButtonText}>Traslado programado</Text>
        </Pressable>
      </View>

      <Text style={styles.disclaimer}>
        AmbuRide no reemplaza al 911 ni a tu número de emergencia local. En
        caso de riesgo de vida, llama primero a emergencias.
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
    justifyContent: 'space-between',
  },
  header: {
    marginTop: theme.spacing.xl,
    alignItems: 'center',
  },
  logo: {
    ...theme.typography.headlineLg,
    color: theme.colors.primary,
  },
  tagline: {
    ...theme.typography.bodyLg,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.xs,
  },
  actions: {
    gap: theme.spacing.md,
  },
  sosButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.sm,
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
    minHeight: 56,
    justifyContent: 'center',
  },
  sosButtonText: {
    ...theme.typography.headlineMd,
    color: theme.colors.onPrimary,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderColor: theme.colors.secondary,
    borderWidth: 1,
    borderRadius: theme.radius.sm,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    minHeight: 56,
    justifyContent: 'center',
  },
  secondaryButtonText: {
    ...theme.typography.labelBold,
    color: theme.colors.secondary,
  },
  disclaimer: {
    ...theme.typography.labelSm,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
});
