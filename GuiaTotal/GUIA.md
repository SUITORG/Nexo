# Guía visual: MVP, validación y arquitectura de software

Esta guía reúne un sistema práctico para validar, documentar y construir proyectos de software o aplicaciones de forma visual. Está orientada a proyectos como landings dinámicas, aplicaciones web, automatizaciones, productos SaaS y sistemas multiempresa.

---

## 1. El sistema visual de un proyecto

Un proyecto no debe pasar directamente de una idea a semanas de programación. Primero se identifica el problema, se formula una hipótesis, se busca evidencia, se construye un MVP y se mide el resultado.

```text
Idea
  ↓
Problema y cliente
  ↓
Hipótesis
  ↓
Investigación / evidencia
  ↓
MVP o prototipo
  ↓
Prueba con usuarios
  ↓
Decisión: continuar / cambiar / detener
  ↓
Desarrollo
  ↓
QA y lanzamiento
  ↓
Métricas y aprendizaje
```

Cada etapa debe tener una condición de salida. Por ejemplo: no se construye el MVP hasta que se definan el usuario, el problema, la solución propuesta, la métrica de éxito y la señal que justificaría seguir invirtiendo.

### Etapas de validación

| Etapa | Pregunta clave | Evidencia que documentas | Resultado |
|---|---|---|---|
| Idea | ¿Qué queremos crear? | Descripción breve, origen y oportunidad | Idea capturada |
| Problema | ¿Qué dolor concreto resuelve? | Cliente objetivo, contexto y frecuencia del problema | Problema definido |
| Hipótesis | ¿Qué creemos que ocurrirá? | “Si hacemos X para Y, mejorará Z” | Hipótesis medible |
| Validación | ¿Hay señales reales de demanda? | Entrevistas, formularios, clics, registros, ventas y feedback | Validada, dudosa o rechazada |
| MVP | ¿Cuál es la versión mínima útil? | Alcance, pantallas, flujo y criterios de aceptación | MVP definido |
| Construcción | ¿Qué hay que programar? | Tareas, responsable, prioridad y dependencias | Desarrollo controlado |
| QA | ¿Funciona como se espera? | Casos de prueba, bugs y revisión UX | Aprobado para lanzar |
| Lanzamiento | ¿La gente lo usa? | Usuarios, conversión, retención y errores | Decisión siguiente |

---

## 2. Qué es una versión mínima viable

La versión mínima viable, o MVP, no es una aplicación descuidada ni una aplicación a medio terminar. Es la porción más pequeña del producto que resuelve un problema real, se puede usar de principio a fin y permite medir una hipótesis.

Un MVP debe considerar estas siete capas:

| Capa | Qué responde | Ejemplo |
|---|---|---|
| Problema y alcance | ¿Qué necesidad resuelve y qué no hará aún? | “Una clínica recibe leads desde una landing; todavía no agenda automáticamente.” |
| Experiencia y diseño | ¿Qué pantallas, pasos y mensajes verá la persona? | Inicio → formulario → confirmación |
| Frontend | ¿Qué corre en el navegador o móvil? | Landing en Next.js, panel de usuario y formularios |
| Backend | ¿Qué reglas, procesos y APIs corren en servidor? | Validar formulario, crear lead y enviar email |
| Datos | ¿Qué se guarda, dónde y por cuánto tiempo? | Usuarios, empresas, leads, citas y auditoría |
| Seguridad y operación | ¿Quién puede hacer qué y cómo se protege o recupera? | Roles, sesiones, backups, logs y secretos |
| Calidad y medición | ¿Cómo sabes que funciona y da resultado? | Pruebas, errores, conversiones y analítica |

---

## 3. Diferencia entre sitio web y aplicación

