# MANUAL TÉCNICO - SuitCVLO-open

> **Para qué sirve este manual:** documenta el sistema para quien lo mantiene y configura:
> arquitectura, ejecución, variables de entorno, datos en disco, respaldos, logs y fallos.
> **Audiencia:** desarrollador o administrador técnico.
> **Versión:** 1.0 · **Última actualización:** 2026-10-03 · **Stack:** Python 3 + Flask + openpyxl/Pillow · **Puerto(s):** 3015

---

## Para qué sirve este manual (detalle)

Mantenimiento y configuración. No cubre uso de la interfaz (`MANUAL_CLIENTE.md` /
`MANUAL_PROVEEDOR.md`) ni solo pruebas (`MANUAL_PRUEBAS.md`).
Fuentes de verdad del proyecto: `AGENTS.md` · `docs/CONTRATO.md` · `docs/VALIDACION.md` ·
`readme.md` · ADR-037/038/039/041.

## 1. Arquitectura general

```text
[frontend estático plantillas/ + static/] ── fetch ──▶ [Flask app.py :3015]
                                                          │
                        proceso.py (corrida, hebras, progreso, info.txt)
                              │                    │
                        motor.py (GPS/EXIF, pines, KML, xlsx idx)
                              │
                        utilidades.py (rutas, CVLOCFG, saneo)
                              │
                        ia/switch.py (cascada de proveedores + circuit breaker)
                              │
              ┌───────────────┼───────────────────────────────┐
        opencode (nube)  ollama (local)  deepseek / openrouter / gemini (nube)
```

- **Un solo proceso** (`python app.py`), hebras por foto para lectura paralela (3 por defecto).
- **Sin base de datos**: todo vive en archivos (`idxfotos.xlsx`, `info.txt`, `trabajo\*.json`).
- **Multi-proveedor por `.env`**, no por schema ni columnas nuevas.
- **Usuario único, sin `id_empresa`** (no consume `Config_Empresas` ni Supabase — decisión explícita).

## 2. Stack y ejecución

- Runtime / lenguaje: **Python 3** + **Flask**.
- Comandos:
  - instalar: `pip install flask openpyxl pillow pillow-heif gdown`
  - desarrollo: `python app.py` → `http://127.0.0.1:3015` (o doble clic en `iniciar.bat`, que
    instala dependencias si faltan)
  - build: **no aplica** (sin build ni empaquetado)
  - pruebas: `python -m unittest discover -s tests -t . -v` (ver `MANUAL_PRUEBAS.md`)
- Puerto: **3015** (override: `CVLO_PUERTO`).
- Sin lint ni typecheck: validar con `python -W error::SyntaxWarning -m py_compile <archivo>`
  tras cada edición; en JS, `node --check static/app.js`.

## 3. Variables de entorno

| Variable | Para qué sirve | Obligatoria |
|---|---|---|
| `OPENCODE_API_KEY` | key de OpenCode (1er eslabón); **si falta se lee de** `~/.local/share/opencode/auth.json` | no |
| `OPENCODE_BASE_URL` | endpoint (`https://opencode.ai/zen/go/v1` = suscripción) | no |
| `OPENCODE_VISION_MODEL` | modelo con visión (default `deepseek-v4-flash-vision-exp`) | no |
| `OLLAMA_URL` | Ollama local (default `http://127.0.0.1:11434`) | no |
| `CVLO_VLM` | modelo local con visión (default = el más liviano con visión) | no |
| `OLLAMA_TIMEOUT_S` | segundos máximos por foto en CPU (default 900) | no |
| `DEEPSEEK_API_KEY` | eslabón DeepSeek | no |
| `DEEPSEEK_VISION_MODEL` | default `deepseek-flash` | no |
| `HF_TOKEN` | HuggingFace — **DESACTIVADO** desde 2026-10-02 (línea comentada) | no |
| `OPENROUTER_API_KEY` | OpenRouter — **DESACTIVADO** desde 2026-10-02 (key daba 401) | no |
| `GEMINI_API_KEY` | eslabón Gemini (mejor OCR en español) | no |
| `GEMINI_VISION_MODEL` | default `gemini-2.5-flash` | no |
| `CVLO_PUERTO` | puerto del servidor (default 3015) | no |
| `CVLO_CFG` | ruta alternativa de `CVLOCFG.txt` | no |
| `CVLO_MOCK` | modo pruebas (sin internet) | no |

**Prioridad:** el `.env` del proyecto **manda sobre** el entorno; valor vacío = eslabón
desactivado. El `.env` se **relee al cambiar su mtime** (pegar una key no exige reiniciar).
**Nunca** committing secretos: `.env` está en `.gitignore` (plantilla en `.env.example`).

