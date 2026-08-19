# SuitOS Core

Un kernel portable de Agent Operating System — independiente de cualquier lógica de negocio. Proporciona registry declarativo, dispatcher de intenciones, loader contextual, planner gobernado, router de IA con circuit breaker, generador de módulos, agentes de revisión y un contrato MCP portable. Diseñado para que cualquier proyecto (nuevo o existente) lo consuma sin copiar archivos.

Extraído de un monorepo SaaS multi-inquilino en producción. Cada pieza fue validada en uso real antes de ser promovida al Core.

## Estructura

```
SuitOSCore/
├── registry/              ← agents, models, permissions, routing, skills, workflows
├── dispatcher/            ← Algoritmo de orquestación (parse → match → plan)
├── loader/                ← Estrategias de carga minimal/standard/deep
├── planner/               ← Template de plan + contrato de gobernanza "modo seguro"
├── scaffold/              ← create-suit-module: CLI generador de módulos Express
├── ai-router/             ← modelScanner + circuitBreaker + modelRouter (fallback en cascada)
├── agents/                ← reportero (code review), probador (smoke tests), memory-scaffold
├── skills/                ← multi-tenant.yaml (aislamiento reutilizable)
├── tooling/               ← generate-index.js, mcp-bridge/shim.js
├── mcp.contract.md        ← Contrato "raíz declara superset, subproyecto activa subconjunto"
├── package.json           ← Binarios CLI para consumo como npm package
└── .env.example           ← Variables de entorno requeridas
```

## Cómo consumirlo

Hay tres formas de usar SuitOS Core desde un proyecto externo:

**1. npm local (recomendado).** En el proyecto destino ejecuta `npm install file:../ruta/a/SuitOSCore`. Esto expone los binarios `create-suit-module`, `reportero`, `probador`, `generate-index` y `mcp-shim` directamente en tu `node_modules/.bin`. También permite imports de Node.js como `require('suitos-core/ai-router/modelRouter')` para usar el enrutamiento de IA programáticamente.

**2. CLI directa.** Sin instalación, invoca los scripts desde su ubicación: `node ruta/a/reportero.js --file index.js`. Cada script acepta `--help` o flags documentados en su encabezado.

**3. MCP server.** Usa `mcp-bridge/shim.js` como adaptador universal. Configura en tu `.mcp.json` apuntando al shim con el paquete MCP deseado: `node tooling/mcp-bridge/shim.js --package @supabase/mcp-server`. Las credenciales se inyectan desde tu `.env` local, nunca se hardcodean.

## Registry y Dispatcher

El archivo `registry/routing.yaml` mapea intenciones del usuario (patrones de texto) a workflows. Cada intención tiene prioridad, agente asignado y skills requeridos. El `dispatcher/entrypoint.md` describe un algoritmo de 10 pasos: parsea el request, hace matching de intención, resuelve workflow, agente, skills, proyecto, permisos y modelo, y produce un Plan de Orquestación.

Este mecanismo reemplaza condicionales hardcodeados (`if/else` de routing) por YAML declarativo. Para integrarlo en un agente, basta que el agente lea entrypoint.md y consulte los registros relevantes al inicio de cada interacción.

Cada archivo en `registry/` está limpiado de contenido de negocio. Los modelos en `models.yaml` son referencias genéricas (Claude, Gemini, OpenRouter). Los workflows en `workflows.yaml` cubren feature, bugfix, audit, docs, research, deploy, review y migration — sin dependencias a tablas, folios o giros específicos.

## Loader y Planner

El `loader/strategy.yaml` define tres presets de contexto: **minimal** (2K tokens — solo reglas del proyecto y workflow), **standard** (8K tokens — contexto completo para desarrollo de features) y **deep** (20K tokens — auditoría y migraciones con decisiones arquitectónicas y patrones). Cada preset lista includes/excludes y casos de uso recomendados.

El `planner/template.yaml` fusiona un template de plan con el contrato de gobernanza "modo seguro". Exige que cualquier cambio en código pase por tres gates: propuesta de plan numerado, aprobación explícita del usuario (`APROBADO`) y resumen ejecutivo de cierre con archivos leídos/modificados, invariantes verificadas y consumo de créditos declarado. Esto evita modificaciones no autorizadas y mantiene trazabilidad.

## Scaffold Generator