| Elemento | Landing o sitio informativo | Aplicación web |
|---|---|---|
| Objetivo | Explicar, captar contacto, vender o informar | Permitir que alguien realice una operación repetida |
| Frontend | Páginas públicas, CTA, formulario, SEO y analítica | Dashboard, flujos, estados y formularios complejos |
| Usuarios / login | Usualmente no es necesario | Normalmente necesario |
| Base de datos | Puede no existir; el formulario puede ir a email o Sheets | Casi siempre necesaria |
| Backend | Puede ser mínimo: endpoint de contacto | Necesario: reglas, permisos y procesos |
| Roles | No aplica o solo administrador de contenido | Usuario, admin, operador, cliente y otros roles |
| Seguridad | HTTPS, formulario protegido, validación y secretos | Todo lo anterior más autenticación, autorización y auditoría |
| Backups | Contenido, configuración, leads y repositorio | Datos, archivos, configuraciones y restauración probada |
| Métricas | Visitas, clics, leads y conversión | Activación, uso, retención, errores y métricas de negocio |

Una landing no requiere un SaaS completo para ser útil. Su MVP puede ser:

```text
Cliente ve la landing
  ↓
Llena el formulario
  ↓
El sistema valida la información
  ↓
Guarda el lead
  ↓
Avisa al dueño del negocio
  ↓
Se registra la conversión
```

---

## 4. Arquitectura general de una aplicación web

```text
                         ┌───────────────────────────────┐
                         │           USUARIOS            │
                         │ visitante | cliente | admin   │
                         └───────────────┬───────────────┘
                                         │ HTTPS
                                         ▼
┌───────────────────────────────────────────────────────────────────┐
│                           FRONTEND                                  │
│          Web pública / Panel web / App móvil opcional               │
│                                                                   │
│  ┌─────────────┐  ┌────────────┐  ┌─────────────┐  ┌────────────┐ │
│  │ Diseño/UI   │  │ Pantallas  │  │ Formularios  │  │ Estado UX  │ │
│  │ Color/tipo  │  │ y rutas    │  │ validación   │  │ carga/error│ │
│  └─────────────┘  └────────────┘  └─────────────┘  └────────────┘ │
│                                                                   │
│ Responsabilidad: presentar información y pedir acciones al backend │
└─────────────────────────────┬─────────────────────────────────────┘
                              │ API HTTPS / JSON
                              ▼
┌───────────────────────────────────────────────────────────────────┐
│                         BACKEND / API                               │
│                                                                   │
│  ┌────────────────┐  ┌──────────────────┐  ┌────────────────────┐ │
│  │ API / rutas     │→ │ Autenticación     │→ │ Autorización       │ │
│  │ endpoints       │  │ login / sesión    │  │ roles / permisos   │ │
│  └───────┬────────┘  └──────────────────┘  └────────────────────┘ │
│          │                                                        │
│          ▼                                                        │
│  ┌────────────────┐  ┌──────────────────┐  ┌────────────────────┐ │
│  │ Reglas negocio  │  │ Servicios         │  │ Validación entrada │ │
│  │ casos de uso    │  │ email, pagos, IA  │  │ esquema / límites  │ │
│  └───────┬────────┘  └──────────────────┘  └────────────────────┘ │
│          │                                                        │
│          ▼                                                        │
│  ┌────────────────┐  ┌──────────────────┐  ┌────────────────────┐ │
│  │ Acceso a datos  │  │ Logs / auditoría  │  │ Tareas en segundo  │ │
│  │ repositorios    │  │ errores/eventos   │  │ plano / colas      │ │
│  └────────────────┘  └──────────────────┘  └────────────────────┘ │
└──────────────┬──────────────────────┬─────────────────────────────┘
               │                      │
               ▼                      ▼
┌─────────────────────────┐  ┌──────────────────────────────────────┐
│ BASE DE DATOS           │  │ SERVICIOS EXTERNOS                   │
│ usuarios, empresas,     │  │ email | Stripe | Google Sheets       │
│ leads, contenido,       │  │ Supabase | IA | Analytics | Storage  │
│ permisos, auditoría     │  └──────────────────────────────────────┘
└────────────┬────────────┘
             │ backup / restauración
             ▼
┌───────────────────────────────────────────────────────────────────┐
│ OPERACIÓN Y PROTECCIÓN                                              │
│ Git + CI/CD | variables secretas | monitoreo | alertas | backups  │
│ control de acceso | historial de cambios | recuperación ante fallo │
└───────────────────────────────────────────────────────────────────┘
```

### Cómo se comunican los módulos