## 4. Base de datos y esquema

- **Motor:** ninguno. Archivos locales:
  - `idxfotos.xlsx` — índice (columnas 1-9 fijas + `FechaHoraFoto`, `FechaHoraSubida` y
    **`Marca` al final**; **no se crean columnas nuevas** ni se tocan las existentes:
    `idx_col_fecha()` y `idx_col_marca()` reutilizan la cabecera que ya exista).
  - `Salida\<AAMMPQ>\auditoria\<Grupo>\<PIN>\*.jpg` + `info.txt` — entregable.
  - `trabajo\` — cache de fotos y `reads\*.json` (lecturas por foto, formato 8 líneas).
  - `GooMapsPines.txt` / `.kml` — pines (286 cruzables de 300 placemarks del KML).
- **Migraciones:** no aplican.
- **Multi-tenant:** no aplica (usuario único). Si algún día aplica → filtrar siempre por `id_empresa`.

## 5. Configuración

- **Sin tenants ni flags** (`usa_*`): no consume `Config_Empresas`.
- **`CVLOCFG.txt`** (5 rutas, `clave: valor`, separa por el **primer** `:` → `C:\...` intacto);
  parser en `utilidades.leer_config_rutas()`; endpoint `GET /api/config`.
  Claves adicionales: **`prioridad: kml|pines`** (qué fuente manda en el cruce y en el `info.txt`;
  defecto `kml`) y **`marcas`** — de dos formas: `marcas: <ruta>` (archivo) o **`marcas:` sin
  valor + las marcas debajo, una por línea** (lista **inline** en el propio CFG; la lista termina
  en una línea en blanco). Sin ninguna → `marcas-conocidas.txt` de esta carpeta.
  Una marca por línea, `#` = comentario; comparación normalizada (sin acentos ni mayúsculas).
  **Sin marcas → sin validación.**
  **`CVLOCFG.txt` no está en el repo** (rutas propias de cada equipo) — plantilla en
  `CVLOCFG.example.txt`.
- **Select `Prioridad de la fuente`** en *Opciones avanzadas*: siembra desde `CVLOCFG.txt` y
  manda por corrida (`params['prioridad']`). Validación: `utilidades.prioridad_valida()`
  (`kml`/`pines`; cualquier otra cosa → `kml`).
- **Cadena de IA** (inmutable sin ADR): `opencode → ollama → huggingface → deepseek → openrouter → gemini`.
  Orden + reglas en `docs/CONTRATO.md`; implementación en `ia/switch.py`.
- **Circuit breaker:** 3 fallos seguidos → 5 min de cooldown por eslabón; el motivo va al log;
  `switch.reset()` al crear una corrida.
- **Prompt de lectura:** 8 líneas (`ANUNCIO, MARCA, CAMPAÑA, QUE ANUNCIA, TEXTO VISIBLE,
  REFERENCIAS UBICACION, TIPO SOPORTE, CARA`) + `FOTO:` de primera línea.
- **Endpoints:** `GET /` · `GET /api/estado` · `GET /api/config` (`?ruta=` = usar otro
  `CVLOCFG.txt`) · `GET /api/ia/modelos` · `GET /api/ia/estado` · `POST /api/corridas` ·
  `GET /api/corridas/<id>` · `POST /api/corridas/<id>/detener` ·
  `GET /api/fuentes` (`campanas[]` = pines/verificadas/auditados por campaña del KML;
  `aviso_mapa` si pines y KML no comparten PINs) · `GET /api/fuentes/gps`
  (`campanas{capa: {dist_prom, n, pendientes}}` — distancia media foto↔pin dentro del radio) ·
  `GET /api/reprocesar/preview` · `POST /api/reprocesar` ·
  `POST /api/reescribir-info` (regenera todos los `info.txt` **y la columna `Marca`** con las
  lecturas guardadas, sin IA; lleva `idx`) · `POST /api/marcas/actualizar` (alimenta la lista de
  marcas con las vistas en `trabajo\reads`; respuesta `{agregadas, total, vistas, archivo, tipo}`).
- Validación de entrada: 400 `"Falta la Ruta de Salida."`, 400 `"Motor IA desconocido: <prov>"`.

## 6. Despliegue

1. No hay CI/CD ni build: corre en la máquina del operador (`iniciar.bat` o `python app.py`).
2. **Validación previa** obligatoria tras cualquier edición:
   `python -W error::SyntaxWarning -m py_compile *.py` + `node --check static/app.js` +
   `python -m unittest discover -s tests -t .` → debe dar **106 tests OK**.
