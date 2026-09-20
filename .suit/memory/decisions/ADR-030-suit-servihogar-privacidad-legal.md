# ADR-030: Privacidad, Términos y Legal — SuitServiHogar

## Estado
Aprobado (2026-09-16)

## Contexto
`appServiHogarOriginalReynosa.txt` tiene 43 requisitos. Al actualizar Contrato.md de v4.0 a v5.0, se descubrieron 2 requisitos faltantes (#42, #43) que no estaban en el mapeo original.

## Decisión
Agregar Fase 10 (Privacidad/Legal) al plan de ejecución de SuitServiHogar.

### Requisitos faltantes
| # | Requisito | Prioridad |
|---|---|---|
| 42 | Política de privacidad (datos no se comparten) + checkbox aceptación + blindaje legal mexicano (LFPDPPP, Consumer Protection) | ALTA — Producción-blocking |
| 43 | Términos y condiciones + cláusula de responsabilidad + prevención demandas colectivas + soberanía de costos (arbitraje obligatorio) | ALTA — Producción-blocking |

### Fase 10: Privacidad, Términos y Legal (~5h)
- `PrivacyPolicyScreen.tsx` — Política de privacidad
- `TermsScreen.tsx` — Términos y condiciones
- `legalClauses.ts` — Blindaje legal mexicano
- Checkbox de aceptación obligatoria en registro/login

## Consecuencias
- Total SuitServiHogar sube de 15.5h a 20.5h
- Total + SuitMargin sube de 18h a 24.5h
- Requisitos completados: 41/43 (95.3%)
- Pendientes: #42, #43

## Alternativas Consideradas
- No incluir políticas legales: Riesgo de demandas y multas de PROFECON
- Usar templates genéricos: No cubren especificidades mexicanas (LFPDPPP, arbitraje)

## Related
- `appServiHogarOriginalReynosa.txt:42-43`
- `Contrato.md v5.0: Fase 10`
- `.suit/memory/decisions/ADR-029-suit servihogar-microfrontend-aislado.md`
