# MANUAL CLIENTE - SuitCVLO-open

> **Para qué sirve este manual:** enseña al cliente de auditoría (la marca, la agencia o el
> proveedor de vallas que recibe el resultado) a leer y usar el entregable de una corrida:
> la estructura de carpetas, el `info.txt` de cada PIN y el índice `idxfotos.xlsx`.
> **Audiencia:** quien recibe la auditoría — conocimientos básicos de Explorador de archivos y Excel.
> **Versión:** 1.0 · **Última actualización:** 2026-10-03 · **Plataforma:** SuitCVLO-open (local, puerto 3015)

---

## Para qué sirve este manual (detalle)

Una corrida de SuitCVLO-open no "envía reportes": **construye una carpeta de auditoría**
con las fotos ya ordenadas por quincena, proveedor, ciudad y PIN, más un `info.txt` por
PIN y un índice Excel consolidado. Este manual explica qué recibes y cómo leerlo.
No cubre cómo se corre la herramienta (eso es `MANUAL_PROVEEDOR.md`) ni su
configuración técnica (eso es `MANUAL_TECNICO.md`).

## 1. Bienvenida

- **Qué es:** una auditoría de publicidad exterior (OOH) a partir de fotos de recorrido.
- **Para quién:** quien necesita comprobar qué anuncios están instalados, en qué PIN y con
  qué contenido.
- **Qué ganas:**
  - Fotos **ya ordenadas** en carpetas por quincena → proveedor → ciudad → PIN.
  - Un **`info.txt` por PIN** con la descripción de cada foto hecha por IA.
  - Un **índice Excel** (`idxfotos.xlsx`) con todo el inventario, listo para filtrar.
- **Qué NO hace:** no borra ni mueve tus fotos originales (siempre se copian).

## 2. Pantalla de inicio

Al entrar (doble clic en `iniciar.bat` → `http://127.0.0.1:3015`) ves:

- Los **5 campos de rutas** (fotos, salida, pines, KML, índice) — normalmente vienen
  precargados por `CVLOCFG.txt`.
- **N Fotos** (cuántas analizar), el **Motor IA** (mejor dejar "auto (cadena)") y los
  botones **`Iniciar corrida`**, **`Detener`**, **`Ver info de las fuentes`** y
  **`Reprocesar incompletas`**.
- Una **barra de progreso** con dos líneas de estadísticas debajo.

Si eres solo receptor del entregable, **no necesitas usar esta pantalla**: pasa al §4.

## 3. Registro e inicio de sesión

No aplica — es una aplicación **local de usuario único**, sin cuentas ni contraseñas.

## 4. Flujo principal (qué pasó con tus fotos)

```text
fotos del recorrido → GPS de cada foto → cruce con los PINs del mapa
   → lectura IA (qué anuncia) → copia a la carpeta de auditoría
   → info.txt del PIN → fila en idxfotos.xlsx (Verificado ✓)
```

