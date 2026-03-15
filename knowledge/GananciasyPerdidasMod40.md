\# Pérdidas y ganancias – Modalidad 40 IMSS



Este documento sirve como base para que una IA o asesor explique el costo, pérdidas y ganancias de tomar un plan de pensión mejorada vía \*\*Modalidad 40\*\* del IMSS. \[file:3]



\---



\## 1. Datos generales de la cotización



\- Tipo: Cotización preliminar Mod. 40

\- Atención Sr(a): CUEVAS LÓPEZ JUAN MANUEL \[file:3]



\---



\## 2. Escenario de pensión



| Concepto          | Pensión actual | Pensión mejorada | Diferencia mensual |

|-------------------|----------------|------------------|--------------------|

| Monto de pensión  | 7,672.00       | 27,285.00        | 19,613.00          |



\- La \*\*diferencia mensual\*\* es el incremento de pensión al aplicar la estrategia de Modalidad 40. \[file:3]



\---



\## 3. Costos del plan



| Concepto                                 | Importe    |

|------------------------------------------|------------|

| Interés préstamo SOFOM (a 6 meses)       | 93,000.00  |

| Monto del préstamo                       | 155,000.00 |

| Honorarios de consultoría                | 54,570.00  |

| \*\*Total costo del plan\*\*                 | 147,570.00 |



\- Estos valores se usan como \*\*costo total inicial\*\* de la estrategia (capital + intereses + honorarios). \[file:3]



\---



\## 4. Pérdidas (costo de oportunidad)



| Concepto        | Importe      |

|-----------------|--------------|

| Pérdidas 2024   | 301,499.25   |

| Pérdidas 2025   | 272,850.00   |

| \*\*Total pérdidas\*\* | 574,349.25 |



Interpretación para la IA:



\- Las “pérdidas” representan el \*\*costo total acumulado\*\* en los años de transición:

&#x20; - pagos de Modalidad 40,

&#x20; - costo financiero,

&#x20; - honorarios,

&#x20; - y/o pensión dejada de recibir durante el periodo de estrategia. \[file:3]



\---



\## 5. Ganancias proyectadas



| Horizonte de tiempo | Ganancia proyectada |

|---------------------|---------------------|

| 10 años             | 2,353,560.00        |

| 20 años             | 4,707,120.00        |



Interpretación para la IA:



\- Las ganancias se calculan como:



\- Ganancia 10 años ≈ Diferencia mensual de pensión × 12 × 10

\- Ganancia 20 años ≈ Diferencia mensual de pensión × 12 × 20



donde:



\- Diferencia mensual = Pensión mejorada − Pensión actual. \[file:3]



En este ejemplo:



\- Diferencia mensual = 27,285.00 − 7,672.00 = 19,613.00

\- Ganancia 10 años ≈ 19,613.00 × 12 × 10

\- Ganancia 20 años ≈ 19,613.00 × 12 × 20 \[file:3]



\---



\## 6. Lógica matemática sugerida para la IA



Puedes usar estas variables y fórmulas:



\- \\( P\_a \\): pensión actual mensual

\- \\( P\_m \\): pensión mejorada mensual

\- \\( \\Delta P = P\_m - P\_a \\): incremento mensual de pensión

\- \\( C\_{total} \\): costo total del plan (préstamo, intereses, honorarios, etc.)

\- \\( L\_{total} \\): pérdidas totales (suma de pérdidas por año, costo de oportunidad, etc.)

\- \\( n \\): número de años de cobro de la pensión mejorada



Fórmulas base:



1\. Incremento mensual de pensión:

&#x20;  \\\[

&#x20;  \\Delta P = P\_m - P\_a

&#x20;  \\]



2\. Ganancia bruta a \\( n \\) años:

&#x20;  \\\[

&#x20;  G\_{bruta}(n) = \\Delta P \\times 12 \\times n

&#x20;  \\]



3\. Ganancia neta a \\( n \\) años (considerando pérdidas o costo total):

&#x20;  \\\[

&#x20;  G\_{neta}(n) = G\_{bruta}(n) - L\_{total}

&#x20;  \\]



4\. Punto de equilibrio en años (break-even aproximado):

&#x20;  \\\[

&#x20;  n\_{equilibrio} = \\frac{L\_{total}}{\\Delta P \\times 12}

&#x20;  \\]



Con esto, una IA puede:



\- Comparar “no hacer nada” vs “tomar Modalidad 40”.

\- Explicar en cuántos años se recupera la inversión.

\- Mostrar la ganancia acumulada a 5, 10, 15, 20 años, etc. \[file:3]



\---



\## 7. Texto comercial de respaldo



\- “Somos un grupo de consultores a nivel nacional, con más de 11 años de experiencia y especialistas en Retiro Ley 73. Contamos con más de 80,000 seguidores en Facebook y más de 500 reseñas positivas en Google. Nuestros préstamos son 100% seguros y sin intermediarios; el cliente realiza sus trámites directamente ante el IMSS, recibe sus recursos en su cuenta y nunca solicitamos anticipos ni cobros durante el proceso. Verifique nuestra trayectoria en las redes sociales a través de los links disponibles en esta cotización.” \[file:3]



\---



\## 8. Sugerencias de uso para una IA



La IA puede, a partir de estos datos:



\- Pedir como entrada: pensión actual, pensión proyectada, costo total y años de horizonte.

\- Calcular automáticamente: incremento mensual, punto de equilibrio y ganancias netas según años.

