# MANUAL PROVEEDOR - SuitCVLO-open

> **Para qué sirve este manual:** enseña al operador (quien presta la auditoría) a usar la
> pantalla: preparar las rutas, correr lotes, revisar el avance, rehacer fotos incompletas
> y entregar el resultado.
> **Audiencia:** operador de la herramienta — conocimientos básicos de navegador.
> **Versión:** 1.0 · **Última actualización:** 2026-10-03 · **Plataforma:** SuitCVLO-open (local, puerto 3015)

---

## Para qué sirve este manual (detalle)

Es el uso diario del frontend: qué pulsar y en qué orden. No cubre cómo leer el
entregable (va en `MANUAL_CLIENTE.md`) ni variables de entorno, respaldos o cadena de IA
(van en `MANUAL_TECNICO.md`).

## 1. Bienvenida

- Abres la app y en **minutos** tienes las fotos de la quincena ordenadas + `info.txt` + índice.
- **Auto (cadena)**: si un proveedor de IA falla, prueba el siguiente sin cortar la corrida.
- **Nunca borra archivos**: todo lo que produce es aditivo (carpetas, `info.txt`, xlsx).
- Con **Modo Local** no se descarga nada (si Drive está sincronizado en el equipo).

## 2. Acceso al portal

1. Doble clic en **`iniciar.bat`** (busca Python 3 e instala dependencias si faltan).
2. Se abre `http://127.0.0.1:3015`. Sin login ni contraseña.
3. Si no arranca: ver §8 (puerto ocupado / Python ausente).

## 3. Panel principal

| Zona | Qué hace |
|---|---|
| **5 rutas** (fotos, salida, pines, KML, índice) | de dónde salen las fotos y a dónde va el entregable |
| **Switch `Cargar rutas de CVLOCFG.txt`** | al abrir, precarga las 5 rutas y pone el modo `Local (ruta)` |
| **Fuente** | `Web/Drive` (URL o `GooDrPics.txt`), `Local` (ruta), `ZIP` o **carpeta** (subir) |
| **N Fotos** | máximo de **candidatas** a leer (foto con GPS dentro del radio de un PIN) |
| **Motor IA** | `auto (cadena)` (recomendado) o forzar `opencode / ollama / deepseek / …` |
| **Opciones avanzadas** | radio (250 m), tope por PIN (10), pausa (1 s), **Descargas máximas (300)**, switch **COMENTARIO**, **Prioridad de la fuente** (`KML primero` / `Mapa de pines`) |
| **`Ver info de las fuentes`** | panel de avance y aportes **sin correr nada** |
| **`Reprocesar incompletas`** | respaldo + releer solo lo incompleto (§5) |
| **`Reescribir info.txt y Marca`** | regenera **todos** los `info.txt` **y rellena la columna `Marca`** del índice con las lecturas guardadas y la prioridad elegida, **sin IA y sin borrar nada** (§5.1) |
| **Archivo de configuración (CVLOCFG.txt)** | pega la ruta de otro `CVLOCFG.txt` y pulsa **`Usar esta ruta`** (o Enter): rellena las rutas, la prioridad y las marcas de ese archivo (§7) |
| **`Iniciar corrida` / `Detener`** | arrancar / parar |
| **Barra + 2 líneas + log** | progreso, estadísticas y detalle |

## 4. Gestionar una corrida (paso a paso)

1. **Elige fuente.** Con Drive sincronizado en Windows → **`Local`** (cero descargas, GPS al instante).
   En **`Web`** hay que bajar cada foto para leer el GPS: usa el tope **Descargas máximas**.
2. Revisa **`Ver info de las fuentes`**: verás `AVANCE 12% · 210 de 1696 fotos`, cuántas fotos
   traen GPS, cuántos PINs cruzan y qué aporta cada fuente. El panel se queda abierto hasta
   que lo cierres o cambies una ruta.
3. Pon **N Fotos** (empezar con 10-20 la primera vez) y deja **auto (cadena)**.
4. Pulsa **`Iniciar corrida`**. Sigue la barra, la línea de estadísticas y el log.
5. Al terminar verás el resumen: **leídas / copiadas / excedidas / PINs / grupos**.
6. Entrega: carpeta de quincena + `info.txt` + `idxfotos.xlsx` (ver `MANUAL_CLIENTE.md`).

**No repite trabajo**: excluye lo ya cargado en la salida, lo ya leído y lo ya `Verificado ✓`.

## 5. Reprocesar fotos incompletas

Botón **`Reprocesar incompletas`** (cuando cambiaste el prompt/switch, o hay `no disponible`):

1. **Preview** (solo lectura): te dice cuántas fotos no tienen lectura o la tienen en
   **formato antiguo**, y cuántas **no tienen origen** en la ruta (esas no se tocan).
2. Al confirmar: crea **`idxfotos_backup_<fecha>.xlsx`** y limpia **solo** la columna
   `Verificado` de **esas** filas.
