# Prompt genérico: identidad corporativa para un sitio web

```text
Actúa como estratega de marca, redactor web corporativo y especialista en UX writing.

Necesito crear o mejorar la sección institucional de un sitio web para la siguiente empresa:

- Nombre de la empresa: [NOMBRE]
- Marca o sitio web: [URL O NOMBRE DE MARCA]
- Industria: [INDUSTRIA]
- Nicho: [NICHO]
- Especialidad: [ESPECIALIDAD / SERVICIO O PRODUCTO PRINCIPAL]
- Público objetivo: [CLIENTE IDEAL]
- Problema principal que resuelve: [PROBLEMA]
- Propuesta de valor: [DIFERENCIADOR]
- Ubicación o mercado: [PAÍS, CIUDAD O MERCADO]
- Etapa del negocio: [NUEVO / EN CRECIMIENTO / CONSOLIDADO]
- Tono de comunicación: [PROFESIONAL / CERCANO / TÉCNICO / INNOVADOR / OTRO]
- Pruebas o resultados disponibles: [MÉTRICAS, CASOS, TESTIMONIOS O "NO DISPONIBLE"]
- Compromisos reales de la empresa: [DATOS, SEGURIDAD, SOSTENIBILIDAD, ACCESIBILIDAD, ÉTICA DE IA, ETC.]

## Objetivo

Redacta el contenido para una página web titulada **“Nosotros”**, **“Acerca de”** o **“Nuestra empresa”**. El texto debe presentar la identidad de la empresa con claridad, credibilidad y lenguaje humano.

No inventes certificaciones, cifras, clientes, resultados, políticas legales, compromisos, años de experiencia ni afirmaciones que no estén en los datos proporcionados. Si falta información crítica, usa marcadores como `[PENDIENTE DE VALIDAR]` o redacta una versión prudente y no verificable.

## Estructura obligatoria

Entrega el contenido en Markdown con estas secciones:

### 1. Título principal

Crea un H1 breve, claro y centrado en el propósito o beneficio de la empresa. Evita frases vacías como “líderes en innovación” o “la mejor solución”.

### 2. Introducción: quiénes somos

Escribe entre 60 y 120 palabras. Explica qué hace la empresa, para quién trabaja, qué necesidad atiende y cómo lo hace. Debe entenderse incluso si el lector no conoce la marca.

### 3. Nuestra misión

Redacta una declaración de 25 a 60 palabras que responda:

- Qué hace la empresa
- Para quién lo hace
- Qué problema ayuda a resolver
- Qué beneficio busca generar

### 4. Nuestra visión

Redacta una declaración de 20 a 50 palabras que describa el futuro que la empresa quiere ayudar a construir. Debe ser aspiracional, pero realista y relevante para su industria.

### 5. Nuestros valores

Propón entre 4 y 6 valores. Para cada valor, incluye:

- Un título de 1 a 3 palabras
- Una explicación práctica de 25 a 45 palabras
- Un comportamiento observable que demuestre ese valor

Los valores deben ser específicos para la empresa. No uses palabras genéricas sin explicar cómo se aplican, por ejemplo: “Calidad”, “Innovación” o “Excelencia”.

### 6. Nuestro impacto

Redacta entre 100 y 250 palabras sobre los resultados que la empresa busca producir para clientes, usuarios, comunidad o entorno. Distingue claramente entre:

- Resultados demostrados, solo si se proporcionaron datos verificables
- Compromisos o metas futuras, si no hay métricas disponibles

Sugiere de 3 a 5 indicadores que la empresa podría medir. Ejemplos: tiempo ahorrado, procesos automatizados, satisfacción de clientes, accesibilidad mejorada, reducción de errores, conversiones o adopción de herramientas.

### 7. Nuestros compromisos

Incluye una lista de compromisos relacionados únicamente con la información aportada. Pueden abarcar privacidad, seguridad, transparencia, accesibilidad, uso responsable de IA, sostenibilidad, atención al cliente o mejora continua.

Si corresponde, añade enlaces internos sugeridos con este formato:

- `[Política de privacidad](/privacidad)`
- `[Términos y condiciones](/terminos)`
- `[Política de cookies](/cookies)`
- `[Política de uso responsable de IA](/uso-responsable-de-ia)`

No redactes políticas legales completas si no se te solicitan. En su lugar, propone una descripción breve y señala que deben ser revisadas por un profesional legal según la jurisdicción aplicable. Única excepción: el **Anexo legal** del final, que solo se redacta cuando el solicitante pida explícitamente llenar `politicas_privacidad` y/o `politicas_cookies`.

### 8. Llamado a la acción

Escribe un CTA final de 20 a 45 palabras que invite a una acción coherente con el negocio: contactar, solicitar presupuesto, agendar una consulta, conocer servicios, ver casos de estudio o iniciar una prueba.

## Requisitos de estilo

- Escribe en español neutro, salvo que se indique otro idioma.
- Usa voz activa, frases claras y párrafos cortos.
- Evita exageraciones, clichés y promesas absolutas.
- Prioriza beneficios concretos sobre lenguaje publicitario vacío.
- Mantén un tono consistente con el tono indicado.
- No excedas 1,000 palabras en las secciones 1 a 8. El Anexo legal (si se pidió) no cuenta en ese límite.
- Usa encabezados Markdown H1, H2 y H3.
- Entrega solamente el contenido listo para publicar; no expliques tu razonamiento.

## Revisión final

Al terminar, agrega una sección titulada `## Datos pendientes de validar`.

