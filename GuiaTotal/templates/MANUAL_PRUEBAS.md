# MANUAL DE PRUEBAS — [NOMBRE PROYECTO]

> **Para qué sirve este manual:** explica el modo test/dev del proyecto: cómo correr el flujo completo E2E con mocks, sin depender de servicios reales (pagos, OAuth, base de datos de producción).
> **Audiencia:** desarrollador del proyecto que valida cambios antes de subirlos.
> **Versión:** 1.0 · **Última actualización:** [FECHA] · **Plataforma:** [NOMBRE PROYECTO]

---

## Para qué sirve este manual (detalle)

Cubre solo el entorno de pruebas: feature flag o comando de modo dev, qué se mockea, qué datos de prueba existen y cómo ejecutar el recorrido completo de punta a punta. No cubre uso real (manuales cliente/proveedor) ni operación en producción (`MANUAL_TECNICO.md`).

## 1. Qué es el modo de pruebas

[Feature flag o comando: qué activa y por qué existe (probar E2E sin Stripe real, OAuth real, BD prod, etc.).]

## 2. Activación rápida

```bash
[comando / flag / entorno]
```

[Pasos en orden, 3-6.]

## 3. Qué se mockea y qué no

| Servicio | En modo pruebas | En producción |
|---|---|---|
| [pagos] | mock | real |
| [auth] | mock | real |
| [BD] | [datos de prueba] | [prod] |

## 4. Datos de prueba

[Cuentas, empresas, registros seed y dónde viven.]

## 5. Recorrido E2E completo

```text
[Entrada] → [paso 1] → ... → [resultado final esperado]
```

[Pasos exactos con qué se espera ver en cada pantalla/estado.]

## 6. Criterios de pasada

- [ ] [condición 1 — si falla, el cambio no está listo]
- [ ] [condición 2]

## 7. Problemas frecuentes del modo pruebas

| Problema | Causa | Solución |
|---|---|---|
| [síntoma] | [causa] | [paso] |

## Datos pendientes de validar

- [ ] [qué falta confirmar antes de entregar este manual]
