# JOBMARGIN AI
## Product Requirements Document + Master Build Prompt

Actúa como un equipo senior compuesto por:

- Product Manager
- UX/UI Designer
- Senior Full-Stack Engineer
- AI Engineer
- SaaS Architect
- QA Engineer

Tu objetivo es construir un MVP funcional llamado **JobMargin AI**.

---

# 1. PRODUCT VISION

JobMargin AI es un micro-SaaS de inteligencia artificial para pequeños emprendedores de servicios para el hogar:

- Plomeros
- Electricistas
- Pintores
- Jardineros
- Limpieza
- HVAC
- Handyman
- Drywall
- Roofing
- Landscaping
- Carpintería
- Mantenimiento

El producto NO debe posicionarse inicialmente como un CRM.

Su propuesta de valor principal es:

> "Ayudarte a saber cuánto cobrar antes de aceptar un trabajo."

La aplicación convierte una descripción del trabajo, fotografías y datos básicos proporcionados por el emprendedor en:

1. Alcance del trabajo
2. Preguntas faltantes
3. Estimación de horas
4. Estimación de materiales
5. Costos estimados
6. Precio mínimo recomendado
7. Precio recomendado
8. Precio premium
9. Margen esperado
10. Cotización profesional

Después del trabajo, el usuario puede introducir los costos y horas reales.

El sistema compara:

ESTIMATED vs ACTUAL

y utiliza esos datos para mejorar futuras recomendaciones.

---

# 2. TARGET USER

Usuario principal:

Emprendedor individual o pequeño negocio de servicios para el hogar.

Características:

- Pocas personas o trabaja solo
- No es experto en software
- Utiliza teléfono principalmente
- Recibe solicitudes por teléfono, SMS o WhatsApp
- Hace cotizaciones manualmente
- Puede perder dinero por cobrar demasiado barato
- Tiene poco tiempo administrativo
- No quiere aprender un sistema complejo

La interfaz debe poder utilizarse sin capacitación.

---

# 3. CORE VALUE PROPOSITION

El producto debe responder una pregunta:

> "¿Este trabajo vale la pena y cuánto debería cobrar?"

No construir funcionalidades que no contribuyan directamente a esa pregunta en el MVP.

---

# 4. MVP FEATURES

## 4.1 ONBOARDING

Al registrarse, solicitar:

- Business name
- Owner name
- Service category
- Service area
- Currency
- Labor cost/hour
- Desired profit margin
- Minimum job price
- Travel/service-call fee
- Tax percentage
- Default overhead percentage

Permitir configurar posteriormente estos datos.

---

# 5. BUSINESS PROFILE

Crear configuración:

Business Information:

- Business name
- Logo
- Phone
- Email
- Address
- Service category
- Service area

Pricing Configuration:

- Labor hourly cost
- Target margin
- Minimum job price
- Travel fee
- Tax
- Overhead

El sistema debe usar estos valores como defaults.

---

# 6. CUSTOMER MANAGEMENT

Crear módulo simple de clientes.

Campos:

- id
- business_id
- name
- phone
- email
- address
- notes
- created_at

No construir CRM avanzado.

---

# 7. CREATE NEW JOB

El usuario debe poder crear un trabajo.

Campos iniciales:

- Customer
- Job title
- Job description
- Photos
- Voice description
- Address
- Preferred date
- Notes

La entrada debe ser extremadamente sencilla.

Ejemplo:

"Necesito pintar el interior de una casa de 3 recámaras."

El sistema debe permitir posteriormente agregar fotografías.

---

# 8. AI JOB ANALYSIS

Cuando el usuario envíe información del trabajo, la IA debe analizarla.

Debe identificar:

- Tipo de trabajo
- Subtipo
- Dimensiones conocidas
- Cantidad de habitaciones
- Materiales potenciales
- Complejidad
- Riesgos
- Información faltante
- Posibles extras

La IA NO debe inventar información.

Si no conoce un dato, debe marcarlo como:

UNKNOWN

---

# 9. SMART QUESTIONS