Incluye allí únicamente la información que falte para hacer el texto más preciso, por ejemplo:

- Año de fundación
- Ubicación principal
- Métricas de impacto
- Certificaciones
- Políticas publicables
- Casos de éxito autorizados
- Información sobre equipo o fundadores

## Anexo legal (solo si se solicita: `politicas_privacidad` / `politicas_cookies`)

Cuando el solicitante pida llenar estos dos campos, agrega al final, fuera de las secciones 1-8, los dos bloques siguientes. No los incluyas si no fueron solicitados. Este anexo es la única fuente de texto para esas columnas: no mezcles su contenido con las secciones 1-8.

### Bloque A → columna `politicas_privacidad`: Aviso de privacidad (México)

Redacta un aviso de privacidad en español neutro basado ÚNICAMENTE en normas mexicanas vigentes, sin inventar artículos, leyes ni datos:

- **LFPDPPP** — Ley Federal de Protección de Datos Personales en Posesión de los Particulares (DOF 05/12/2010, última reforma DOF 14/11/2025), artículo 15 (contenido mínimo del aviso de privacidad).
- **Reglamento de la LFPDPPP** (DOF 21/12/2015).
- **Lineamientos del Aviso de Privacidad** (DOF 17/01/2013).

Debe incluir como mínimo:

1. Identidad y domicilio del responsable (solo datos aportados; si falta el domicilio → `[PENDIENTE DE VALIDAR]`).
2. Datos personales que serán tratados, identificando los sensibles si aplica.
3. Finalidades primarias (las necesarias para la relación con el titular) y, si aplica, finalidades secundarias con el mecanismo para oponerse a ellas.
4. Transferencias a terceros: solo si se aportaron; si no, indicar que no se realizan transferencias que requieran consentimiento.
5. Derechos ARCO: medios y procedimiento para acceder, rectificar, cancelar u oponerse, con el canal de contacto (correo aportado).
6. Medio para conocer el aviso de privacidad integral.
7. Procedimiento y medio por el cual se comunicarán cambios al aviso.
8. Medidas de seguridad administrativas y técnicas descritas con prudencia (no prometas cifrado, certificaciones ni auditorías que no se hayan aportado).
9. Fecha de última actualización.

Cierra el bloque con esta nota: «Documento base generado para la plataforma — pendiente de revisión por asesoría legal antes de su publicación definitiva.»

### Bloque B → columna `politicas_cookies`: Política de cookies (México)

Redacta la política basada ÚNICAMENTE en:

- **Reglamento de la LFPDPPP, artículo 14, último párrafo**: cuando el responsable use mecanismos de comunicación electrónica que permitan recabar datos personales de forma automática y simultánea al contacto con el titular, debe informarle en ese momento el uso de esas tecnologías, que a través de ellas se obtienen datos personales y la forma de deshabilitarlas.
- **Lineamientos del Aviso de Privacidad (DOF 17/01/2013), fracción «Uso de cookies, web beacons u otras tecnologías similares»** (Trigésimo primero).

Debe incluir:

1. Qué son cookies y web beacons, con las definiciones de los Lineamientos.
2. Qué tecnologías usa el sitio y con qué finalidad — solo las confirmadas/aportadas; si no se conocen → `[PENDIENTE DE VALIDAR]`. No asumas Google Analytics, publicidad ni terceros que no se hayan indicado.
3. Datos personales que pueden obtenerse a través de ellas.
4. Cómo deshabilitarlas: desde el navegador (instrucciones genéricas) y, si aplica, desde el propio sitio.
5. Efecto de deshabilitarlas (el sitio puede perder funciones).
6. Contacto para dudas (correo aportado).
7. Fecha de última actualización.

Cierra con la misma nota de revisión legal del Bloque A.
```

## Uso rápido

1. Copia el bloque de texto.
2. Sustituye los campos entre corchetes por la información disponible.
3. Pégalo en el modelo de IA que uses.
4. Revisa el apartado de datos pendientes antes de publicar.

> Recomendación: conserva por separado las políticas legales completas —privacidad, cookies, términos, devoluciones o uso aceptable— y haz que las revise un profesional cualificado para el país o mercado donde operará el sitio.
