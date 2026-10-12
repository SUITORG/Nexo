# Evaluación ideas-saas — corrida 2026-10-11 (modo verificadas)

> Panel: Mercado 25% · Técnico 30% · Riesgo 25% · Financiero 20% · Gate 7.5
> Fuentes ideación: superframeworks.com (gap score 8.3 avg niches), planmysaas.com, monolit.sh, redwerk.com, rankinpublic.xyz (2 búsquedas, 2026-10-11)

## Idea 1: PawBook — cuidado de mascotas (groomers/paseadores/doggy daycares)

### Tarjeta
- **Nicho:** proveedores independientes de cuidado de mascotas (1-10 staff): groomers móviles, paseadores, guarderías
- **Problema:** reservas por Instagram DM/WhatsApp + papel; perfiles de mascota (vacunas, alergias) perdidos; no-shows sin depósito
- **Solución (MVP):** calendario de reservas con perfil de mascota (vacunas, dueño), recordatorios, cobro de depósito para evitar no-shows
- **Monetización:** $19-39/mes por cuenta
- **Stack Python:** stdlib + sqlite3 (calendario, perfiles, recordatorios por email)
- **80/20:** reservas + perfil mascota + recordatorio = el 80% del dolor; GPS/servicios extra después

### Panel
| Experto | Score | Razón |
|---|---|---|
| Mercado | 8.0 | Gasto en mascotas US $150B+ y creciendo; gap score 8+ documentado para pet care; competencia = software kennel legacy caro (PetExec) |
| Técnico | 8.5 | CRUD calendario + perfiles + recordatorios: stdlib+SQLite, sin dependencias de pago; MVP en semanas |
| Riesgo | 7.0 | Square Appointments free tier es competidor real; churn moderado; sin riesgo ToS |
| Financiero | 7.5 | $19-39 con WTP documentado $30-150 en nichos de servicios; ~150 cuentas = $4K MRR |
| **TOTAL** | **7.8** | **APROBADO** |

## Idea 2: LessonLoop — maestros de música independientes

### Tarjeta
- **Nicho:** instructores privados de música, escuelitas 1-10 maestros
- **Problema:** agenda de lecciones recurrentes en Google Calendar + cobros por PayPal/Zelle sin registro; padres sin recordatorios
- **Monetización:** $19-49/mes
- **Stack Python:** stdlib + sqlite3
- **80/20:** agenda recurrente + cobros simple + recordatorios a padres

### Panel
| Experto | Score | Razón |
|---|---|---|
| Mercado | 7.0 | Mercado real pero incumbentes baratos (MyMusicStaff $12/mo, SuperSaas); maestros con presupuesto ajustado |
| Técnico | 8.5 | Recurrencia semanal + invoice simple: fácil en stdlib |
| Riesgo | 6.0 | Competencia establecida y barata; churn estacional (verano); maestros migran a gratis |
| Financiero | 6.5 | Tope de precio bajo ($12-19 realistic); necesitas volumen alto |
| **TOTAL** | **7.1** | **APROBADO CONDICIONAL** |

## Idea 3: InkAgenda — tatuadores y estudios pequeños

### Tarjeta
- **Nicho:** tatuadores independientes y estudios 1-5 artistas
- **Problema:** agenda por Instagram DM + depósitos por transferencia informal + consentimientos en papel
- **Solución (MVP):** reservas online con depósito, formulario de consentimiento digital, historial de cliente
- **Monetización:** $29-59/mes por artista
- **Stack Python:** stdlib + sqlite3 (depósitos se registran, cobro Stripe en fase 2)
- **80/20:** agenda + depósito + consentimiento digital = el flujo completo del estudio

### Panel
| Experto | Score | Razón |
|---|---|---|
| Mercado | 8.5 | Industria tatuaje US $3B+, artistas underserved (gap 8+); corren con IG DMs y papel |
| Técnico | 7.5 | Agenda + depósitos + consentimiento con timestamp; e-sign simple alcanza en MVP |
| Riesgo | 7.0 | Instagram DM funciona "bien enough" para muchos;合规 sanitaria varía por estado/país |
| Financiero | 8.0 | Un no-show cuesta $100-500; el depósito solo ya paga la suscripción; WTP alto |
| **TOTAL** | **7.7** | **APROBADO** |

## Veredicto del juez

| Idea | Total | Veredicto |
|---|---|---|
| **PawBook** | **7.8** | **APROBADO — ganadora** (mayor score) |
| InkAgenda | 7.7 | APROBADO |
| LessonLoop | 7.1 | APROBADO CONDICIONAL |

**Ganadora: PawBook (7.8).** InkAgenda queda como reserva si la 2V la hunde. LessonLoop descartada (incumbentes baratos + churn estacional).

Siguiente: **Etapa 2V** (modo verificadas) — analista-proy con investigación real → sintesis → re-juez con evidencia.