`scaffold/create-suit-module/index.js` es un CLI que genera la estructura completa de un módulo Express: `index.js` (servidor con middleware de auth stub), `db/client.js` (cliente Supabase server-side, sin exponer `service_role` al frontend), `handlers/api.js` (CRUD con soft delete), `services/service.js` (lógica de negocio), `package.json` y `.env.example`. Se invoca con `node scaffold/create-suit-module/index.js --name MiModulo --port 3000`.

El template resultante incluye un hook de autenticación que falla explícito si no se configura — cerrando las brechas TD-014 (APIs sin middleware de auth) y TD-015 (service_role expuesta al cliente) identificadas en el código original. Cada módulo generado es independiente y puede montarse en un `server.js` existente vía `require` + `app.use()`.

## AI Router

El trio `ai-router/modelScanner.js`, `circuitBreaker.js` y `modelRouter.js` proporciona enrutamiento inteligente de modelos de IA con fallback en cascada. El scanner descubre modelos gratuitos de OpenRouter y OpenCode Zen, los prueba con un ping de 5s, y los cachea por 1 hora. El circuit breaker (en memoria, 3 fallos consecutivos → cooldown de 5 minutos) evita llamadas a modelos caídos. El router ordena por latencia, prueba cada modelo, y si todos fallan recurre a Gemini REST directo como último recurso.

Para usarlo desde tu proyecto: `const { route } = require('suitos-core/ai-router/modelRouter')` y llama `route(messages)` donde `messages` es un array `{ role, content }`. Necesitas las variables de entorno del `.env.example` configuradas. El módulo es 100% autónomo — no depende de Express ni de ningún framework.

## Agentes: Reportero y Probador

`agents/reportero/reportero.js` es un revisor de código read-only. Escanea un archivo contra perfiles de revisión, ejecuta análisis contextual (complejidad de funciones, duplicación, robustez, código muerto, consistencia, acoplamiento) y genera un reporte Markdown. Se invoca con `node reportero/reportero.js --file src/app.js --profile security`. Nunca modifica archivos.

`agents/probador/probador.js` es un ejecutor de smoke tests. Lee suites definidas en YAML (formato: servidor, tests con request/expect), ejecuta peticiones HTTP reales y evalúa status code, contenido del body y claves JSON. Se invoca con `node probador/probador.js --suite system`. Nunca modifica datos ni servidores. Ambos agentes siguen el principio de solo lectura — seguros de ejecutar en cualquier repositorio sin riesgo de efectos secundarios.

## MCP Bridge y Contrato

El `tooling/mcp-bridge/shim.js` es un lanzador genérico de servidores MCP con inyección de secretos. Recibe `--package` (nombre del paquete npm) y `--env KEY=val` (opcional, múltiple), invoca `npx -y <package>` con `process.env` enriquecido. Esto permite usar cualquier MCP server oficial sin hardcodear credenciales en `.mcp.json`. Ejemplo: `node tooling/mcp-bridge/shim.js --package @supabase/mcp-server --env SUPABASE_URL=...`.

El `mcp.contract.md` formaliza el patrón: la raíz del proyecto declara el superset de servidores MCP disponibles, cada subproyecto activa un subconjunto via `enabledMcpjsonServers` o redeclara un servidor con su propio entorno. Este contrato fue extraído de un monorepo con 10+ módulos que ya lo usaban en producción de forma embrionaria; ahora está documentado como estándar replicable.

## Skills Reutilizables

`skills/multi-tenant.yaml` es una skill de aislamiento multi-inquilino en formato estándar. Contiene reglas con id (`mt-001` a `mt-004`), severidad, descripción y ejemplos correcto/incorrecto pareados. Cubre: filtrado por `tenant_id` en todas las queries, prohibición de acceso cross-tenant, soft delete obligatorio (nunca DELETE físico) y extracción del tenant desde el token de autenticación. Es 100% genérica — aplica a cualquier SaaS multi-inquilino sin modificaciones.

Para agregar esta skill a un agente, referencia el archivo en su definición. El formato (id, severidad, descripción, ejemplos) es el estándar para todas las skills del Core. Si necesitas una skill de dominio específico, usa este mismo archivo como plantilla.

## Tooling

`tooling/generate-index.js` escanea el proyecto actual (excluyendo `node_modules`, `.git`, etc.) y genera un `INDEX.md` con todas las funciones JavaScript/TypeScript encontradas, su línea exacta y archivo. Es el mecanismo que hace posible la carga contextual selectiva del Loader. Se parametriza editando `FILE_CATEGORIES` al inicio del script para adaptarlo a la estructura de carpetas del proyecto destino.