La IA debe generar únicamente las preguntas necesarias para mejorar la cotización.

Ejemplo:

Usuario:

"Necesito pintar mi casa."

IA:

"Para calcular mejor el precio necesito 3 datos:

1. ¿Cuántas habitaciones quieres pintar?
2. ¿Las paredes están actualmente pintadas o hay que preparar la superficie?
3. ¿Incluye techos y puertas?"

No realizar interrogatorios largos.

Máximo 5 preguntas iniciales.

---

# 10. ESTIMATION ENGINE

Separar completamente:

AI interpretation

de

PRICE CALCULATION

La IA interpreta el trabajo.

El motor matemático calcula el precio.

Nunca permitir que el LLM determine directamente el precio final sin pasar por el pricing engine.

---

# 11. PRICING ENGINE

Crear una función central:

calculateEstimate()

Debe considerar:

labor_hours
labor_cost
materials
material_markup
travel_cost
equipment_cost
overhead
tax
target_margin
minimum_job_price

Calcular:

estimated_cost

minimum_price

recommended_price

premium_price

estimated_profit

estimated_margin

---

# 12. THREE PRICE LEVELS

Mostrar tres opciones:

### Minimum
Precio mínimo que protege al negocio.

### Recommended
Precio recomendado según margen objetivo.

### Premium
Precio superior que puede incluir beneficios adicionales.

Ejemplo:

Minimum: $1,550

Recommended: $1,850

Premium: $2,150

No presentar estas cifras como verdad absoluta.

Mostrar siempre:

"AI estimate"

y permitir editar manualmente.

---

# 13. PROFIT GUARD

Esta es una de las funcionalidades principales.

Si el usuario introduce un precio menor al recomendado, mostrar una alerta.

Ejemplo:

"Profit Warning"

"Este precio está por debajo de tu margen objetivo."

Mostrar:

Estimated revenue
Estimated cost
Estimated profit
Estimated margin

Ejemplo:

Revenue: $1,500
Cost: $1,350
Profit: $150
Margin: 10%

Target margin: 30%

Mensaje:

"Reducir el precio en $350 disminuiría considerablemente tu margen estimado."

El usuario siempre conserva el control.

---

# 14. ESTIMATE BREAKDOWN

Mostrar:

LABOR

Hours:
12

Labor cost:
$480

MATERIALS

Paint:
$320

Supplies:
$80

OTHER

Travel:
$50

Equipment:
$40

OVERHEAD

$100

TOTAL ESTIMATED COST

$1,070

RECOMMENDED PRICE

$1,650

ESTIMATED PROFIT

$580

ESTIMATED MARGIN

35.1%

Todos los valores deben poder editarse.

---

# 15. AI SCOPE OF WORK

Generar automáticamente un Scope of Work profesional.

Debe incluir:

- Work included
- Materials included
- Preparation
- Number of coats / units cuando aplique
- Cleanup
- Exclusions
- Assumptions

La IA debe evitar prometer cosas que el usuario no confirmó.

---

# 16. QUOTE GENERATOR

Generar una cotización profesional.

Debe contener:

Business information
Customer information
Job description
Scope of work
Included materials
Exclusions
Price
Estimated timeline
Terms
Quote expiration
Acceptance section

Crear vista web y PDF.

El diseño debe parecer profesional pero sencillo.

---

# 17. QUOTE SHARING

Cada cotización debe tener un enlace único.

Ejemplo conceptual:

/quote/{public_id}

El cliente puede:

- View quote
- Accept
- Decline
- Request changes

Registrar:

accepted_at
declined_at
viewed_at

No implementar pagos en el MVP.

---

# 18. JOB STATUS

Estados:

- Draft
- Estimating
- Quote Sent
- Viewed
- Accepted
- Declined
- Scheduled
- In Progress
- Completed
- Cancelled

---

# 19. ACTUAL JOB RESULTS

Cuando el trabajo termine, solicitar:

- Actual hours
- Actual material cost
- Actual additional expenses
- Final revenue
- Notes

Calcular:

