// Branding AmbuRide — tokens tomados de docs/_stitch_extract/.../amburide/DESIGN.md
// Cambiar aquí para re-marcar toda la app sin tocar pantallas.
export const theme = {
  colors: {
    primary: '#af101a', // Rojo emergencia — reservado a alertas críticas y acciones destructivas
    onPrimary: '#ffffff',
    secondary: '#005faf', // Azul confianza — navegación, acciones no críticas
    onSecondary: '#ffffff',
    tertiary: '#016619', // Verde seguridad — éxito / "sistema listo"
    onTertiary: '#ffffff',
    background: '#f9f9f9',
    onBackground: '#1a1c1c',
    surface: '#ffffff',
    surfaceContainer: '#eeeeee',
    outline: '#8f6f6c',
    error: '#ba1a1a',
    onError: '#ffffff',
    textMuted: '#5b403d',
  },
  typography: {
    headlineLg: { fontSize: 32, fontWeight: '700', lineHeight: 40 },
    headlineMd: { fontSize: 20, fontWeight: '600', lineHeight: 28 },
    bodyLg: { fontSize: 18, fontWeight: '400', lineHeight: 26 },
    bodyMd: { fontSize: 16, fontWeight: '400', lineHeight: 24 },
    labelBold: { fontSize: 14, fontWeight: '600', lineHeight: 20 },
    labelSm: { fontSize: 12, fontWeight: '500', lineHeight: 16 },
  },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  radius: { sm: 4, lg: 8, full: 9999 },
};