`tooling/mcp-bridge/shim.js` (descrito arriba) también sirve como utilidad independiente para invocar cualquier MCP server con las credenciales correctas sin tocar archivos de configuración globales.

## Integración con Claude Code / OpenCode

Para usar SuitOS Core como toolkit de agente desde cualquier proyecto:

1. Instala localmente: `npm install file:./SuitOSCore`
2. En tu AGENTS.md o reglas, referencia:
   - `SuitOSCore/ARCHITECTURE.md` como arquitectura del sistema
   - `SuitOSCore/registry/routing.yaml` para routing de intenciones
   - `SuitOSCore/loader/strategy.yaml` para carga de contexto
   - `SuitOSCore/planner/template.yaml` como contrato de planificación
3. Los binarios `reportero`, `probador`, `generate-index` y `mcp-shim` están disponibles como comandos si instalaste via npm.
4. Para memoria persistente de subagentes, copia `agents/memory-scaffold/README.md` como punto de partida.

El diseño asume que el proyecto consumidor tiene AGENTS.md como fuente de reglas inmutables, y que el agente carga jerárquicamente: arquitectura → reglas → workflows → skills → código. Esta jerarquía es la misma que SuitOS Core documenta en su `dispatcher/entrypoint.md`.

## Variables de Entorno

Copia `.env.example` a `.env` en tu proyecto. Las variables requeridas dependen de qué componentes uses:

- `OPENROUTER_API_KEY` y `OPENCODE_API_KEY`: necesarias para el AI Router (scanner y router).
- `GEMINI_API_KEY`: necesaria para el fallback directo a Gemini del AI Router.
- `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`: necesarias para el scaffold module template y el MCP bridge de Supabase.

Ninguna de estas variables está hardcodeada en ningún archivo del Core. El MCP Shim las inyecta desde `process.env` al lanzar servidores MCP, y los templates del scaffold las leen desde `.env` via `dotenv`.

## Origen y Filosofía

SuitOS Core fue extraído de un monorepo SaaS en producción llamado SuitOrg. Durante una auditoría arquitectónica se identificaron 28 candidatos reutilizables — patrones, arquitecturas, agentes, skills, flujos, MCPs, plantillas y automatizaciones que operaban entremezclados con lógica de negocio específica (POS, cotizaciones, reservaciones, campañas de marketing).

El Core contiene solo los 10 candidatos de mayor impacto, limpiados de referencias a tablas, folios, tokens, URLs y reglas de negocio particulares. Cada componente fue validado en uso real antes de su extracción. El criterio rector fue: "si un proyecto nuevo, en una carpeta distinta, puede consumir esta pieza sin copiar ni modificar archivos de origen, entonces merece estar en el Core."

## Preguntas Frecuentes

**¿SuitOS Core descubre automáticamente skills y agentes confiables?** Hoy estamos en ~85% del camino. El builder (`tooling/build-registry.js`) escanea manifests en `skills/` y `agents/`, valida dependencias, verifica que los archivos referenciados existan, y regenera los registros automáticamente. El servidor MCP (`--server`) expone todos los skills como tools vivas en `POST /mcp/v1/tools/list` — cualquier agente consulta este endpoint y descubre qué skills están disponibles sin leer ningún archivo estático. El modo `--watch` reacciona a cambios en los manifests y reconstruye solo. Lo que falta para el 100% es que el servidor no solo liste y describa skills, sino que ejecute su lógica real cuando un agente invoca `tools/call`. Eso convertiría a SuitOS Core en un runtime completo de agentes sin configuración manual.

**¿Cómo uso SuitOS Core "de manera pro" desde mis prompts?** La forma recomendada cambió con el MCP server runtime. Ya no necesitas instruir manualmente al agente para que lea YAMLs. En tu `.mcp.json` agregas `"suitos-registry": { "command": "node", "args": ["./SuitOSCore/tooling/build-registry.js", "--server", "--watch"] }`. El agente descubre los skills automáticamente consultando `POST /mcp/v1/tools/list`. Para el flujo completo, usa la jerarquía de `ejemplo-proyecto/`: un agente arquitecto en AGENTS.md raíz clasifica tu solicitud, elige estrategia con `loader/strategy.yaml`, arma un plan con `planner/template.yaml`, y delega a agentes especializados (developer, reviewer, tester). Cada especialista solo carga sus propias reglas y MCPs. El resultado: no repites instrucciones, los skills se descubren solos, y cada agente trabaja con el mínimo contexto posible.

