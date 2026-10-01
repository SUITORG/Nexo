# AGENTS.md — SuitCVLO-open

Auditoría de publicidad exterior (OOH) con motor de lectura IA intercambiable.
Contrato: `docs/CONTRATO.md` · ADR: `.suit/memory/decisions/ADR-037-suitcvlo-open.md`

## Alcance
- Origen: fork de `\cvlo-auditor\` — **carpeta de SOLO LECTURA, jamás escribir ahí**.
- Fuera de alcance: `SuitCVLO/` (proyecto YOLO), `server.js` raíz, `backend/`, `.github/workflows/`.
- No consume `Config_Empresas` ni Supabase: usuario único, sin `id_empresa`.

## Stack y comandos
```bash
pip install flask openpyxl pillow pillow-heif gdown   # dependencias
python app.py                                          # servidor → http://127.0.0.1:3015
python -m unittest discover -s tests -t . -v           # pruebas (modo MOCK con CVLO_MOCK=1)
```
No hay lint ni typecheck: validar con `python -m py_compile <archivo>` tras cada edición.

## Invariantes
1. **Nunca se elimina ningún archivo** de datos del usuario; los temporales van a `trabajo\`.
2. Sin base de datos: todo en archivos locales (`idxfotos.xlsx`, `info.txt`, JSON de reads).
3. **Sin secretos en el código** — todo por `.env` (ver `.env.example`).
4. El switch **nunca corta la corrida**: baja por la cadena y anota el motivo en el log.
5. Cadena inmutable: `ollama → openrouter → gemini → autoclaw` (cambiarla = nuevo ADR).

## El switch (`ia/switch.py`)
| Función | Qué hace |
|---|---|
| `modelos()` | inventario; Ollama con sufijo `(local)`, flag `vision` |
| `leer(ruta, prompt, proveedor, modelo, log)` | cascade + circuit breaker (3 fallos → 5 min) |
| `estado()` | disponibilidad de los 4 eslabones |
| `_elegir(prov, modelo)` | modelo pedido → `CVLO_VLM` → el más liviano con visión |

Endpoints: `GET /api/ia/modelos`, `GET /api/ia/estado`, `GET /api/estado`.

## Puerto
| Puerto | Servicio |
|---|---|
| 3015 | Flask (SuitCVLO-open) |
