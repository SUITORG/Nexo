# MANUAL CLIENTE - SuitAddCrediPatro

> **Para qué sirve este manual:** enseña a usar la herramienta para diagnosticar tu necesidad de financiamiento, ver **dónde acercarte** y salir con un **escrito de pros y contras** listo para tus entrevistas.
> **Audiencia:** frontend — usuario final sin conocimientos técnicos (uso personal).
> **Versión:** 1.0 · **Última actualización:** 2026-11-12 · **Plataforma:** SuitAddCrediPatro

---

## Para qué sirve este manual (detalle)

Cubre el uso de la interfaz: llenar el perfil de tu negocio, interpretar el diagnóstico y las recomendaciones, y usar el argumentario. No cubre mantenimiento técnico (`MANUAL_TECNICO.md`).

## 1. Bienvenida

- Respondes un cuestionario corto sobre tu negocio y la herramienta te dice **dónde pedir** (gobierno, banca, fundaciones, plataformas, cámaras).
- Cada recomendación trae **pros, contras, contacto real y por qué coincide** contigo.
- Al final generas un **argumentario de entrevista**: tu caso en 3 líneas, qué mencionar a tu favor, cómo blindar tus puntos débiles y qué preguntarán.

## 2. Pantalla de inicio

- **Encabezado:** botones «Analizar mi caso» y «Limpiar».
- **Formulario:** giro, estado/zona, antigüedad, situación fiscal, empleados, ingresos, monto, destino del recurso (varios) y urgencia.

## 3. Flujo principal

1. Llena los campos tal como es tu negocio hoy (sin maquillar: el argumentario usa esos datos).
2. Marca **para qué necesitas el recurso** (puedes marcar varios).
3. Pulsa **Analizar mi caso**.
4. Lee en orden: **Diagnóstico** (qué tipo de apoyo te conviene) → **Dónde acercarte** (top 6 con contactos) → **Escrito pros y contras**.
5. Pulsa **Copiar argumentario** y pégalo en tus notas o compártelo.

## 4. Cómo leer las recomendaciones

- **Coincidencia en pts**: entre más alto, mejor encaja tu perfil con ese programa.
- **Badges verdes**: las razones concretas (cobertura en tu estado, tu monto cabe, acepta tu situación fiscal...).
- **PROS / CONTRAS**: lo que juega a favor y en contra en esa institución específica.
- **Dónde acercarte**: contacto real (correo, teléfono, dirección, portal) verificado en 2026-11.

## 5. Problemas frecuentes

| Problema | Causa probable | Qué hacer |
|---|---|---|
| Todo aparece con baja coincidencia | Perfil muy nuevo/informal o monto desproporcionado | Revisa el bloque de CONTRAS del argumentario: trae el plan para corregirlo |
| Un programa dice "verifica si aplica en tu zona" | Su cobertura no es tu estado | Confirma con la institución antes de aplicar |
| Los datos cambiaron (teléfonos, montos) | El catálogo es estático (2026-11) | Verifica siempre con la fuente; actualiza el catálogo (`MANUAL_TECNICO.md` §5) |

## 6. Diagrama de flujo

```text
[Usuario] → [perfil del negocio] → [diagnóstico] → [dónde acercarte + pros/contras] → [argumentario copiado] → [entrevista]
```

## Datos pendientes de validar

- [ ] Ninguno funcional; el catálogo requiere revisión periódica de vigencia (ver `GuiaTotal/PENDIENTES.md`)