1. El usuario abre el frontend desde navegador o móvil mediante HTTPS.
2. El frontend muestra pantallas, recopila datos y llama a la API usando HTTPS y normalmente JSON.
3. El backend recibe la solicitud y valida sus datos.
4. Si hay login, el backend verifica identidad, sesión, rol y permisos.
5. La lógica de negocio decide si la acción es válida: crear un lead, generar una landing, procesar un pago o modificar contenido.
6. El backend guarda o consulta datos en la base de datos.
7. Cuando hace falta, el backend llama a servicios externos: correo, pagos, IA, Google Sheets, almacenamiento o analítica.
8. El backend devuelve una respuesta al frontend, que muestra éxito, error, carga o datos actualizados.
9. Logs, alertas y auditoría registran eventos importantes sin interferir con el usuario.

---

## 5. Subsistemas del frontend

```text
FRONTEND
├── Sistema de diseño
│   ├── Paleta de color
│   ├── Tipografía
│   ├── Espaciado y grid
│   ├── Componentes: botón, input, card, modal
│   └── Accesibilidad: contraste, teclado, etiquetas
├── Páginas y rutas
│   ├── Públicas: inicio, servicios, precios, contacto
│   ├── Privadas: dashboard, perfil, configuración
│   └── Páginas de error: 404, acceso denegado, error del sistema
├── Lógica de interfaz
│   ├── Estado: datos cargando, vacío, éxito, error
│   ├── Validación básica de formularios
│   ├── Sesión visible del usuario
│   └── Llamadas seguras a API
├── SEO y rendimiento
│   ├── Títulos, metadata y sitemap
│   ├── Imágenes optimizadas
│   ├── Carga rápida
│   └── Analítica de visitas y conversiones
└── Pruebas de interfaz
    ├── Vista móvil, tablet y escritorio
    ├── Navegadores
    └── Flujos críticos
```

El frontend no es únicamente color y diseño. También incluye accesibilidad, comportamiento, estados de carga, estados de error, rendimiento, SEO cuando sea público y experiencia móvil.

Para un sistema de landings dinámicas, un esquema como `theme.schema.json` sirve como contrato de diseño; los presets definen combinaciones de color, tipografía y bloques; un validador como Zod valida el contenido; y las variables CSS aplican la apariencia de forma dinámica. Esto crea un sistema de diseño parametrizable por cliente.

---

## 6. Subsistemas del backend

```text
BACKEND
├── Capa de entrada / API
│   ├── Rutas o endpoints
│   ├── Rate limiting
│   ├── Validación de payload
│   └── Respuestas y códigos HTTP
├── Identidad y acceso
│   ├── Registro y login
│   ├── Recuperación de contraseña
│   ├── Sesiones o tokens
│   ├── Roles
│   └── Permisos por recurso
├── Lógica de negocio
│   ├── Casos de uso
│   ├── Reglas y validaciones
│   ├── Estados de procesos
│   └── Políticas de negocio
├── Datos
│   ├── Repositorios / queries
│   ├── Migraciones de base de datos
│   ├── Integridad de relaciones
│   └── Transacciones
├── Integraciones
│   ├── Email y notificaciones
│   ├── Pagos
│   ├── Google Sheets / Apps Script
│   ├── IA externa o local
│   └── Webhooks
├── Procesos asíncronos
│   ├── Enviar email sin bloquear al usuario
│   ├── Generar reportes
│   ├── Importar datos
│   └── Reintentos ante errores
└── Observabilidad
    ├── Logs técnicos
    ├── Auditoría de acciones
    ├── Métricas
    ├── Monitoreo de errores
    └── Alertas
```

No conviene meter toda la lógica dentro de una ruta API. Una ruta como `POST /api/leads` debería recibir y validar; después un servicio como `CrearLead` debe aplicar reglas, detectar duplicados, guardar la información, registrar el evento y enviar la notificación. Esta separación permite cambiar proveedores —por ejemplo, migrar de Google Sheets a Supabase o Neon— sin reescribir toda la aplicación.

---

## 7. Subsistemas de datos y respaldos

