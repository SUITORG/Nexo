# SuitPoke — Duelo de Cartas

> Juego de cartas PvP online en el navegador: **2-4 jugadores**, salas por código de invitación, oponentes IA, sonido y **PWA instalable en el celular**. Partidas de 2-5 minutos.

**Última actualización:** 2026-09-29 · **Puerto:** 3014 · **Versión:** 1.0.0

---

## Qué es

SuitPoke es un *battler* de cartas por turnos: cada jugador empieza con **15 de vida** y roba/cartas para arrojarlas contra sus rivales. Emula mecánicas de TCG (elementos, guardias, habilidades), **no copia Pokémon** — nombres, arte y textos son 100% originales (condición del panel juzgador).

Dos formas de jugar:

| Modo | Requiere | Descripción |
|---|---|---|
| **vs IA local** | Nada (offline) | Tú contra 1-3 bots, todo corre en el navegador |
| **Sala online** | Servidor corriendo | Creas sala → compartes código de 4 letras o enlace → 2-4 jugadores en tiempo real |

## Features

- **🌐 Online por código** — salas con código de 4 letras + enlace `?sala=XXXX`, tiempo real vía SSE, hasta 4 jugadores.
- **🤖 vs IA local** — 1, 2 o 3 bots, funciona sin internet (service worker cachea el shell).
- **📱 PWA móvil** — manifest + service worker: se instala como app en Android/iOS, orientación vertical, iconos 192/512.
- **🔊 Sonido** — 12 efectos sintetizados con WebAudio (sin archivos de audio), con botón on/off persistente.
- **Estado autoritativo en servidor** — el cliente nunca calcula resultados oficiales (el servidor ejecuta el motor).
- **Cero dependencias** — Node stdlib + vanilla JS/HTML/CSS. Sin frameworks, sin npm installs.

## Requisitos

- **Node.js ≥ 18** (solo módulos nativos: `http`, `fs`, `path`, `url`)
- **Cero dependencias npm** — `npm install` no hace falta (no hay `dependencies`)
- Navegador moderno (Chrome/Edge/Safari/Firefox)

## Cómo correr

```bash
node SuitPoke/server.js
```

→ abre **http://localhost:3014**

Variables de entorno: `PORT` (opcional, default `3014`).

También desde la carpeta:

```bash
cd SuitPoke
npm start        # node server.js
```

## Cómo probar

```bash
node SuitPoke/test/motor.test.js
```

Salida esperada:

```
OK motor: 4 suites, 50 partidas IA vs IA terminaron con ganador
```

Las 4 suites verifican: anillo de ventajas, daño directo tope 7, escudo +4 de defensa, y 50 partidas IA vs IA completas que terminan siempre con exactamente 1 ganador.

Validación completa del ciclo: ver `VALIDACION.md` (8 checks V1-V8, todos PASA).

## Estructura de carpetas

```
SuitPoke/
├── index.html              # SPA: menú, lobby, partida, fin, reglas
├── server.js               # Servidor Node stdlib: estático + API JSON + SSE (puerto 3014)
├── sw.js                   # Service worker: cachea el shell (offline modo local/IA)
├── manifest.webmanifest    # PWA: nombre, iconos, standalone, portrait, lang es
├── package.json            # scripts: start / test / iconos (sin dependencias)
├── css/estilo.css          # Estilos (tema oscuro #12102a)
├── js/
│   ├── motor.js            # MOTOR compartido servidor/cliente: cartas, reglas, IA, vista
│   ├── juego.js            # Cliente: render, interacción, modos local/online, PWA
│   ├── red.js              # Cliente de red: fetch a /api/* + EventSource SSE
│   └── sonido.js           # Efectos WebAudio (click, hit, crítico, ganar…)
├── scripts/gen-iconos.js   # Genera icon-192.png / icon-512.png
├── test/motor.test.js      # Autocheck del motor (assert puro, sin framework)
├── docs/
│   ├── CONTRATO.md         # Alcance e invariantes del subproyecto
│   ├── GUIA_JUEGO.md       # Guía completa para jugadores
│   ├── MANUAL_CLIENTE.md   # Manual jugador/huésped
│   ├── MANUAL_PROVEEDOR.md # Manual anfitrión/operador de sala
│   ├── MANUAL_TECNICO.md   # Manual del mantenedor
│   ├── MANUAL_PRUEBAS.md   # Manual QA
│   ├── PROMPT_ORIGEN.md    # Origen e historia del proyecto
│   ├── CHECKLIST-LANZAMIENTO.md
│   └── TAXONOMIA.md        # Clasificación GuiaTotal
├── README.md               # Este archivo
├── VALIDACION.md           # Evidencia de validación del ciclo
├── CORRECCIONES.md         # Errores y aprendizajes del ciclo
└── Analista_Proy.md        # Análisis de viabilidad de mercado
```

## Puerto

| Puerto | Servicio |
|---|---|
| **3014** | SuitPoke (`server.js`, configurable con `PORT`) |

## Documentación

| Archivo | Para qué |
|---|---|
| `docs/GUIA_JUEGO.md` | Reglas, catálogo de 30 cartas, consejos |
| `docs/MANUAL_CLIENTE.md` | Cómo jugar, instalar la PWA, unirse a salas |
| `docs/MANUAL_PROVEEDOR.md` | Operar sala: crear, invitar, bots, iniciar, revancha |
| `docs/MANUAL_TECNICO.md` | Arquitectura, API endpoints, despliegue |
| `docs/MANUAL_PRUEBAS.md` | Test del motor + smoke manual |
| `docs/CONTRATO.md` | Alcance e invariantes |
| `VALIDACION.md` | Evidencia ejecutada (V1-V8) |

## Licencia

`UNLICENSED` · privado (SuitOrg).
