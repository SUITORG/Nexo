# Prompt: Constructor de SuitOS Core

> Prompt listo para pegar en una sesión nueva de Claude Code (o equivalente) para **construir** SuitOS Core como un toolkit portable, independiente del negocio, que gestiona y reutiliza MCPs, skills y agentes desde cualquier proyecto o carpeta. Se apoya en `SuitOSCore/CANDIDATOS-SUITOS-CORE.md` como fuente de verdad de qué extraer.

---

```
Actúa como Software Architect y ejecutas la construcción de SuitOS Core:
un kernel de agentes portable, independiente de cualquier lógica de negocio,
que vive en C:\Users\rojo-\Downloads\SUITORGSTORE01\SuitOSCore\ y que otros
proyectos (dentro o fuera de este repo) puedan consumir sin copiar/pegar código.

ANTES DE EMPEZAR
1. Lee completo SuitOSCore/CANDIDATOS-SUITOS-CORE.md — es el inventario ya
   auditado de qué extraer, de dónde, y por qué. No vuelvas a analizar todo
   el repo desde cero; ese trabajo ya está hecho.
2. Construye SOLO a partir de los candidatos de impacto Alto. Los de impacto
   Medio solo si primero resuelves el "qué falta" anotado junto a cada uno
   (desacoplar de nombres de negocio, decidir cuál mecanismo es la fuente de
   verdad cuando hay solapamiento, etc.). Ignora por completo los de impacto
   Bajo salvo que yo te lo pida explícitamente.
3. Regla dura: CERO lógica de negocio de SuitOrg (id_empresa como concepto de
   aislamiento sí es genérico y se queda; nombres de tablas, folios LEAD-XXX/
   ORD-XXX, reglas de créditos, IVA, giros_especificos, etc. NO se quedan).
4. Antes de mover o copiar cualquier archivo fuera de su ubicación actual,
   dime qué vas a mover y espera confirmación — no soy dueño de descartar
   trabajo en progreso sin verlo primero.

QUÉ CONSTRUIR (estructura objetivo de SuitOSCore/)

  SuitOSCore/
  ├── registry/              ← agents.yaml, skills.yaml, workflows.yaml,
  │                             models.yaml, permissions.yaml, routing.yaml
  │                             — copiados y LIMPIADOS de contenido de negocio
  │                             desde .suit/registry/*.yaml (candidato #1)
  ├── dispatcher/
  │   └── entrypoint.md      ← el algoritmo de 10 pasos, generalizado
  │                             (candidato #1, desde .suit/dispatcher/)
  ├── loader/
  │   └── strategy.yaml      ← minimal/standard/deep (candidato #18)
  ├── planner/
  │   └── template.yaml      ← plan template + el contrato de gobernanza de
  │                             orquestador.md fusionado aquí (candidatos #1 y #10:
  │                             decide UN solo gate, no dos mecanismos paralelos)
  ├── scaffold/
  │   └── create-suit-module/  ← generador real (CLI o script) que produce
  │                             la estructura index.js+db+handlers+services+
  │                             package.json+.env.example (candidato #2).
  │                             OBLIGATORIO: el template generado debe incluir
  │                             middleware de auth y jamás exponer la
  │                             service_role key al cliente — cierra aquí
  │                             mismo TD-014 y TD-015 (ver nota de higiene al
  │                             final de CANDIDATOS-SUITOS-CORE.md) para que
  │                             ningún módulo nuevo vuelva a heredar el hueco.
  ├── ai-router/
  │   ├── modelScanner.js    ← candidato #3, adaptado desde SuitAI/services/
  │   ├── circuitBreaker.js
  │   └── modelRouter.js
  ├── agents/
  │   ├── reportero/          ← candidato #4, desde scripts/agents/reportero.js
  │   ├── probador/           ← candidato #4, desde scripts/agents/probador.js
  │   └── memory-scaffold/    ← candidato #9: la spec de memoria persistente
  │                             (tipos user/feedback/project/reference) como
  │                             plantilla que cualquier subagente nuevo importa
  ├── skills/
  │   └── multi-tenant.yaml  ← candidato #8, tal cual (ya es genérica)
  ├── tooling/
  │   ├── generate-index.js  ← candidato #5, con FILE_CATEGORIES parametrizable
  │   └── mcp-bridge/
  │       └── shim.js        ← candidato #6 generalizado: firma
  │                             shim(mcpServerPackage, envVars) en vez de
  │                             estar codeado solo para Supabase
  └── mcp.contract.md         ← candidato #7: documenta el contrato
                                 "raíz declara superset, subproyecto activa
                                 subconjunto o sobreescribe" para que
                                 cualquier proyecto nuevo lo siga sin
                                 reinventarlo

CÓMO DEBE SER "LLAMABLE DESDE OTROS SISTEMAS O CARPETAS"
Este es el requisito central — no construyas SuitOSCore/ como una carpeta
más que solo esta monorepo usa. Decide y justifica UNO de estos dos caminos
(o propón un tercero si tienes mejor criterio, pero justifícalo):

  (a) Paquete npm local instalable por ruta/symlink
      (`npm install file:../SuitOSCore` o workspace) — cualquier Suit*
      module, o un proyecto fuera de este repo, lo importa como dependencia
      normal. Mejor si el consumo es principalmente código (ai-router,
      mcp-bridge, scaffold).

  (b) SuitOSCore como su propio servidor MCP
      — expone dispatcher/loader/registry como tools MCP (p.ej.
      `suitos.route(intent)`, `suitos.load(strategy, project)`,
      `suitos.scaffold(moduleName)`) que CUALQUIER agente Claude Code en
      CUALQUIER carpeta puede invocar agregando una entrada a su propio
      `.mcp.json` apuntando a este servidor. Mejor si el consumo es
      principalmente orquestación/decisión, no solo utilidades de código.

Sea cual sea el camino, el resultado final debe cumplir: un proyecto NUEVO,
en una carpeta fuera de SUITORGSTORE01, puede obtener scaffold de módulo,
routing de IA con fallback, y los agentes reportero/probador SIN copiar
ningún archivo de este repo a mano.

FASES DE TRABAJO
1. Preparar estructura vacía de SuitOSCore/ según el árbol de arriba.
2. Migrar candidato por candidato (Alto primero), limpiando nombres/tablas/
   claves de negocio a medida que copias — no copies y luego limpies, hazlo
   en el mismo paso para no dejar una ventana con secretos/nombres de
   negocio filtrados en el Core.
3. Implementar el mecanismo de "llamable desde otros sistemas" elegido
   arriba.
4. Escribir un README.md dentro de SuitOSCore/ (audiencia: un equipo que
   nunca vio SUITORGSTORE01) explicando cómo consumir cada pieza.
5. Crear al menos UN proyecto de prueba fuera de SUITORGSTORE01 (puede ser
   una carpeta temporal) que consuma SuitOSCore/ end-to-end: generar un
   módulo con el scaffold, hacer una llamada de routing de IA con fallback
   simulado, y correr probador.js contra un endpoint dummy. Esto es la
   prueba de que "portable" es real y no solo aspiracional.
6. Ejecutar reportero.js sobre el propio código nuevo de SuitOSCore/ antes
   de darlo por terminado (dogfooding — si el reportero no se sobrevive a
   sí mismo, no está listo).

CRITERIOS DE ACEPTACIÓN
- [ ] Ningún archivo bajo SuitOSCore/ contiene un id_empresa, nombre de
      tabla, folio (LEAD-/ORD-/COT-), token, URL o credencial específica de
      SuitOrg.
- [ ] El scaffold generado por create-suit-module NO expone service_role
      key al cliente y SÍ incluye un punto de enganche de auth middleware
      (aunque sea un stub que falle explícito si no se configura).
- [ ] Existe un README que un tercero externo a este repo podría seguir sin
      contexto adicional.
- [ ] El proyecto de prueba del paso 5 corrió sin tocar ni un archivo
      dentro de SUITORGSTORE01/ (fuera de SuitOSCore/).
- [ ] reportero.js corrió sobre SuitOSCore/ y no hay hallazgos de severidad
      "error" sin resolver.

Antes de escribir el primer archivo, dame tu elección entre (a) y (b) del
mecanismo de portabilidad con tu justificación en 3-4 líneas, y espera mi
confirmación antes de continuar con la construcción completa.
```
