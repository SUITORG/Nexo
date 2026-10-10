---
name: parametros
description: "Parametriza el sistema con switches declarativos — cambia comportamiento global o puntual SIN tocar código. Fuente única: `.suit/config/switches.yaml` (cada switch: valor, tipo bool|modo|valor, alcance global|<proyecto>, defecto, efecto; precedencia proyecto > global). Recomienda además QUÉ parametrizar al arrancar un módulo nuevo (constantes, rangos min/max, rutas, formatos fecha/hora, banderas, montos…) en config de texto sin BD — sección 'Recomendación de arranque'. Úsala SIEMPRE que el usuario diga 'parametriza', 'cambia el switch', 'pon modo automático/preguntar', 'libertad de decisión', 'configura el sistema', 'qué parametrizar', 'parametrización de arranque', 'config del módulo', o que el agente necesite leer decisiones globales antes de actuar (lo hace `descubrimiento` al arrancar). Nunca guardes secretos aquí."
---

# Parametros — switches del sistema

**Fuente única:** `.suit/config/switches.yaml`

## Esquema (por switch)

```yaml
<nombre>:
  valor: <actual>          # bool | modo | valor
  tipo: bool | modo | valor
  alcance: global | <proyecto>
  defecto: <valor original>
  efecto: "<qué cambia en el comportamiento de los agentes>"
  valores: [...]            # solo tipo modo — lista permitida
```

## Lectura

- Antes de decidir sobre comportamiento configurable, lee el archivo (la skill `descubrimiento` lo hace en su fase 0).
- Precedencia: una entrada con `alcance: <proyecto>` pisa a la `global` para ese proyecto.

## Escritura (cómo se cambia un switch)

1. Edita **solo `valor`**; actualiza `efecto` si cambió el significado.
2. Valida: tipo correcto y valor dentro de lo permitido (`true/false` en bool; la lista `valores` en modo). Valor desconocido → **no escribas**, avisa.
3. Cambio puntual: duplica la entrada con `alcance: <proyecto>` — **nunca** cambies el global por un caso local.
4. Cambio destructivo o de alcance ambiguo → confirma con el usuario primero.
5. **Regla: cambiar switch ≠ editar código.** Si el comportamiento no es configurable desde el YAML, es un gap → `GuiaTotal/PENDIENTES.md`.
6. Nunca guardes secretos ni credenciales aquí (van a `.env`, ignorado por git).

## Switches actuales

| Switch | Defecto | Efecto |
|---|---|---|
| `decision_libre` | `true` | true = el agente no pregunta y documenta supuestos · false = máximo 3 preguntas antes de ejecutar |
| `nivel_preguntas` | `lote` | lote = agrupa preguntas en una tanda · minimo = solo lo imprescindible |
| `modo_descubrimiento` | `completo` | completo = 5 fases de `descubrimiento` · rapido = fases 1 + 5 para cambios pequeños |

## Recomendación de arranque (qué parametrizar)

**Cuándo:** al crear un módulo/función nuevo · fase 1 de `descubrimiento` (cap. 1 Configuración) · si alguien pregunta "¿qué va en config?".

**Taxonomía de candidatos:**

| Tipo | Ejemplos |
|---|---|
| constante | nombre, texto, prefijo-ID (`ORD-`, `CLI-`) |
| rango | `min`/`max` de campos, topes, límites |
| ruta | URLs, endpoints, directorios |
| formato | fecha (`YYYY-MM-DD`), hora (`HH:mm`), TZ, moneda, locale |
| bandera | bool on/off (feature flags) |
| modo | lista permitida de valores |
| monto/porcentaje | tarifas, comisiones, topes |
| numero | timeouts (s), reintentos, puertos |
| plantilla | mensajes, asuntos, plantillas de texto |

**Criterio 20/80 — parametrizar SOLO si se cumple al menos una:**
(a) cambia por entorno o equipo · (b) lo ajusta alguien sin programar · (c) se tunea en pruebas.
Si no cumple ninguna → se queda en código. Sobre-parametrizar es peor que hardcodear.

**Dónde vive cada uno:**
- Comportamiento de agentes → `.suit/config/switches.yaml` (sección anterior)
- Parámetros de módulo nuevo (sin BD) → `<modulo>/config.yaml`; si son 5-10 valores simples → `clave=valor` (prioriza formatos simples, ver `descubrimiento` cap. 1)
- Secretos → `.env` — nunca en config de texto commiteado

**Esquema por entrada (config de módulo):**

```yaml
<clave>:
  valor: <actual>
  defecto: <valor original>
  tipo: constante | rango | ruta | formato | bandera | modo | monto | numero | texto
  efecto: "<qué cambia si cambia este valor>"
  min: <solo tipo rango|numero>
  max: <solo tipo rango|numero>
  formato: <solo tipo formato: "YYYY-MM-DD" | "HH:mm" | "MXN" ...>
  permitidos: [...]        # solo tipo modo
```

**Validación:**
- Candidato detectado en código y NO configurable → gap → `GuiaTotal/PENDIENTES.md` (mismo trato que la regla de switches)
- Nombres en `snake_case`; mantener `defecto` actualizado al editar `valor`
- Nunca secretos en el config del módulo (van a `.env`)
