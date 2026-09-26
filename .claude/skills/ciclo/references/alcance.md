# Alcance: proyecto raíz y subproyectos

El repo contiene subcarpetas que pueden ser proyectos completos o subproyectos. El ciclo se ejecuta **en el alcance donde se invoca**, no siempre en la raíz.

## Resolver el alcance (siempre primero)
1. Si el usuario nombra una carpeta (`/ciclo apps/portal ...`), ese es el alcance.
2. Si no, usa el directorio de trabajo actual.
3. Sube por los directorios padres hasta la raíz del repo y toma el **primer** directorio que contenga contrato (`CONTRATO.md`, `CONTRATOPRP.MD` o `PRM.md`). Ese directorio es el alcance.
4. Si ninguno tiene contrato, el alcance es el directorio actual y hay que crear su contrato (ver abajo).

Declara en una línea: `Alcance: <ruta> · Contrato: <archivo o NUEVO>`.

## Archivos por alcance
`CONTRATO.md`, `VALIDACION.md`, `CORRECCIONES.md` y `PLAN-SYNC.md` viven **dentro del alcance**, no en la raíz. Nunca escribas los de un subproyecto en la raíz ni mezcles correcciones entre subproyectos.

El contrato de la raíz, si existe, aplica como marco general: el del subproyecto manda en conflicto, y solo para lo que contradice explícitamente. Cítalos por ruta para no confundirlos.

## Límites
- Modifica código solo dentro del alcance. Si un cambio exige tocar otro subproyecto o la raíz, detente, dilo y pide permiso; luego ejecuta un ciclo aparte en ese alcance.
- Un commit por fase y por alcance: incluye la ruta en el mensaje (`ciclo(f2/implementacion)[apps/portal]: ...`).
- La sincronización de datos se decide una sola vez y por empresa, incluso si varios subproyectos comparten `Config_Empresas`: indica en `PLAN-SYNC.md` qué alcance origina el cambio.

## Si no hay contrato: crearlo antes de la fase 1
1. Lee lo necesario del alcance para describirlo con hechos, no suposiciones: `README*`, `package.json` (scripts y dependencias), estructura de carpetas, archivos de configuración y entorno (nombres de variables, nunca valores), esquema o migraciones, y cómo consume `Config_Empresas` / `db_engine`.
2. Lee el contrato de la raíz si existe, y `CORRECCIONES.md` de alcances hermanos si aportan reglas.
3. Escribe `CONTRATO.md` en el alcance copiando `templates/CONTRATO.md` y rellenándolo. Marca como `POR CONFIRMAR` todo lo que no pudiste verificar en el código.
4. Muestra al usuario un resumen y la lista de `POR CONFIRMAR`; pide corrección antes de seguir.
5. Haz commit del contrato como fase 0 y continúa el ciclo.

Nunca inventes reglas de negocio para llenar el contrato: si no está en el código ni lo dijo el usuario, va como `POR CONFIRMAR`.