```text
DATOS
├── Datos principales
│   ├── Usuarios
│   ├── Empresas / tenants
│   ├── Roles y permisos
│   ├── Leads / clientes / pedidos
│   └── Contenido del producto
├── Datos operativos
│   ├── Sesiones
│   ├── Tokens temporales
│   ├── Configuración
│   └── Flags de funcionalidades
├── Datos históricos
│   ├── Auditoría
│   ├── Eventos
│   ├── Cambios relevantes
│   └── Errores importantes
├── Archivos
│   ├── Imágenes
│   ├── PDFs
│   ├── Documentos adjuntos
│   └── Exportaciones
└── Continuidad
    ├── Backups automáticos
    ├── Retención definida
    ├── Backup fuera del servidor principal
    ├── Prueba de restauración
    └── Plan de recuperación
```

Un respaldo útil responde cinco preguntas:

1. ¿Qué datos se respaldan?
2. ¿Con qué frecuencia?
3. ¿Durante cuánto tiempo se conservan?
4. ¿Dónde se guardan y quién puede acceder?
5. ¿Se ha probado la restauración?

Para una landing inicial, respalda repositorio Git, configuraciones, contenido, leads, archivos y documentación de variables de entorno. No guardes secretos dentro del repositorio. Para una app con usuarios, añade backups de base de datos, archivos y un procedimiento de restauración probado.

---

## 8. Seguridad mínima indispensable

La seguridad es transversal: afecta frontend, backend, datos, despliegue y operación.

### Checklist de seguridad

- Usar HTTPS y redirigir tráfico HTTP a HTTPS.
- Validar datos en frontend para experiencia de usuario y en backend para seguridad real.
- Usar esquemas de validación para formularios y APIs.
- Aplicar límites de solicitudes para evitar abuso y spam.
- Proteger formularios contra bots y envíos automáticos.
- Guardar secretos en variables de entorno, nunca en código público, repositorios o frontend.
- Mantener dependencias actualizadas y revisar vulnerabilidades.
- Usar autenticación segura si existen usuarios.
- Expirar sesiones y permitir cerrar sesión.
- Verificar roles y permisos dentro del backend, no solo ocultar botones en frontend.
- Registrar acciones sensibles: login, cambios de datos, exportaciones, pagos y borrados.
- Aplicar el principio de mínimo privilegio: cada usuario o servicio recibe solo el acceso necesario.
- Usar backups automáticos y probar restauración.
- Monitorear errores de producción y configurar alertas.

En sistemas multiempresa, toda consulta debe incluir y verificar el identificador de empresa o tenant. El backend debe derivar esa identidad de una sesión válida, un subdominio validado o una ruta controlada; no debe confiar únicamente en un valor enviado por el navegador.

---

## 9. MVP para una landing de captación

```text
Visitante
   ↓
Landing pública
   ↓
Formulario con validación
   ↓
API o endpoint seguro
   ↓
Guardar lead: Google Sheets, Supabase o CRM
   ↓
Notificación al negocio
   ↓
Página de confirmación + evento de conversión
```

### Requisitos mínimos recomendables

- Dominio, HTTPS y hosting.
- Diseño responsive basado en un preset y contenido real.
- CTA claro y una sola acción principal.
- Formulario validado en frontend y backend.
- Protección antispam y límite de solicitudes.
- Almacenamiento de leads.
- Email o notificación al negocio.
- Página de éxito.
- Medición de conversiones.
- SEO básico: título, descripción, favicon, metadata y sitemap si el contenido es indexable.
- Accesibilidad básica: contraste, teclado, etiquetas de formularios y textos alternativos.
- Backups de contenido, configuración y leads.
- Logs y alerta si el formulario falla.

### Funciones que normalmente pueden esperar

- Login de usuarios.
- Panel individual por cliente.
- Roles complejos.
- Base de datos relacional sofisticada.
- Microservicios.
- Aplicación móvil.
- Sistema de pagos.
- CRM completo.

---

## 10. MVP para una app web con usuarios

```text
Usuario
   ↓ registro / login
Proveedor de autenticación
   ↓ sesión segura
Frontend privado
   ↓ API autenticada
Backend aplica permisos y reglas
   ↓
Base de datos + archivos + servicios externos
```

### Requisitos mínimos recomendables

