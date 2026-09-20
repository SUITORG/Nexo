export const PRIVACY_SECTIONS = [
  {
    title: '1. Datos que recopilamos',
    content: `ServiciosHogar recopila únicamente los datos necesarios para operar la plataforma:

• **Nombre completo** — para identificación entre cliente y técnico
• **Correo electrónico** — para autenticación (Google OAuth)
• **Foto de perfil** — opcional, para identificación visual
• **Dirección del servicio** — colonia, calle, número, GPS (para ubicar el técnico)
• **Datos de pago** — procesados exclusivamente por Stripe (nunca almacenamos tarjetas)
• **Fotos de evidencia** — tomadas durante la prestación del servicio
• **Mensajes del chat** — comunicación dentro de la plataforma

**No recopilamos:** datos biométricos, historial de navegación, contactos, ubicación en tiempo real, ni información financiera fuera de la transacción.`
  },
  {
    title: '2. Uso de tus datos',
    content: `Tus datos se utilizan exclusivamente para:

• Conectarte con técnicos verificados en tu zona
• Procesar pagos y garantías Escrow
• Permitir comunicación dentro de la plataforma
• Generar reportes de servicio (calificaciones, evidencia fotográfica)
• Cumplir obligaciones fiscales (CFDI 4.0, facturación)
• Mejorar la calidad del servicio

**No vendemos, compartimos ni cedemos tus datos a terceros para fines comerciales.**`
  },
  {
    title: '3. Almacenamiento y seguridad',
    content: `Tus datos se almacenan en:

• **Supabase** (PostgreSQL) — base de datos principal, servidores en EE.UU.
• **Stripe** — datos de pago (tokenizados, nunca llegan a nuestros servidores)
• **Google OAuth** — autenticación (no almacenamos contraseñas)

Medidas de seguridad:
• Cifrado TLS 1.3 en todas las conexiones
• Autenticación obligatoria para acceder a datos
• Acceso restringido por rol (cliente, técnico, administrador)
• Soft delete (nunca borrado físico)`
  },
  {
    title: '4. Tus derechos (LFPDPPP)',
    content: `De conformidad con la Ley Federal de Protección de Datos Personales en Posesión de los Particulares:

• **Acceso** — puedes solicitar una copia de todos tus datos
• **Rectificación** — puedes corregir datos inexactos
• **Cancelación** — puedes solicitar la eliminación de tu cuenta
• **Oposición** — puedes oponerte al tratamiento de tus datos
• **Portabilidad** — puedes exportar tus datos en formato estándar

Para ejercer estos derechos: soporte@servicioshogar.com`
  },
  {
    title: '5. Cookies y tecnologías de rastreo',
    content: `ServiciosHogar utiliza únicamente:

• **Cookies de sesión** — para mantener tu sesión activa
• **LocalStorage** — para preferencias de configuración (moneda, colonia)

**No utilizamos** cookies de rastreo, pixels de publicidad, analytics de terceros, ni herramientas de perfilado.`
  },
  {
    title: '6. Menores de edad',
    content: `El servicio está dirigido a mayores de 18 años. No recopilamos intencionalmente datos de menores de edad. Si se detecta una cuenta de menor, será eliminada de inmediato.`
  },
  {
    title: '7. Cambios en esta política',
    content: `Nos reservamos el derecho de modificar esta política. Los cambios significativos se notificarán por correo electrónico o mediante aviso en la plataforma. El uso continuado después de los cambios constituye aceptación.`
  },
  {
    title: '8. Contacto',
    content: `Para preguntas sobre privacidad y protección de datos:

**ServiciosHogar Reynosa**
Email: soporte@servicioshogar.com
Reynosa, Tamaulipas, México`
  }
];

export const PRIVACY_LAST_UPDATED = '16 de septiembre de 2026';