actual_cost
actual_profit
actual_margin

Comparar:

estimated vs actual

---

# 20. AI LEARNING LOOP

Después de completar trabajos, mostrar:

"Your estimate vs reality"

Ejemplo:

Estimated hours: 10
Actual hours: 14

Difference: +40%

Mostrar una recomendación:

"Your last 5 similar jobs took approximately 18% longer than your original estimates."

IMPORTANTE:

No afirmar estadísticas cuando no existan suficientes datos.

Usar mensajes como:

"Based on 8 completed similar jobs..."

Cuando existan datos suficientes.

---

# 21. DASHBOARD

Dashboard extremadamente sencillo.

Mostrar:

Jobs this month

Quotes sent

Quotes accepted

Revenue

Estimated profit

Actual profit

Average margin

Profit warnings

También mostrar:

"Jobs losing margin"

y

"Jobs with strongest margins"

---

# 22. AI INSIGHTS

Crear una sección:

"AI Business Insights"

Ejemplos:

- "You may be underestimating labor on painting jobs."
- "Your average margin for emergency plumbing jobs is higher."
- "Three recent jobs exceeded estimated labor hours."
- "Your minimum job price may be too low."

Nunca generar conclusiones sin datos suficientes.

---

# 23. UI/UX

Diseñar para un usuario que probablemente utiliza el teléfono mientras trabaja.

Principios:

- Mobile first
- Large buttons
- Minimal text
- Simple navigation
- Clear numbers
- High readability
- Few screens
- No unnecessary configuration
- Fast interactions

Navigation:

Dashboard
Jobs
Quotes
Customers
Settings

Botón principal:

"+ New Job"

---

# 24. VISUAL DESIGN

Diseño moderno de SaaS.

Debe transmitir:

- Professional
- Trustworthy
- Simple
- Financial clarity

Evitar:

- Interfaces corporativas complejas
- Exceso de gráficos
- Menús profundos
- Terminología técnica

Los números de dinero y margen deben ser visualmente muy claros.

---

# 25. DATABASE

Diseñar una arquitectura multi-tenant.

Tablas mínimas:

users
businesses
customers
jobs
job_photos
estimates
estimate_items
quotes
quote_events
job_results
expenses
ai_insights

Todas las entidades pertenecientes a un negocio deben tener:

business_id

Implementar aislamiento de datos por tenant.

---

# 26. SECURITY

Implementar:

- Authentication
- Authorization
- Tenant isolation
- Input validation
- Secure API routes
- Server-side authorization
- Protected customer data

Nunca confiar únicamente en validaciones del frontend.

---

# 27. AI ARCHITECTURE

Crear una capa independiente:

AIService

Funciones conceptuales:

analyzeJob()
generateQuestions()
generateScope()
detectRisks()
generateInsights()

El sistema debe poder cambiar posteriormente de proveedor/modelo de IA sin reescribir la aplicación.

No acoplar la lógica de negocio directamente al proveedor de IA.

---

# 28. AI OUTPUT VALIDATION

Todos los outputs importantes de IA deben utilizar estructuras JSON validadas.

Nunca depender de texto libre cuando el resultado se utilizará para cálculos.

Ejemplo conceptual:

{
  "job_type": "...",
  "complexity": "...",
  "estimated_hours": 12,
  "materials": [],
  "missing_information": [],
  "risks": []
}

Validar siempre la respuesta antes de utilizarla.

---

# 29. IMPORTANT BUSINESS RULE

La IA puede:

- interpretar
- clasificar
- sugerir
- resumir
- detectar información faltante

El sistema matemático debe:

- calcular costos
- calcular márgenes
- calcular precios
- calcular utilidad

Esta separación es obligatoria.

---

# 30. ERROR HANDLING

Si la IA falla:

La aplicación debe seguir funcionando.

Permitir al usuario introducir manualmente:

- Hours
- Materials
- Costs
- Price

El producto nunca debe quedar inutilizable porque el servicio de IA no responde.

---

# 31. MVP OUT OF SCOPE

NO implementar todavía:

- Payroll
- Full accounting
- Inventory management
- Advanced scheduling
- GPS tracking
- Employee management
- Fleet management
- Payment processing
- Complex CRM
- Native mobile apps
- Automated WhatsApp conversations
- Marketplace
- Customer portal avanzado

La prioridad es validar:

"Can AI help a home-service entrepreneur quote more profitably?"

---

# 32. PRODUCT METRIC

La métrica principal del MVP debe ser:

**Profit Protected**

Definición:

Cantidad estimada de dinero que el sistema evitó perder mediante recomendaciones o Profit Guard.

Ejemplo:

Quote without AI: $1,400
Recommended price: $1,750

Potential protected margin:

$350

Mostrar esto únicamente como estimación y no como dinero realmente ganado.

---

# 33. ACTIVATION EVENT

Considerar al usuario activado cuando:

1. Crea su primer Job
2. Genera su primera AI Estimate
3. Envía su primera Quote

---

# 34. TECHNICAL IMPLEMENTATION

Antes de escribir código:

1. Analiza el proyecto existente.
2. Identifica stack tecnológico.
3. No cambies tecnologías sin una razón fuerte.
4. Reutiliza componentes existentes.
5. Define arquitectura.
6. Define database schema.
7. Define API contracts.
8. Define AI schemas.
9. Define pricing engine.
10. Después comienza la implementación.

No crear código innecesario.

Priorizar simplicidad y velocidad de desarrollo.

---

# 35. DEVELOPMENT STRATEGY

Construir en fases.

## Phase 1

Authentication
Business onboarding
Database
Dashboard básico

## Phase 2

Customers
Jobs
Job creation

## Phase 3

AI Job Analysis
Smart Questions

## Phase 4

Pricing Engine
Estimate

## Phase 5

Profit Guard
Scope of Work

## Phase 6

Quote Generator
Public Quote

## Phase 7

Job Completion
Estimated vs Actual

## Phase 8

AI Insights

Después de cada fase:

- Test
- Fix
- Verify
- Continue

No avanzar si la fase actual tiene errores críticos.

---

# 36. TESTING

Crear pruebas para:

- Pricing calculations
- Margin calculations
- Minimum price
- Recommended price
- Multi-tenant isolation
- Authentication
- Quote access
- AI response validation
- Missing data
- AI failure
- Manual fallback

Especialmente probar:

- Zero costs
- Negative values
- Extremely high values
- Missing materials
- Missing labor hours
- AI unavailable

---

# 37. FINAL UX PRINCIPLE

El usuario debe poder pasar de:

"Me llegó un trabajo"

a

"Tengo una cotización profesional"

en pocos minutos.

La aplicación debe sentirse como:

> "Tengo un experto financiero y de estimaciones trabajando conmigo."

No debe sentirse como:

> "Estoy llenando formularios de un CRM."

---

# 38. FIRST VERSION SUCCESS CRITERIA

El MVP estará terminado cuando un usuario pueda:

1. Crear una cuenta
2. Configurar su negocio
3. Crear un cliente
4. Crear un trabajo
5. Escribir o subir información del trabajo
6. Obtener análisis de IA
7. Responder preguntas
8. Generar una estimación
9. Ver costo y margen
10. Recibir Profit Warning
11. Generar una cotización
12. Compartirla mediante enlace
13. Marcar el trabajo como completado
14. Introducir costos reales
15. Comparar estimado vs real

---

# 39. MOST IMPORTANT RULE

No sobreconstruir.

Construye primero un producto pequeño, rápido y funcional que demuestre una sola cosa:

> **JobMargin AI ayuda a los pequeños negocios de servicios para el hogar a tomar mejores decisiones de precio y proteger su margen.**

Si una funcionalidad no ayuda directamente a demostrar esa hipótesis, déjala fuera del MVP.

Antes de implementar funcionalidades adicionales, pregunta:

"¿Esto aumenta la capacidad del usuario para conseguir trabajos rentables o solamente hace que el software tenga más características?"

Prioriza siempre la primera opción.