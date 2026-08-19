# Plan de Proyecto: "AmbuRide" - Ambulancias Bajo Demanda

Este documento detalla la hoja de ruta para desarrollar una plataforma tipo Uber/Didi especializada en el sector de servicios médicos de emergencia (ambulancias).

---

## 🛡️ Fase 1: Plan de Desarrollo y Arquitectura (Fase Actual)

### 1. Definición del Producto (MVP - Producto Mínimo Viable)
- **App de Usuario:** Registro rápido, solicitud de ambulancia basada en ubicación, selección de tipo de servicio (Básica, Avanzada, Traslado).
- **App de Paramédico/Conductor:** Recepción de alertas, navegación GPS, estado de disponibilidad.
- **Panel Administrativo:** Gestión de flota, verificación de certificados médicos y reportes.

### 2. Seguridad de la App (Prioridad Crítica)
Dado que manejamos datos de salud, la seguridad no es opcional:
- **Cifrado de Datos:** Uso de protocolos SSL/TLS para datos en tránsito y cifrado AES-256 para datos en reposo.
- **Autenticación Robusta:** Registro mediante teléfono (Firebase Auth) con verificación por SMS.
- **Cumplimiento (HIPAA/GDPR):** Estructura preparada para normativas de privacidad de datos de salud.
- **Roles y Permisos:** El backend validará que solo personal autorizado acceda a historiales médicos.

### 3. Stack Tecnológico Sugerido (Costo $0 para Demo)
Para que no gastes en servidores durante las pruebas:
- **Frontend:** React Native o Flutter (Una sola base de código para iOS y Android).
- **Backend & Base de Datos:** **Firebase (Google).**
  - *Cloud Firestore:* Base de datos NoSQL en tiempo real (perfecto para ver la ambulancia moverse).
  - *Hosting:* Para el panel administrativo.
  - *Storage:* Para fotos de documentos de identidad y certificados.
- **Escalabilidad:** Al crecer, puedes pasar a un plan de pago por uso o migrar a Google Cloud/AWS.

---

## 📱 Fase 2: Frontend y Registro (Próxima Fase)
- **Método de Registro:** Sugerimos **Teléfono + OTP (SMS)**. Es el más rápido en emergencias.
- **Diseño Adaptativo:** La interfaz será "Mobile First", funcionando en cualquier tamaño de pantalla (iOS/Android).
- **Branding Configurable:** Colores y logos definidos por variables de CSS/Tokens para fácil cambio de marca.

---

## 💳 Fase 3: Pagos y Logística de Cargos
### Formas de Pago
- **Digital:** Integración con Stripe o Mercado Pago (Tarjetas de crédito/débito).
- **Seguros:** Opción de ingresar número de póliza para validación posterior.
- **Efectivo:** Pago directo al finalizar el traslado (opcional).

### Tipos de Cargos
- **Tarifa Base:** Por despacho de unidad.
- **Variable:** Por kilómetro recorrido y tiempo de espera.
- **Adicionales:** Por insumos médicos utilizados (oxígeno, medicamentos).

---

## 🚀 Fases Siguientes
1. **Fase 4: Real-time Tracking:** Implementación de mapas (Google Maps API) para seguimiento en vivo.
2. **Fase 5: Panel de Verificación:** Sistema para validar que las ambulancias registradas cumplen con la ley.
3. **Fase 6: Lanzamiento Beta:** Pruebas con un grupo reducido de unidades.

---

## 📚 Consideraciones para Principiantes
- **Instalaciones:** Necesitarás instalar Node.js, un editor como VS Code y configurar una cuenta gratuita en Firebase.
- **Publicación:** Para iOS necesitas una cuenta de Apple Developer ($99 USD/año) y una Mac. Para Android, una cuenta de Google Play ($25 USD pago único).
- **Bases de Datos:** En Firebase, los datos se guardan como "documentos". Cada cliente es un documento con su nombre, teléfono y ubicación. Es muy intuitivo.
