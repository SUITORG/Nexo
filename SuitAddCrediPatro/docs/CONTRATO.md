# CONTRATO - SuitAddCrediPatro
Alcance: `SuitAddCrediPatro/` · Contrato padre: ninguno (herramienta interna, no tenant) · Fecha: 2026-11-12

## Propósito
Herramienta informativa personal que, dado el perfil del negocio (giro, zona, antigüedad, situación fiscal, monto y destino del recurso), recomienda **dónde acercarse a buscar créditos y patrocinios** (gobierno estatal/federal, banca, fundaciones, plataformas, cámaras) y genera un **escrito de pros y contras + argumentario de entrevista** para mejorar la probabilidad de aprobación. No solicita nada ni tramita dinero.

## Stack y ejecución
- Lenguaje / runtime: HTML + JavaScript vanilla (sin frameworks, sin build, sin servidor)
- Comandos: abrir `SuitAddCrediPatro/index.html` (vía MASTER.html o file://) · sintaxis `node --check SuitAddCrediPatro/app.js` · smoke manual (ver `MANUAL_PRUEBAS.md`)
- Variables de entorno requeridas: **ninguna** (sin red: todo el catálogo vive en el código)

## Datos y multi-inquilino
- Consume `Config_Empresas`: **no** (`id_empresa: null`, herramienta interna personal — asumido de la instrucción "por lo pronto es un proyecto que usaré de manera personal")
- Motor de datos: `CATALOGO` estático en `app.js` (18 programas verificados 2026-11 vía investigación web: Impulso NL/FOCRECE, NAFIN, FIFOMI, fundaciones reales) + `localStorage['acp_perfil']` (último perfil)
- Multi-tenant: N/A (un solo usuario)

## Límites
- Puede modificar: `SuitAddCrediPatro/**`
- No debe tocar: nada fuera del alcance; no añadir APIs de trámites, pagos ni frameworks
- Dependencias: `MASTER.html` (1 botón); registro en `.suit/registry/projects.yaml` y `GuiaTotal/registro/suitaddcredipatro.yaml`

## Invariantes (no romper nunca)
1. **Meramente informativo**: no solicita créditos ni patrocinios, no promete aprobación; siempre indicar "confirma requisitos y vigencia con cada institución"
2. El catálogo es **editable y fechado** (verificado 2026-11): cada programa lleva fuente/contacto real; no inventar programas ni montos
3. Vanilla JS (regla inmutable #7); `node --check app.js` tras cada edición
4. Datos del perfil solo en `localStorage` del usuario — no se transmiten a ningún servidor
5. `noindex, nofollow` mientras sea herramienta interna (regla EvaSol)

## Definición de terminado
- `node --check app.js` OK y smoke manual sin errores de consola (diagnóstico + ranking + argumentario + copiado)
- Commit por fase y ADR si hay cambio arquitectónico

## Cambios
- 2026-11-12: contrato inicial (guia-total, etapa construcción) — verificado contra código: `index.html`, `app.js`; smoke E2E dos perfiles (NL/RESICO/capital e informal/marketing)