3. Commit formato SuitOS: `ciclo(<tipo>)[SuitCVLO-open]: <desc>` (fases F0-F7).
4. **Prohibido** escribir en `\cvlo-auditor\` (fuente de solo lectura), `SuitCVLO/`,
   `SuitCVLOGCPy/` (ni leer), `server.js` raíz, `backend/`.

## 7. Backups y restauración

1. **Qué se respalda:** `idxfotos.xlsx` (el único archivo con estado del usuario).
2. **Frecuencia:** automática en cada **`Reprocesar incompletas`** →
   `idxfotos_backup_<AAAAMMDD_HHMMSS>.xlsx` junto al original.
3. **Dónde:** misma carpeta que el índice (p. ej. `C:\...\cteCVLO1\`).
4. **Cómo restaurar (probado):** cerrar el servidor, sustituir
   `idxfotos.xlsx` por el respaldo (renombrar), volver a arrancar. La corrida **no** escribe
   sobre un archivo abierto en exclusiva, pero conviene cerrarlo en Excel antes.
   - Las fotos copiadas **no** necesitan respaldo: son copias del original (nunca se mueven).
   - `trabajo\reads\*.json` es regenerable: borrarlo obliga a releer.

## 8. Logs, monitoreo y alertas

- **Log de corrida:** en pantalla (panel derecho) y en `GET /api/corridas/<id>` — por foto y por
  eslabón (`[ia] probando opencode…`, `[ia] opencode respondió (416 caracteres)`).
- **Errores a monitorear:**
  - `Sin proveedor IA disponible → opencode: … | ollama: …` → la cadena entera falló (keys/Ollama).
  - `401 User not found` (OpenRouter), `402 Insufficient Balance` (DeepSeek), `403/1010` (sin
    `User-Agent` en OpenCode), `415` (Content-Type), `404` (modelo ajeno al proveedor).
  - `Tope de N descargas alcanzado` → modo Web con límite agotado.
  - `sin GPS en EXIF` → fotos registradas como `No GPS`.
- **A quién alertar:** al operador en pantalla (el switch **nunca corta** la corrida: baja por la
  cadena y anota el motivo).
- **Sin telemetría** ni envío de datos a terceros salvo la foto al proveedor IA elegido.

## 9. Problemas frecuentes (operación)

| Síntoma | Causa probable | Acción |
|---|---|---|
| No arranca / puerto ocupado | proceso viejo en 3015 | terminar el PID que escucha 3015 y relanzar |
| Todas las fotos marcan `No GPS` | EXIF sin coordenadas o formato no soportado | verificar con `exiftool`/Pillow; HEIC requiere `pillow-heif` |
| 286 PINs cruzan pero el KML trae 300 | capa COMPETENCIA usa `COORDENADAS: lat,lon` | `motor._pines_desde_kml` (~6 líneas); pendiente en `GuiaTotal/PENDIENTES.md` |
| Filas duplicadas en el xlsx | nunca debería ocurrir | `idx_upsert` clave por nombre de foto; investigar si se dio |
| Mojibake en textos | escritura con otro codec | escribir **siempre** UTF-8 (no `Set-Content` de PowerShell por defecto) |
| `.env` no aplica | caché de mtime | el loader lo relee; forzar reinicio solo si el archivo no cambió |
| IA responde pero `COMENTARIO` vacío | switch COMENTARIO apagado | encenderlo en *Opciones avanzadas* (default ON) |

## Datos pendientes de validar

- [ ] **Secretos en `.env.example`**: contiene una `DEEPSEEK_API_KEY` real → vaciarla
      (invariante 5: sin claves en el repo).
- [ ] **`idxfotos.xlsx` con nombres de foto en dos registros** (139 filas `IMG_x.jpg` del pipeline
      antiguo + `img_x.jpg` nuevas): `idx_upsert` compara **exacto** → al re-procesar una foto se
      crea una 2.ª fila en vez de actualizar la vieja. Arreglable con clave en minúsculas + merge
      previo; **no hecho a propósito** (mezcla filas del usuario).
- [ ] 14 PINs de COMPETENCIA sin `LATITUD` (hallazgo §7 de `docs/DECISIONES-TECNOLOGICAS-OOH.md`).
- [ ] `GuiaTotal/PENDIENTES.md`: renovar `OPENROUTER_API_KEY`, saldo de DeepSeek, valor por
      defecto de `CVLO_VLM` (corrida real Ollama vs nube).
- [ ] Definir si conviene respaldo automático del xlsx en cada corrida (hoy: solo en reproceso).