3. Arranca sola con `reproceso=1` → se releen con el prompt actual y el `info.txt` queda completo.

**No mueve ni borra nada**, y las filas se actualizan **en sitio** → **nunca se duplican**.
Necesita **Modo Local (ruta)**.

### 5.1 Reescribir `info.txt` y `Marca` (sin IA)

Botón **`Reescribir info.txt y Marca`**: regenera el `info.txt` de **todas** las carpetas de salida
y rellena la columna **`Marca`** del `idxfotos.xlsx` con las lecturas que ya existen en
`trabajo\reads` y con la **Prioridad de la fuente** elegida. Úsalo cuando cambies la prioridad
(o quieras rellenar la `Marca` de las filas viejas) **sin gastar tokens**: no lee fotos, no copia
ni borra archivos. Te devuelve `N info.txt` y `N marcas` reescritos.

- **Antes** (prioridad pines): `PROVEEDOR: Little Caesars` y `LATITUD: 25.659644…` (EXIF de la foto)
- **Después** (prioridad kml): `PROVEEDOR: Little Caesars *` y `LATITUD: 25.660370` (del KML)

> **Prioridad de la fuente**: `KML primero` (defecto) hace que el PIN, las coordenadas, la
> dirección y la marca salgan del **KML** (si el KML no lo trae, del mapa de pines). Lo que no
> viene del KML se marca con ` *`. `Mapa de pines` = comportamiento antiguo.

## 6. Evidencias y confirmaciones (si aplica)

- Toda evidencia es la **foto original**: se **copia** a la carpeta del PIN (nunca se mueve).
- La **confirmación** es la columna `Verificado = ✓` en `idxfotos.xlsx`.
- Las fotos **sin GPS** quedan con `Verificado = No GPS` y no se vuelven a evaluar
  (queda registrada igual: son fotos existentes sin coordenadas).

## 7. Perfil y configuración

- **`CVLOCFG.txt`** (misma carpeta del proyecto): rutas `fotos / salida / pines / kml / idx`,
  formato `clave: valor`, `#` = comentario. Está en `.gitignore` (es de cada equipo);
  plantilla en `CVLOCFG.example.txt`.
- **Otro archivo de configuración**: en el campo **`Archivo de configuración (CVLOCFG.txt)`**
  pegas la ruta y pulsas **`Usar esta ruta`**. Se recuerda en el navegador y la usan la corrida y
  el botón de reescritura (vacío = el `CVLOCFG.txt` de la carpeta del proyecto).
- La **env `CVLO_CFG`** cambia la ubicación de ese archivo.
- Cambios de IA (`CVLO_VLM`, keys) → ver `MANUAL_TECNICO.md`; **no exigen reiniciar**
  (el `.env` se relee al cambiar).

## 8. Problemas frecuentes

| Problema | Causa probable | Qué hacer |
|---|---|---|
| El navegador no abre / "puerto en uso" | otro proceso en 3015 | cerrar la pestaña vieja y volver a pulsar en `iniciar.bat`; si insiste, terminar el proceso que escucha 3015 |
| "Falta la Ruta de Salida." | no llenaste la salida | completar los 5 campos (o encender `CVLOCFG.txt`) |
| "Motor IA desconocido" | valor inválido | elegir `auto (cadena)` |
| En Modo Web tarda muchísimo | baja cada foto para leer el GPS | usar **Modo Local** (carpeta sincronizada) o bajar **Descargas máximas** |
| "Tope de N descargas alcanzado" | límite de descargas alcanzado | subirlo en *Opciones avanzadas* o pasar a Modo Local |
| Log: `Sin proveedor IA disponible → opencode: … \| ollama: …` | todos los eslabones fallaron | ver §9 de `MANUAL_TECNICO.md` (keys / Ollama) |
| Fotos "excedidas" | el PIN ya tiene 10 | subir **Tope por PIN** y volver a correr |
| Se cortó sola | circuit breaker (3 fallos → 5 min) | esperar o forzar otro proveedor en **Motor IA** |
| Un PIN no aparece | capa COMPETENCIA sin `LATITUD` en el KML | limitación conocida (§7 de `docs/DECISIONES-TECNOLOGICAS-OOH.md`) |

## 9. Diagrama de flujo

```text
[Operador] → [rutas + fuente] → [Ver info] → [Iniciar corrida]
           → [barra + log] → [resumen: leídas/copiadas]
           → [carpeta de quincena + info.txt + idxfotos.xlsx] → [entrega]
                          ↘ [Reprocesar incompletas] → [respaldo] → [releer] → [entrega]
```

## Datos pendientes de validar

- [ ] Lote piloto con `N Fotos` grande en Modo Local y medir tiempo por foto.
- [ ] Confirmar si el operador debe recibir alerta cuando el circuito breaker se activa (hoy solo va al log).
- [ ] Acordar el tope de descargas por corrida en Modo Web (hoy: 300).