- Todo lo necesario para una landing pública, si existe una parte pública.
- Modelo de usuario y organización/empresa si el sistema es multiempresa.
- Registro o invitación de usuario.
- Login, logout y recuperación de contraseña.
- Sesiones seguras y expiración.
- Roles mínimos: `admin` y `usuario`.
- Permisos comprobados en backend.
- Panel que resuelva una acción central de punta a punta.
- Base de datos con migraciones.
- Auditoría de acciones sensibles.
- Gestión de errores, monitoreo y pruebas de rutas críticas.
- Backups y restauración verificada.
- Política de privacidad y términos si se recolectan datos personales.

No agregues roles como `operador`, `superadmin`, `editor`, `vendedor` o `contador` hasta que una tarea real los justifique. Cada rol adicional aumenta pruebas, permisos, seguridad y mantenimiento.

---

## 11. Orden correcto de construcción

Construye por flujo completo o “rebanada vertical”: una pantalla conectada a una API, datos, seguridad básica y una prueba. No construyas primero todo el frontend y luego todo el backend.

1. Define el flujo que validará la idea.
2. Dibuja las pantallas y los pasos del usuario.
3. Define los datos mínimos que se deben guardar.
4. Diseña una interfaz responsive simple.
5. Crea el endpoint que valida y procesa la acción.
6. Guarda los datos en Sheets, base de datos o CRM.
7. Envía una notificación o confirmación.
8. Añade analítica, logs y monitoreo básico.
9. Prueba el flujo completo en móvil y escritorio.
10. Prueba datos inválidos, duplicados, spam y fallos de servicios externos.
11. Configura respaldos y realiza una restauración de prueba.
12. Lanza a pocos usuarios reales, mide y decide qué construir después.

---

## 12. Plantilla de documentación por proyecto

Usa una tarjeta o página por iniciativa con estos campos:

```text
Nombre del proyecto:
Cliente / usuario objetivo:
Problema específico:
Hipótesis:
Propuesta de valor:
Cómo lo validaré:
Métrica mínima de éxito:
Evidencia recopilada:
Decisión: continuar / cambiar / detener:
Motivo de la decisión:
Alcance del MVP:
Fuera de alcance:
Flujo de usuario:
Pantallas:
Datos a guardar:
Roles y permisos:
Integraciones:
Riesgos:
Seguridad:
Backups:
Enlace al prototipo:
Enlace al repositorio:
Próximo paso:
```

---

## 13. Caso aplicado: sistema de landings multiempresa

Para un sistema de landings dinámicas por empresa, un MVP razonable puede ser:

```text
Administrador configura una empresa
  ↓
Sistema genera o asigna URL de landing
  ↓
Visitante abre la landing personalizada
  ↓
El renderizador carga tema, bloques y contenido
  ↓
Visitante envía formulario
  ↓
API valida, limita spam y guarda el lead
  ↓
Empresa recibe notificación
  ↓
Administrador revisa conversión y errores
```

### Datos mínimos

```text
Empresa
├── id
├── nombre
├── slug / URL
├── estado
├── configuración de tema
└── proveedor de datos

Landing
├── empresa_id
├── preset
├── tema
├── bloques
├── contenido
└── estado de publicación

Lead
├── id
├── empresa_id
├── nombre
├── contacto
├── mensaje
├── fuente
├── fecha
└── estado de seguimiento

Usuario administrador
├── id
├── email
├── rol
└── empresa_id, si aplica
```

Si cada empresa se configura desde Google Sheets y se usa un motor de datos intercambiable —por ejemplo, Sheets, Supabase o Neon— conviene aislar el acceso a datos detrás de una capa de repositorio. De esa forma, el frontend y la lógica de negocio no necesitan saber dónde está guardada la información.

---

## 14. Los cuatro documentos mínimos

Para llevar un proyecto de forma visual y técnica, crea estos cuatro artefactos:

1. **Flujo de usuario:** muestra qué hace la persona desde que entra hasta que completa su objetivo.
2. **Diagrama de arquitectura:** muestra frontend, backend, base de datos, servicios externos y comunicación.
3. **Esquema de datos:** muestra entidades, campos y relaciones principales.
4. **Checklist de lanzamiento:** verifica funcionalidad, seguridad, medición, backups y operación.

Con esos cuatro elementos puedes decidir qué construir, explicar el proyecto a un colaborador, pedir ayuda a un agente de código o IDE y revisar que el MVP no olvide seguridad, respaldos y medición.