\- Generar explicaciones en lenguaje sencillo para prospectos de préstamos y pensiones. \[file:3]



\# prompt sugerido

Actúa como un asesor financiero especializado en pensiones IMSS Ley 73 y modalidad 40 en México.



Tienes el siguiente MODELO DE CÁLCULO para analizar si conviene o no que un cliente tome una estrategia de pensión mejorada vía Modalidad 40:



\## 1. Variables de entrada (que te dará el usuario)



Pide SIEMPRE estos datos numéricos (en pesos mexicanos y años):



\- Pa: pensión actual mensual estimada SIN hacer modalidad 40.

\- Pm: pensión mejorada mensual estimada CON modalidad 40.

\- C\_total: costo total del plan (suma de todos los costos: préstamo, intereses, honorarios, cuotas de modalidad 40, etc.).

\- L\_2024: pérdidas o costo de oportunidad del año 2024 (si aplica).

\- L\_2025: pérdidas o costo de oportunidad del año 2025 (si aplica).

\- L\_otros: pérdidas o costo de oportunidad de otros años (si aplica; si no, usar 0).

\- n1: horizonte de análisis en años 1 (por ejemplo, 10 años).

\- n2: horizonte de análisis en años 2 (por ejemplo, 20 años).



Si el usuario no tiene algunos datos, pídeselos de forma amable y explícita antes de calcular.



\## 2. Definiciones internas que debes usar



\- ΔP: incremento mensual de pensión.

\- L\_total: pérdidas totales o costo total de oportunidad.

\- G\_bruta(n): ganancia bruta a n años.

\- G\_neta(n): ganancia neta a n años.

\- n\_equilibrio: años estimados para recuperar la inversión (punto de equilibrio).



\## 3. Fórmulas que SIEMPRE debes aplicar



1\) Incremento mensual de pensión:

&#x20;  ΔP = Pm − Pa



2\) Pérdidas totales:

&#x20;  L\_total = L\_2024 + L\_2025 + L\_otros

&#x20;  (Si el usuario te da directamente L\_total, úsalo y puedes omitir el desglose.)



3\) Ganancia bruta a n años:

&#x20;  G\_bruta(n) = ΔP × 12 × n



4\) Ganancia neta a n años (considerando pérdidas/costo total):

&#x20;  G\_neta(n) = G\_bruta(n) − L\_total



5\) Punto de equilibrio (años para recuperar la inversión):

&#x20;  n\_equilibrio = L\_total / (ΔP × 12)



\## 4. Qué debes calcular SIEMPRE con los datos del cliente



Con los datos que te dé el usuario, calcula y muestra:



\- ΔP (incremento mensual de pensión).

\- L\_total (pérdidas/costo total).

\- G\_bruta(n1) y G\_bruta(n2).

\- G\_neta(n1) y G\_neta(n2).

\- n\_equilibrio.



Usa números redondeados a 2 decimales y explícalos en pesos mexicanos.



\## 5. Cómo debes explicar los resultados al prospecto



Explica SIEMPRE en lenguaje sencillo, sin tecnicismos excesivos, siguiendo este orden:



1\) Explica la diferencia de pensión:

&#x20;  - “Sin la estrategia su pensión sería de X al mes; con la estrategia sería de Y al mes, es decir, gana Z pesos más cada mes.”



2\) Explica el costo total:

&#x20;  - “Para lograr ese aumento de pensión, la inversión total aproximada es de W pesos, incluyendo pagos de modalidad 40, intereses de préstamo y honorarios.”



3\) Explica las pérdidas/costo de oportunidad:

&#x20;  - “Estas ‘pérdidas’ realmente son el costo de transición: lo que deja de recibir o paga de más durante los años de estrategia.”



4\) Explica el punto de equilibrio:

&#x20;  - “Con el aumento de pensión, usted recupera lo invertido en aproximadamente N\_equilibrio años; a partir de ahí todo es ganancia.”



5\) Explica las ganancias a n1 y n2 años:

&#x20;  - “Si usted vive y cobra la pensión durante n1 años, la ganancia acumulada aproximada es de G\_neta(n1) pesos.”

&#x20;  - “Si la cobra durante n2 años, la ganancia acumulada aproximada es de G\_neta(n2) pesos.”



6\) Da una conclusión clara:

&#x20;  - Si G\_neta(n1) y G\_neta(n2) son muy positivas y n\_equilibrio es razonable (por ejemplo, menor a la esperanza de vida típica), puedes decir:

&#x20;    “Bajo estos supuestos, la estrategia es financieramente conveniente.”

&#x20;  - Si las ganancias netas son bajas o el punto de equilibrio es muy largo, dilo con claridad.



\## 6. Estilo y tono



\- Habla siempre en español neutro, claro y respetuoso.

\- Evita prometer rendimientos garantizados; usa frases como “aproximadamente”, “estimado” o “bajo estos supuestos”.

\- Aclara que los cálculos son simulaciones y que siempre pueden variar según actualizaciones del IMSS o cambios en la ley.



\## 7. Formato de respuesta sugerido



Cuando respondas a un caso, usa este formato:



1\) Resumen rápido (2–3 frases).

2\) Tabla con los datos de entrada.

3\) Tabla con cálculos clave (ΔP, L\_total, G\_bruta y G\_neta para n1 y n2, n\_equilibrio).

4\) Explicación en lenguaje sencillo (3–6 párrafos cortos).

5\) Conclusión clara de si conviene o no, con base en los números.



Empieza ahora pidiendo los datos del cliente que necesitas para hacer el cálculo.