**¿Cómo estructuro agentes especializados que corran en paralelo?** Usa una jerarquía de AGENTS.md. Un agente arquitecto en la raíz carga el dispatcher y planner de SuitOS Core — clasifica tu solicitud, elige estrategia y arma un plan. Luego delega la ejecución a agentes especializados (developer, reviewer, tester), cada uno con su propio AGENTS.md que solo referencia las skills y MCPs que necesita. El arquitecto no escribe código; solo orquesta. Esto mantiene el contexto de cada agente acotado y evita saturar tokens. En `ejemplo-proyecto/` dentro de SuitOSCore hay un template funcional de esta jerarquía.

**¿Optimiza tokens de entrada y salida automáticamente?** Hay avances indirectos pero el problema directo sigue igual. Lo que mejoró: el MCP server permite descubrir skills sin cargar archivos YAML completos, y la jerarquía de agentes hace que cada especialista solo cargue sus reglas (el developer no gasta tokens en reglas de review, el reviewer no gasta tokens en scaffolding). Lo que no cambió: el `loader/strategy.yaml` sigue siendo una guía voluntaria con presupuestos fijos (2K, 8K, 20K) — no hay código que mida tokens en tiempo real, purgue archivos del contexto al acercarse al límite o decida dinámicamente qué mantener. Para resolverlo de fondo tocaría un loader programático que mida tokens antes de cada carga y optimice automáticamente. Eso no está implementado.

**¿Cubre estándares de código, flujo de trabajo, revisiones, testing y documentación?** Cubre bien 5 de 9. Los flujos de trabajo están definidos en `workflows.yaml` con 9 tipos, riesgo asignado y revisores requeridos. Las revisiones de arquitectura y seguridad son pasos obligatorios en el planner y en permissions.yaml. El testing se ejecuta con `probador` desde suites YAML declarativas. La documentación se facilita con `generate-index.js`. Los 4 restantes tienen presencia débil: no hay un estándar general de código con reglas de estilo, no hay convenciones de Git (formato de commits, política de ramas), las optimizaciones solo existen como presupuestos de tokens sin enforcement, y los checklists por tipo de tarea (pre-deploy, pre-commit) no están implementados. Puedes agregarlos como YAML en `registry/` usando el mismo formato de `multi-tenant.yaml` como plantilla.

## Inicio Rápido — Cómo Organizar tu Prompt

Para activar todo SuitOS Core desde un solo prompt, sigue esta receta:

1. **Requisito**: agrega el MCP server a tu `.mcp.json`: `{ "mcpServers": { "suitos": { "command": "node", "args": ["./SuitOSCore/tooling/build-registry.js", "--server", "--watch"] } } }`. Luego corre `npm run registry:server`.

2. **Escribe tu prompt con este formato de 3 partes**:

```
[Contexto] Quiero {hacer X}
[Plan] Dame un plan numerado antes de ejecutar
[Cierre] Al terminar dame resumen ejecutivo
```

3. **Ejemplo completo listo para copiar y pegar**:

```
Necesito un módulo de catálogo de productos con CRUD completo y aislamiento multi-inquilino.
Antes de ejecutar, dame un plan numerado con archivos a leer, archivos a modificar y riesgos.
Yo respondo APROBADO o RECHAZADO.
Usa el MCP server para descubrir qué skills están disponibles.
Si tocas más de 3 archivos, pide GLOBAL_APPROVAL primero.
Al terminar, dame resumen ejecutivo: archivos tocados, skills usados, invariantes verificadas, sugerencias.
```

4. **Qué activa cada parte del prompt**:

| Frase en el prompt | Activa |
|-------------------|--------|
| "Dame un plan numerado" | planner/template.yaml + governor gate |
| "APROBADO o RECHAZADO" | Contrato de gobierno gov-001 |
| "Descubre skills disponibles" | MCP server -> tools/list |
| "GLOBAL_APPROVAL" | Gov-002 (lectura >3 archivos) |
| "Resumen ejecutivo" | Gov-003 (cierre obligatorio) |
| "Carga la estrategia minimal/standard/deep" | loader/strategy.yaml |

La primera vez que uses este prompt, el agente arquitecto carga routing.yaml, clasifica tu intención, elige estrategia, consulta el MCP server por skills disponibles, arma el plan, espera tu APROBADO, y delega a los especialistas. Sin repetir instrucciones nunca más. Para la jerarquía completa de agentes (arquitecto, developer, reviewer, tester), copia la estructura de `ejemplo-proyecto/`.

## Licencia

MIT. Usa, modifica y distribuye libremente. Atribución apreciada pero no requerida.