1. Cada foto se **copia** (jamás se mueve) a
   `Salida\<AAMMPQ>\auditoria\<Proveedor><TipoAnuncio><Ciudad>\<PIN>\`
   donde `AAMMPQ` es la quincena de la foto: días 1-15 → `01`, 16-31 → `02`.
2. El **`info.txt`** de esa carpeta se reescribe con un bloque por foto.
3. El **`idxfotos.xlsx`** recibe una fila nueva (o se actualiza la existente).

**Estados que verás en el índice (columna `Verificado`):**

| Valor | Significado |
|---|---|
| `✓` | Foto procesada y copiada |
| en blanco + nota "excede el tope" | El PIN ya tiene 10 fotos (tope por PIN) |
| `No GPS` | La foto no traía coordenadas → queda registrada y no se vuelve a evaluar |
| en blanco | Pendiente / en proceso |

## 5. Leer el `info.txt` de un PIN

Cada carpeta de PIN tiene un archivo `info.txt` con cabecera y un bloque por foto:

```text
GRUPO: DIDI PARABUSES MTY
PIN: DF_09_LOANS_394
COORDENADAS: 25.717, -100.346
----------------------------------------
FOTO: img_0001.jpg
CAMPAÑA: Aquí sí encuentras todo / Tu lista está lista     ← el eslogan de la campaña
COMENTARIO: Promociona una cadena de supermercados, destacando su variedad…
PROVEEDOR: Del Sol                                          ← la marca / anunciante
PLAZA: MTY · MEDIO: PARABUS · FORMATO: FIJO · ID: 31130
UBICACIÓN: NUEVO MEXICO - FIDEL VELAZQUEZ
LATITUD: 25.7173 · LONGITUD: -100.3461
```

- **`PROVEEDOR`** = quién anuncia (marca). **`CAMPAÑA`** = el eslogan. Son campos distintos.
- **`COMENTARIO`** = qué promociona / el texto que se ve. Si no hay lectura guardada,
  dice `no disponible`.
- **El `*` al final de `PROVEEDOR`** significa que **ese dato no viene del KML** (lo aportó la
  foto o la regla del PIN). Sin `*` = confirmado por el KML.
- El bloque de datos del soporte (`GRUPO`, `PIN`, `COORDENADAS`, `MEDIO`, `FORMATO`, `ID`,
  `UBICACIÓN`, `LATITUD`, `LONGITUD`) sale **del KML** (o del mapa de pines si el KML no lo trae);
  `FOTO`, `CAMPAÑA` y `COMENTARIO` salen de la foto.

## 6. Usar el índice `idxfotos.xlsx`

Columnas: `NombreFoto · Descripción de lo que anuncia · Dirección · Tipo de Anuncio ·
Latitud · Longitud · Referencias visuales o notas · Verificado · PIN · … · FechaHoraSubida ·
Marca`.

- **`Marca`** (la última columna): la marca que encontró el sistema para esa foto — sirve para
  filtrar sin tener que leer el texto. Un valor **vacío** = esa fila no tiene lectura guardada.

- **Filtra por `PIN`** para ver todo lo de un soporte.
- **Filtra por `Verificado` = `✓`** para el avance real.
- Se **crea si no existe** y nunca repite lo ya verificado → es seguro reabrirlo.

> El archivo puede traer columnas tuyas (p. ej. `FechaHoraFoto`): **no se tocan**.

## 7. Problemas frecuentes

| Problema | Causa probable | Qué hacer |
|---|---|---|
| No encuentro una foto en la salida | No tenía GPS o quedó fuera del radio (250 m) del PIN | Revisar la fila en el índice: si dice `No GPS`, así queda |
| Un PIN tiene solo 9 fotos y la 10. aparece "excede el tope" | Tope de 10 fotos por PIN (configurable por el operador) | Pedir subir el tope y volver a correr ese PIN |
| `COMENTARIO: no disponible` | Esa foto nunca se leyó (o se leyó con el switch apagado) | Pedir **`Reprocesar incompletas`** al operador |
| `PROVEEDOR` y `CAMPAÑA` dicen lo mismo | Lectura en formato antiguo (marcada como "formato viejo") | Ídem: reproceso de incompletas |
| `PROVEEDOR` no es la marca esperada (sale `DIDI`) | El KML no trae `MARCA` para ese PIN y la foto tampoco se pudo leer | Pedir reproceso; ver `marcas-conocidas.txt` en `MANUAL_TECNICO.md` |
| La carpeta de quincena no es la que esperabas | La quincena sale de la **fecha de la foto** | Verificar la fecha EXIF de la foto |
| Aparecen 14 PINs "sin cruzar" | Capa COMPETENCIA sin `LATITUD` en el KML | Limitación conocida (`docs/DECISIONES-TECNOLOGICAS-OOH.md` §7) |

## 8. Diagrama de flujo

```text
[Cliente] → [entregable] → [carpeta de quincena] → [PIN]
          → [info.txt: FOTO + CAMPAÑA + COMENTARIO + PROVEEDOR]
          → [idxfotos.xlsx filtrado por PIN / Verificado]
```

## Datos pendientes de validar

- [ ] Confirmar con el cliente si quiere el entregable **por quincena** o **consolidado por PIN**.
- [ ] Definir si el `COMENTARIO` debe llevar texto completo o solo resumen (switch del operador).
- [ ] Acordar el tope de fotos por PIN (hoy: 10).
