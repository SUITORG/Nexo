# Plan de Desarrollo: AmbuRide — App de Ambulancias On-Demand

Proyecto **single-tenant**, aislado dentro de SuitOrg (coexistencia temporal — ver reglas de aislamiento abajo), extraíble a repo propio sin fricción cuando toque.

## 0. Prioridades
1. Este plan (vivo, se ajusta)
2. **App** (Android/iOS) — foco principal
3. Sitio web — después, reutilizando `SuitLandings`

## 1. Diferenciadores vs. Uber/Didi normal
| Punto | Implicación de diseño |
|---|---|
| El "pasajero" puede estar inconsciente o en pánico | Flujo de solicitud en ≤2 toques, botón SOS gigante |
| Vehículo con equipo médico variable | Tipos de unidad: Básica / Avanzada / UCI móvil |
| Conductor = paramédico certificado | Verificación de credenciales antes de operar |
| Datos médicos sensibles | Cifrado + RLS + mínimo dato necesario (no historial clínico completo) |

## 2. Roles
Paciente/Solicitante · Paramédico-Conductor · Despachador (panel web) · Admin (branding, tarifas, flota)

## 3. Stack
| Capa | Elección |
|---|---|
| Frontend app | React Native + Expo (`app/`) |
| Backend/BD | Supabase propio (Postgres + Auth + Realtime + Storage) — **no** el proyecto de EvaSol |
| Capa de control | Solo Supabase (tabla `config_app` + admin screen) — sin Google Sheets, YAGNI en single-tenant |
| Mapas | Google Maps API |
| Pagos | Stripe (modo test) + efectivo |
| Sitio web | `SuitLandings` + `scripts/ssg-engine.mjs`, más adelante |

## 4. Branding
Ya definido en `docs/_stitch_extract/stitch_on_demand_ambulance_platform/amburide/DESIGN.md` — nombre **AmbuRide**, rojo `#af101a`, azul `#005faf`, verde `#016619`, tipografía Inter, grid 8px, radios 4px. Se porta a `app/src/theme.js`.

## 5. Modelo de datos (Supabase, sin `id_empresa`)
- `usuarios` — id, telefono (único), nombre, tipo_sangre, alergias[], contacto_emergencia_json
- `paramedicos` — id, nombre, licencia, cert_paramedico(bool), foto_url, verificado(bool), rating
- `ambulancias` — id, placa, tipo(basica/avanzada/uci), equipamiento[], id_paramedico_asignado, estado
- `ubicaciones_live` — id_ambulancia, lat, lng, updated_at (realtime)
- `servicios` — id, id_usuario, id_ambulancia, tipo, estado, origen_json, destino_json, costo, timestamps_json
- `pagos` — id, id_servicio, monto, metodo, estado, stripe_payment_id
- `config_app` — tarifa_base, tarifa_km, tarifa_espera_min, recargo_nocturno_pct, colores_json, logo_url

RLS: usuario ve solo su fila; paramédico ve solo servicios asignados; admin ve todo.

## 6. Seguridad (mínimo Fase 1)
Auth teléfono+OTP · RLS por tabla · TLS 1.3 · dato médico mínimo · botón de pánico + ubicación compartida con contacto de emergencia · borrado de cuenta autoservicio.
Diferido: certificate pinning, detección root/tamper, FLAG_SECURE.

## 7. Registro (UX)
Bienvenida → Teléfono+OTP → Datos básicos (sangre, alergias, contacto emergencia) → Permisos (GPS, notificaciones) → Mapa + botón SOS.

## 8. Responsive
Mobile-first (Expo por defecto) + build web para panel de despacho. Botón SOS grande, targets ≥44px, contraste AA.

## 9. Pagos
Stripe sandbox desde el día 1, efectivo como fallback. Tarifa = base + km + espera + recargo nocturno, editable en `config_app`.

## 10. Costos / instalación
Node.js, VS Code, Git, cuenta Expo, cuenta Supabase: $0. Google Play $25 USD único. Apple Developer $99 USD/año (requiere Mac). Google Maps API gratis hasta $200/mes de uso.

## 11. Reglas de aislamiento (coexistencia → extracción sin dolor)
- Cero imports cruzados con `backend/`, `js/modules/`, otros `Suit*` — todo consumo externo es vía HTTP, nunca `require`/`import` directo.
- `package.json` propio en `AmbuRide/app/`, **no** registrado en `pnpm-workspace.yaml`.
- Supabase propio, `.env` propio gitignoreado.
- Excluido de `deploy.yml` (GitHub Pages) — ver paso "Exclude non-public projects from Pages".
- Extracción futura: `git subtree split --prefix=AmbuRide -b amburide-standalone`.

## 12. Gate legal
Estado asumido por ahora: **prototipo/demo**. Dispatch y pagos quedan simulados hasta tener registro del negocio, permisos de transporte médico y seguro de responsabilidad. El flujo de SOS debe incluir disclaimer "no reemplaza al 911/número de emergencia local" desde la primera pantalla.

## 13. Roadmap
1. ✅ Plan
2. **MVP App** (en curso):
   - ✅ Proyecto Supabase propio (`amburide`), schema + RLS, 0 alertas de seguridad
   - ✅ App Expo conectada: Bienvenida → Teléfono+OTP → Perfil médico → Home
   - ✅ Asignación automática de ambulancia (trigger en DB, no en cliente — ver `docs/`), flota demo sembrada (3 unidades)
   - ⏳ Bloqueado en registro OTP real: falta configurar proveedor SMS (Twilio u otro) en Supabase Auth — acción externa del usuario
   - ⏳ Mapa real: falta API key de Google Maps — acción externa del usuario
   - Pendiente: pago (efectivo primero), pantalla del lado paramédico
3. Seguridad + pagos reales (cuando el gate legal se resuelva)
4. Panel de despacho (web)
5. Sitio web (`SuitLandings`)
6. Piloto beta
7. Publicación en tiendas (Android primero)
8. Expansión
