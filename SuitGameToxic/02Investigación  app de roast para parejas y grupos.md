# Investigación: app Android de "roast" para parejas y grupos (mercado hispanohablante)

Nombre de trabajo usado en este documento: **Tírame** (hay que comprobar la marca antes de usarlo). Enfoque acordado: humor tipo roast, es decir, burla ingeniosa y consentida entre personas que se quieren. No trata de gestionar relaciones tóxicas reales.

## Resumen ejecutivo

- **La ciencia da la razón a la idea, con una condición.** El humor afiliativo (que une) predice más satisfacción en la pareja. El humor agresivo de la pareja la reduce. El roast funciona cuando la burla lleva señales claras de juego y hay consentimiento y confianza. Por eso el diseño tiene que fabricar esas señales: turnos, votos, reacciones, "derecho a réplica" y temas prohibidos elegidos por cada jugador.
- **En el mercado hay un hueco claro.** Las apps de roast con IA ([RoastGPT](https://play.google.com/store/apps/details?id=com.litpublishing.aiapp.roastgpt&hl=en_US), [Roast App](https://apps.apple.com/ec/app/roast-app-roast-con-ia/id6743675883?platform=ipad)) son generadores para una sola persona. Las apps de fiesta en español ([Picolo](https://play.google.com/store/apps/details?id=com.picolo.android&hl=es), [TOZ](https://play.google.com/store/apps/details?id=com.blincio.toz&hl=es_US)) son de pasarse el móvil, sin votos ni progreso. Las apps de pareja ([Paired](https://getaperi.com/blog/paired-app-review)) son serias. El formato más parecido, con votos del grupo, es [Quiplash](https://www.jackboxgames.com/games/quiplash), que no está pensado para móvil ni en español nativo.
- **Lo que piden los usuarios es muy claro.** Se quejan de muros de pago, suscripciones semanales "trampa", contenido repetido, anuncios cada minuto y malas traducciones. Esas cinco quejas son la mejor guía de lo que no hay que hacer.
- **El contexto cultural es ideal.** La "carrilla" mexicana, el albur, el vacile y las batallas de freestyle ([Aczino vs Wos: 50 millones de visualizaciones](https://www.redbull.com/es-es/5-batallas-de-gallos-mas-vistas)) muestran que la burla con ingenio y con jurado ya es un entretenimiento de masas en español. Además, WhatsApp llega al 90–94% de la población en los grandes mercados de Latinoamérica ([Tour Innovación](https://www.tourinnovacion.cl/transformacion-digital/america-latina-ya-no-atiende-llamadas-como-whatsapp-se-convirtio-en-la-infraestructura-social-de-la-region/)).
- **Hay riesgos reales:** acoso, menores y anonimato. Hay precedentes fuertes: la FTC prohibió a NGL ofrecer mensajería anónima a menores ([FTC](https://www.ftc.gov/news-events/news/press-releases/2024/07/ftc-order-will-ban-ngl-labs-its-founders-offering-anonymous-messaging-apps-kids-under-18-halt)) y Google Play retira apps que facilitan acoso ([Google Play](https://support.google.com/googleplay/android-developer/answer/17517561?hl=en-GB)). La propuesta: sin anonimato, salas privadas, consentimiento explícito y moderación en capas.

---

## Pilar 1. Fundamentos expertos

### 1.1 El humor que une y el que separa

| Hallazgo | Evidencia | Implicación de diseño |
|---|---|---|
| El humor afiliativo diario (propio y de la pareja) predice más satisfacción. El humor agresivo de la pareja la reduce. | Diario de 10 días con 200 personas en pareja, dirigido por Rod Martin ([Western University, 2014](https://core.ac.uk/download/pdf/61643449.pdf)) | Premiar las burlas que hacen reír a los dos, no las que solo hieren. |
| En conflictos reales, el humor afiliativo aumenta la cercanía. El agresivo se asocia a menos resolución. | 98 parejas grabadas ([Campbell, Martin y Ward, 2008](http://ereserve.library.utah.edu/Annual/EDPS/5960/Henrie/edps5960observational.pdf)) | La app no debe usarse para "discutir en serio". Hay que separar el juego del conflicto. |
| El humor adaptativo se correlaciona con bienestar (ρ≈0,23). El desadaptativo, con malestar. | Metaanálisis de 85 estudios y 27.562 personas ([Frontiers in Psychology, 2020](https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2020.02213/pdf)) | Medir y mostrar el "estilo de humor" de cada jugador como algo lúdico. |
| Reír a la vez es un marcador de relación sana. | 71 parejas codificadas ([Kurtz y Algoe, 2015](https://pmc.ncbi.nlm.nih.gov/articles/PMC4779443/)) | El "momento de risa compartida" (los dos votan 👍 o reaccionan 🔥) debe dar la mayor recompensa. |

### 1.2 Burla (teasing): la clave son las señales de juego

- Dacher Keltner define la burla como una provocación intencional acompañada de **señales de que no va en serio** (exageración, apodos, metáforas, tono cantarín, risa). En parejas, las burlas con pocas señales provocaron más enfado y desprecio y menos amor, aunque la hostilidad fuera la misma ([Psychological Bulletin, 2001](https://greatergood.berkeley.edu/dacherkeltner/docs/keltner.teasing.psychbull.2001.pdf)).
- La burla aparece en casi todas las culturas y puede aumentar la intimidad. El estudio cita el ejemplo de un tío latino que llama "fea" a su sobrina con cariño. En uno de los experimentos, las parejas se inventaban apodos a partir de iniciales, un formato que se puede convertir casi directamente en mecánica de juego ([Campos et al., 2007](https://greatergood.berkeley.edu/dacherkeltner/docs/campos.2007.pdf)).
- Una revisión de 35 estudios cualitativos (2025) encontró que la burla juguetona solo aparece dentro de relaciones positivas. Los jóvenes usan cinco factores para distinguirla del daño, entre ellos el tono (emojis incluidos) y el contenido ([Springer, 2025](https://link.springer.com/content/pdf/10.1007/s40894-025-00262-6.pdf)).
- **Advertencia:** en 34 parejas adolescentes méxico-estadounidenses, la burla tuvo sobre todo consecuencias negativas (vergüenza, luchas de poder), y "solo estaba bromeando" es una justificación frecuente de la violencia en el noviazgo ([University of Nebraska Omaha](https://digitalcommons.unomaha.edu/cgi/viewcontent.cgi?article=1072&context=socialworkfacpub)). Esto apoya exigir 18+ y no dirigir la app a adolescentes.

### 1.3 Por qué una burla hace gracia: la "violación benigna"

- Según la teoría de la violación benigna, algo es gracioso cuando rompe una norma (el insulto amenaza la identidad) **y a la vez** se percibe como inofensivo. Sin lo primero aburre. Sin lo segundo ofende. La confianza es un límite: "no hay nada benigno en que te haga cosquillas un desconocido siniestro" ([McGraw y Warren, 2014](https://leeds-faculty.colorado.edu/mcgrawp/pdf/mcgraw.warren.2014.pdf)).
- Hay un "punto dulce" que depende de la distancia psicológica. Bromear sobre algo muy reciente o muy grave falla. Quien cuenta el chiste y quien lo recibe pueden percibirlo de forma distinta ([Kant y Norman, 2019](https://pmc.ncbi.nlm.nih.gov/articles/PMC6593112/)).
- **Implicación:** los temas deben ser elegidos o aprobados por la persona que recibe la burla, y la app debe evitar temas sensibles recientes (rupturas, duelos).

### 1.4 El roast como práctica social

- En r/RoastMe, el roast se describe como humor afiliativo basado en **agresión fingida**. Requiere consentimiento explícito de quien lo recibe y reglas contra el "hating" y el bullying. Varios roasters compiten en ingenio ([De Gruyter, Humor](https://www.degruyter.com/document/doi/10.1515/humor-2019-0070/html?lang=en)).
- La frontera entre agresión fingida y ciberacoso es frágil: "solo bromeaba" puede ocultar agresión real ([Humour and (mock) aggression](https://etalpykla.vilniustech.lt/bitstream/handle/123456789/111754/1-s2.0-S0271530921000586-main.pdf?sequence=1&isAllowed=y)).
- En España, los cómicos lo resumen así: "en un roast nos reímos todos con todos… Mofarse es reírse sin el consentimiento de la otra persona". El protagonista tiene "derecho a réplica" y hay formatos uno contra uno y dos contra dos ([El Periódico](https://www.elperiodico.com/es/ocio-y-cultura/20231103/roast-divierte-ver-mundo-insulta-cruilla-94128012)).

### 1.5 Diseño de juego: adictivo como Tetris y sostenible

- **Flujo:** Tetris engancha en menos de tres minutos gracias a un bucle corto, respuesta inmediata y dificultad que sube poco a poco ([PixelPrompt](https://www.pixelprompt.it/en/blog/tetris-psychology-flow.html)).
- **Retención de referencia:** en 11.600 juegos móviles, la mediana del D7 (usuarios que vuelven al séptimo día) es del 3,4–3,9% y el cuartil superior llega al 7–8%. En Android el D7 es más bajo que en iOS (7,5% frente a 12,6%) ([PlayGenus / GameAnalytics](https://playgenus.com/docs/guides/good-d7-retention)).
- **Rachas:** las pruebas A/B de Duolingo muestran efectos modestos (+1,7% de retención a 7 días con animaciones). Además, ver una racha rota puede desmotivar más que no tener racha. Las opciones de "reparar" la racha reducen ese daño ([análisis de la racha de Duolingo](https://hosdocumentary.com/articles/duolingo-streak)).
- **Viralidad:** el coeficiente viral es K = invitaciones × conversión. Integrar la invitación en el bucle principal y ofrecer los canales que ya usa la gente, como WhatsApp, multiplicó por 2,7 las invitaciones y por 5,3 la conversión. Conviene pedir que compartan justo después de un "momento wow" ([GamesIndustry.biz](https://www.gamesindustry.biz/how-to-design-your-mobile-game-for-maximum-virality)).
- **Compartir resultados sin destripar:** Wordle se volvió viral cuando añadió la cuadrícula de emojis para compartir ([Slate](https://slate.com/culture/2022/01/wordle-game-creator-wardle-twitter-scores-strategy-stats.html)).

### 1.6 IA y humor

- ChatGPT 3.5 superó al 87% de los humanos en chistes de tipo roast, y el 73% prefirió sus roasts ([PLOS One, 2024](https://pmc.ncbi.nlm.nih.gov/articles/PMC11221738/)).
- A la vez, repitió variaciones de solo 25 estructuras de chiste en más del 90% de los casos ([Tech.co](https://tech.co/news/stop-chatgpt-roast-your-instagram)). En una prueba real, el modo "Unhinged" de Grok "tiene como tres chistes, lleve lo que lleve" ([TechBuzz](https://www.techbuzz.ai/articles/grok-s-epic-roast-feature-falls-flat-in-real-world-test)).
- **Implicación:** la IA sirve como "comodín" o "juez", pero la gracia tiene que venir de los jugadores. La IA sola se vuelve repetitiva.

### 1.7 Normativa y seguridad

| Norma o precedente | Qué exige o enseña |
|---|---|
| Google Play: acoso y contenido de usuarios | Prohíbe apps que faciliten acoso o humillación pública. Exige términos de uso, moderación continua, denuncia de contenido y usuarios, y bloqueo. La monetización no debe incentivar malas conductas ([Política de contenido generado por usuarios](https://support.google.com/googleplay/android-developer/answer/9876937?hl=en), [Política para desarrolladores](https://support.google.com/googleplay/android-developer/answer/17517561?hl=en-GB)) |
| Google Play: anonimato | Las apps cuya función principal es la comunicación anónima deben bloquear a menores ([Google Play](https://support.google.com/googleplay/android-developer/answer/17517561?hl=en-GB)) |
| NGL (FTC, 2024) | Multa de 5 M USD y veto a menores por ciberacoso y mensajes falsos generados para simular interacción ([FTC](https://www.ftc.gov/news-events/news/press-releases/2024/07/ftc-order-will-ban-ngl-labs-its-founders-offering-anonymous-messaging-apps-kids-under-18-halt)) |
| Gas (Discord) | Llegó a ser la app n.º 1 en octubre de 2022 con encuestas anónimas de halagos. Un bulo le quitó el 3% de usuarios en un día y cerró al año de ser comprada ([Wikipedia](https://en.wikipedia.org/wiki/Gas_(app)), [TechCrunch](https://techcrunch.com/2023/10/19/discord-kills-gas-anonymous-compliments-app-bought-nine-months-ago/)) |
| España: ley de menores en entornos digitales (en tramitación) | Sube de 14 a 16 años la edad de consentimiento de datos y de registro en redes. Exige canales de denuncia y verificación de edad ([El País](https://elpais.com/sociedad/2025-03-25/claves-de-la-ley-de-proteccion-a-los-menores-en-el-entorno-digital.html), [Ministerio de la Presidencia](https://www.mpr.gob.es/prencom/notas/paginas/2025/100925-tramitacion-lo-proteccion-menores-entornos.aspx)) |
| España: ley del derecho al honor (2026) | Considera ilegítimo usar la voz o la imagen generadas con IA sin consentimiento ([El País, 2026](https://elpais.com/sociedad/2026-07-07/el-consejo-de-ministro-aprueba-la-nueva-ley-del-derecho-al-honor-que-protegera-de-los-deepfakes.html)). Los roasts con fotos o voces con IA requieren consentimiento explícito |
| Herramientas de moderación | Perspective API deja de funcionar después de 2026 ([Perspective](https://www.perspectiveapi.com/)). El modelo de moderación de OpenAI es gratuito y ha mejorado en español ([OpenAI](https://openai.com/index/upgrading-the-moderation-api-with-our-new-multimodal-moderation-model/)). Una cascada de palabras clave → clasificador → LLM → revisión humana cuesta en torno al 1,5% de pasar todo por un LLM ([Digital Applied](https://www.digitalapplied.com/blog/ai-content-moderation-2026-llm-trust-safety-guide)) |

### 1.8 Principios de diseño derivados

1. **Consentimiento visible:** cada jugador activa "Acepto que me roasteen" y marca sus temas prohibidos.
2. **Señales de juego integradas:** emojis de reacción, tono exagerado, estilos cómicos y la animación de "¡ARDIÓ! 🔥".
3. **Reciprocidad:** todos reciben y todos lanzan, por turnos. Nadie es siempre el blanco.
4. **Derecho a réplica** después de cada roast recibido.
5. **Freno de emergencia:** un botón "Me pasé / Me dolió" que retira el roast sin castigar a quien lo pulsa.
6. **Sin anonimato:** cada roast va firmado.
7. **Contenido con cierto riesgo, pero benigno:** ingenio sí; vulgaridad extrema y grupos protegidos, no.

---

## Pilar 2. Apps de éxito del sector

### 2.1 Referentes analizados

| App | Datos | Mecánica clave | Monetización | Lección para Tírame |
|---|---|---|---|---|
| **Quiplash** (Jackbox) | 3–8 jugadores y hasta 10.000 espectadores votando ([Jackbox](https://www.jackboxgames.com/games/quiplash)) | Respuestas enfrentadas en duelo, votación del grupo, bonus "Quiplash" si arrasas ([Jackbox Wiki](https://jackboxgames.fandom.com/wiki/Quiplash_(series))) | Pago único (CA$12,99) | Es la mecánica central que hay que adaptar a móvil y a roast |
| **Psych!** (Warner Bros.) | 5M+ descargas, nota 3,8 en Google Play ([Google Play](https://play.google.com/store/apps/details?id=com.wb.goog.ellen.psych&hl=en_US)) | Engañar a los amigos con respuestas falsas y ganar puntos cuando te eligen | Anuncios y mazos | Los anuncios largos hunden la nota ([App Store](https://apps.apple.com/us/app/psych-outwit-your-friends/id1005765746?see-all=reviews&platform=iphone)) |
| **Heads Up!** | 10M+ descargas en Android ([Google Play](https://play.google.com/store/apps/details?id=com.wb.headsup&hl=en_US)) | Graba la reacción de los amigos para compartirla | Mazos de pago | El vídeo compartible es su motor viral; las quejas son "pagar el 90% de los mazos" ([Marlvel](https://marlvel.ai/intel-report/games/heads-up)) |
| **Picolo** | 5M+ descargas, nota 3,6 en Android frente a 4,7 en iOS ([Google Play](https://play.google.com/store/apps/details?id=com.picolo.android&hl=es), [App Store](https://apps.apple.com/us/app/picolo-party-game/id1001473964?see-all=reviews)) | Nombres de jugadores, cartas aleatorias, modos por intensidad | Suscripción semanal | Hay demanda en español, pero la suscripción destruye la confianza |
| **Insight** (MWM) | 2,5M+ descargas en iOS, nota 4,6 ([MWM](https://mwm.ai/es/apps/insight-play-with-friends/6471489809)) | Código o QR para entrar, 30 s para responder, votar las mejores respuestas | Modos premium | Unirse por código y responder en poco tiempo encaja con el ritmo tipo Tetris |
| **TOZ** | 500K+ descargas, nota 4,1 ([Google Play](https://play.google.com/store/apps/details?id=com.blincio.toz&hl=es_US)) | 10 minijuegos, modos Soft/Hot | Pasó de gratis a suscripción | Las quejas se centran en malas traducciones y en la suscripción |
| **Paired** | "Más de 4 millones de parejas"; unos 15 USD/mes ([Aperi](https://getaperi.com/blog/paired-app-review)) | Pregunta diaria, respuestas ocultas hasta que ambos contestan, rachas | Una suscripción para la pareja | La revelación mutua y las rachas funcionan; el uso de 6–7 días por semana se asocia a mejor relación ([JMIR / PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC12001865/)) |
| **Evergreen / Agapé** | Nota 4,8 en iOS ([unstar.app](https://unstar.app/blog/paired-lasting-love-nudge-evergreen-cupla-couples-apps-ranked-2026)) | Preguntas diarias gamificadas, rachas, puntos | Suscripción | La gamificación ligera funciona en parejas |
| **RoastGPT** | 50K+ descargas ([Google Play](https://play.google.com/store/apps/details?id=com.litpublishing.aiapp.roastgpt&hl=en_US)) | 13 estilos, roast por foto, "Nuclear Roasts", rachas, XP, tarjetas para compartir | Créditos, anuncios y prueba de 3 días | Valida el apetito por estilos y tarjetas, pero la experiencia es individual |
| **Roast Battle AI** | Nota 13+ en App Store ([App Store](https://apps.apple.com/gh/app/roast-battle-ai/id6755838585)) | Batallas contra la IA o amigos por enlace, marcador en vivo | Pago por batalla (0,99–5,99 USD) | Es el más cercano al concepto, pero solo en inglés y centrado en la IA |
| **Juegos de Fiesta – Roasted** | 4 idiomas, 9+ ([App Store](https://apps.apple.com/es/app/juegos-de-fiesta-roasted/id6475793543?l=ca)) | "Quién es más probable que…" | Pase "por la noche" a 0,49 € | Precio por sesión: una idea buena para el público hispano |
| **Basta / Stop** | 50M+ descargas ([Google Play](https://play.google.com/store/apps/details?id=com.fanatee.stop&hl=es_CL)) | Juego clásico de patio digitalizado | Anuncios | Digitalizar un juego cultural conocido escala mucho; exceso de anuncios = queja n.º 1 |
| **Preguntados** (Etermax, Argentina) | 20 M de usuarios diarios en 2015 ([Cuti](https://cuti.org.uy/destacados/preguntados-celebra-una-decada-de-curiosidad-e-influencia-en-la-industria-del-gaming/)) | Partidas por turnos contra amigos | Freemium | Un juego latino de turnos asíncronos puede conquistar incluso EE. UU. |
| **Gartic Phone** (Brasil) | 500K+ descargas en Android, nota 4,8 ([Google Play](https://play.google.com/store/apps/details?id=com.gartic.garticphone&hl=pt_BR)) | Sala por enlace o QR, álbum final para compartir | Anuncios | Salas solo con amigos "para una experiencia más divertida y segura" |
| **Plato** | 3–20 jugadores ([Plato](https://platoapp.com/en/solutions/groups)) | El juego entra directamente en el grupo de WhatsApp o Telegram, sin cuenta obligatoria | Freemium | "No necesitas iniciar una conversación, necesitas un evento" |

### 2.2 Patrones comunes que funcionan

1. **Entrar en segundos:** código, QR o enlace, sin crear cuenta (Insight, Gartic, Plato).
2. **Respuestas en duelo con voto del grupo:** Quiplash y Psych!.
3. **Niveles de intensidad** (Suave, Picante, Hot) en casi todas las apps de fiesta.
4. **Revelación mutua y rachas** en las apps de pareja.
5. **Artefacto para compartir:** vídeo (Heads Up!), álbum (Gartic), tarjeta (RoastGPT), cuadrícula de emojis (Wordle).
6. **Estilos de humor** (RoastGPT tiene 13), que funcionan como señales de juego.

![Mapa de posicionamiento](https://d2z0o16i8xm8ak.cloudfront.net/d0565585-8817-4688-ae08-576e77a5779e/8577f97a-c1f0-433e-8ddc-e2ff1814b7a1/mapa-posicionamiento.png?Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9kMnowbzE2aTh4bThhay5jbG91ZGZyb250Lm5ldC9kMDU2NTU4NS04ODE3LTQ2ODgtYWUwOC01NzZlNzdhNTc3OWUvODU3N2Y5N2EtYzFmMC00MzNlLThkZGMtZTJmZjE4MTRiN2ExL21hcGEtcG9zaWNpb25hbWllbnRvLnBuZz8qIiwiQ29uZGl0aW9uIjp7IkRhdGVMZXNzVGhhbiI6eyJBV1M6RXBvY2hUaW1lIjoxNzkwNzEzODg4fX19XX0_&Signature=SucvCzTQi4t0MzO3NEyDgr6X01sTEXw6hDGwAiDq~N7Gs-ZMVLAhw-65BvHlSNgDEgTrA30SXr4evchDMuaz0A8Col6-nGBucDTU0DiX~NTr5REnC2FoCZeWwJg2-~PtB2lA7PsvggyV9atRdgo67zdpkDYtiLQho1pZB3~6VKzuTwnzNz3hIXqTgKGIfjCQEEWdGZuXAw2HXvWAZTRFjvU~lJ2rKWiQ3H25RAvmQuxCIw~vBaho3tBZ6kCNqsX9bOf1ueNe940i3vMbY2DzwqLDl1LWNWZ8RBIjmALwzeeig7e~Db6cVUnFd39vIoxkjIcOKVt6iRHp415rDuDByQ__&Key-Pair-Id=K1BF7XGXAIMYNX)

---

## Pilar 3. Necesidades reales de los usuarios

![Quejas en apps de pareja](https://d2z0o16i8xm8ak.cloudfront.net/d0565585-8817-4688-ae08-576e77a5779e/0e629810-3b08-474d-bb07-f339e774fb7c/quejas-apps-pareja.png?Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9kMnowbzE2aTh4bThhay5jbG91ZGZyb250Lm5ldC9kMDU2NTU4NS04ODE3LTQ2ODgtYWUwOC01NzZlNzdhNTc3OWUvMGU2Mjk4MTAtM2IwOC00NzRkLWJiMDctZjMzOWU3NzRmYjdjL3F1ZWphcy1hcHBzLXBhcmVqYS5wbmc~KiIsIkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTc5MDcxMzg4OH19fV19&Signature=d25cfMniayc-JR9rpDJhO9GbPccYuwb6sLB9UItLRKXIUPMJdxHe6VB9UzLErwl8ZrUPeWDvJXS3elx~Q4td-8k0pjlqLHAVpfGlBvObArT-KjoDdVsL5ML6hJIJ0hkOD1BXuLMTRiI-pCo6cGnO609XTfHuFwg-NNQdtlafTpG3KYeHnzWLXofPM6xgT7hV~EjGKwKhtjjSvczOB5WmCGKIsQ2mDgGY-tGTQxlpFGIDdCDVHxA0iKI4F4F9coyogoh-RIDWVX8JcCmar425zxlcfHLqohHHuMD7BRhSmQFQ-mLSOCP4AVXjc-j-~maf6k12BUm2usx9vDNbO3ryHA__&Key-Pair-Id=K1BF7XGXAIMYNX)

### 3.1 Quejas frecuentes

| Tema | Evidencia | Qué hacer |
|---|---|---|
| **Muro de pago y pruebas gratis "trampa"** | 28% de las quejas en apps de pareja son por el muro de pago y 19% por pruebas que se convierten en suscripción ([unstar.app](https://unstar.app/blog/paired-lasting-love-nudge-evergreen-cupla-couples-apps-ranked-2026)). En Picolo: "decía que tenía periodo de 3 días gratis y me cobró el mismo día" ([Google Play](https://play.google.com/store/apps/details?id=com.picolo.android&hl=es)). Guatafac: "el anuncio que vi en TikTok no decía… los 9 euros mensuales" ([Google Play](https://play.google.com/store/apps/details?id=com.juduku.juduku&hl=es)) | Núcleo gratis y generoso; pago único o pase de fiesta; nada de pruebas con cobro automático |
| **Muro de pago antes de engancharse** | En ROAST APP: "después de 5 roasts intentó hacerme pagar" ([App Store](https://apps.apple.com/us/app/roast-app/id6475994837?see-all=reviews&platform=iphone)). Un desarrollador independiente cuenta que los usuarios que se topan con el pago "antes de crear un vínculo emocional" se van enseguida ([Reddit r/iosdev](https://www.reddit.com/r/iosdev/comments/1tgni66/my_couples_app_is_still_tiny_but_i_finally/)) | Dejar jugar varias partidas completas antes de ofrecer nada de pago |
| **Contenido repetido** | 22% en apps de pareja ([unstar.app](https://unstar.app/blog/paired-lasting-love-nudge-evergreen-cupla-couples-apps-ranked-2026)); "las mismas preguntas una y otra vez" en Heads Up! ([App Store NO](https://apps.apple.com/no/app/heads-up/id623592465?see-all=reviews&platform=iphone)); consignas flojas en Quiplash 3 ([Reddit](https://www.reddit.com/r/jackboxgames/comments/1b5u7nz/why_do_people_dislike_quiplash_3/)) | El contenido lo crean los jugadores (UGC) y la IA solo propone consignas nuevas; las consignas mejor votadas pasan al mazo |
| **Anuncios invasivos** | Basta: "los anuncios cada 1 minuto literal" ([Google Play](https://play.google.com/store/apps/details?id=com.fanatee.stop&hl=es_CL)); Psych!: "después del tercer anuncio de un minuto ya no es divertido" ([App Store](https://apps.apple.com/us/app/psych-outwit-your-friends/id1005765746?see-all=reviews&platform=iphone)) | Sin anuncios en mitad de la partida; como mucho, anuncios con recompensa que el usuario elige ver |
| **Sincronización con la pareja** | 16%: "mi pareja respondió y nunca apareció en mi lado" ([unstar.app](https://unstar.app/blog/paired-lasting-love-nudge-evergreen-cupla-couples-apps-ranked-2026)) | Backend en tiempo real fiable y notificaciones probadas |
| **Traducciones malas** | TOZ: "algunas preguntas o palabras no se entienden" ([Google Play](https://play.google.com/store/apps/details?id=com.blincio.toz&hl=es_US)) | Español nativo con variantes regionales |
| **Control del contenido** | En Picolo piden filtros por categoría, un tutorial y un botón para volver atrás ([App Store](https://apps.apple.com/us/app/picolo-party-game/id1001473964?see-all=reviews)); en Truth or Dare se quejan de contenido "muy sexual" en el modo amigos ([Appslupa](https://appslupa.com/app/truth-or-dare-party-games/id898735886)) | Filtros por tema y por persona, tutorial de 20 s y botón de deshacer |
| **Precio poco justo** | Picolo: "10 $ es un poco caro, pero lo vale" ([App Store](https://apps.apple.com/us/app/picolo-party-game/id1001473964?see-all=reviews)); en Heads Up! critican que se cobra dos veces ([Marlvel](https://marlvel.ai/intel-report/games/heads-up)) | Una sola compra desbloquea la sala entera |

### 3.2 Deseos y peticiones

- **Más atrevimiento, con control:** en Insight piden "¿más preguntas sucias?", "¿humor negro?" y cartas al estilo Cards Against Humanity ([MWM](https://mwm.ai/es/apps/insight-play-with-friends/6471489809)).
- **Preguntas personalizadas y más jugadores**, que Roasted Plus ya vende ([App Store](https://apps.apple.com/es/app/juegos-de-fiesta-roasted/id6475793543?l=ca)).
- **Jugar con desconocidos:** Gartic lo rechaza a propósito por seguridad ([Google Play](https://play.google.com/store/apps/details?id=com.gartic.garticphone&hl=pt_BR)). Para el MVP conviene seguir su ejemplo.
- **Estadísticas al final de la partida**, como "quién engañó a quién", que los usuarios de Psych! valoran ([Google Play](https://play.google.com/store/apps/details?id=com.wb.goog.ellen.psych&hl=en_US)).
- **Contenido alegre y a la vez con fondo:** los usuarios de Paired valoran que alterne lo ligero y lo serio ([JMIR / PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC12001865/)).

---

## Pilar 4. Tendencias, oportunidades y posicionamiento

### 4.1 Tendencias

| Tendencia | Dato | Lectura |
|---|---|---|
| **"Roast me" con IA** | La tendencia de ChatGPT llegó a Argentina: "Lo vi en TikTok, lo hice y te pega duro" ([La Nación](https://www.lanacion.com.ar/tecnologia/que-es-un-roast-me-la-nueva-tendencia-en-chatgpt-nid21082025/)); 395.000 historias de Instagram con "roast my feed" ([Tech.co](https://tech.co/news/stop-chatgpt-roast-your-instagram)) | La gente quiere que la roasteen y compartirlo. Falta la versión social, entre amigos |
| **Freestyle (batallas de insultos con ingenio y jurado)** | Aczino vs Wos: 50 M de visualizaciones ([Red Bull](https://www.redbull.com/es-es/5-batallas-de-gallos-mas-vistas)); FMS 2024 en CDMX: 419.300 espectadores simultáneos en YouTube ([Urban Roosters](https://urbanroosters.news/fms-internacional-2024-hace-historia-en-visualizaciones-por-streaming/)) | El formato duelo + jurado + ingenio ya es cultura de masas en español |
| **Roast televisivo en español** | Comedy Central produjo "Duelo de Comediantes" en México ([Deadline](https://deadline.com/2018/06/jeff-ross-roast-battle-scores-third-season-on-comedy-central-as-mexico-gets-local-version-1202409454/)); roasts en España ([El Periódico](https://www.elperiodico.com/es/ocio-y-cultura/20231103/roast-divierte-ver-mundo-insulta-cruilla-94128012)) | El formato es conocido y aceptado |
| **Culturas locales de burla** | Carrilla: "si no te dan carrilla, no te quieren" ([Learn Mexican Slang](https://learnmexicanslang.com/glossary/carrilla)); albur como duelo verbal con ganador ([Wikipedia](https://es.wikipedia.org/wiki/Albur_(M%C3%A9xico))) | Posibles "modos regionales" y vocabulario propio |
| **WhatsApp como infraestructura** | Unos 420 M de usuarios en Latinoamérica; el 66% comparte memes como forma de conexión emocional ([Tour Innovación](https://www.tourinnovacion.cl/transformacion-digital/america-latina-ya-no-atiende-llamadas-como-whatsapp-se-convirtio-en-la-infraestructura-social-de-la-region/)) | El canal de distribución natural |
| **Android domina** | 76,85% de cuota en Sudamérica, agosto de 2026 ([StatCounter](https://gs.statcounter.com/os-market-share/mobile/south-america)); 372,3 M de jugadores en Latinoamérica ([Newzoo vía News in America](https://newsinamerica.com/pdcc/gente/tecnologia/2025/latinoamerica-el-proximo-gran-mapa-del-gaming-global-372-millones-de-jugadores-y-una-ola-de-nuevos-mercados/)) | Empezar por Android tiene sentido |
| **Los videojuegos como comunidad** | "Los videojuegos han superado a las redes sociales como principal fuente de comunidad de la Gen Z" ([YPulse, 2026](https://www.ypulse.com/report/2026/08/05/friendship-and-community-report-2/)) | Los grupos quieren "eventos" para compartir |
| **Mercado de apps de pareja** | Estimaciones muy dispares: entre 265 M USD ([PMR](https://pmarketresearch.com/worldwide-relationship-apps-for-couples-market-research/)) y 2.530 M USD ([Business Research Insights](https://www.businessresearchinsights.com/market-reports/relationship-apps-for-couples-market-117629)) | Usar solo como señal de crecimiento (~12% anual), no como cifra fiable |

### 4.2 Oportunidades poco cubiertas

1. **Un roast social, en español nativo y con votos del grupo.** Nadie combina Quiplash + carrilla + móvil + WhatsApp.
2. **Modo pareja divertido.** Las apps de pareja son serias y caras; no hay una "pareja que se vacila y lo celebra".
3. **"Compatibilidad de humor" como resultado para compartir:** la meta final que pediste ("son la pareja o el grupo ideal").
4. **Monetización honesta** como ventaja competitiva frente a Picolo, Guatafac o TOZ.
5. **Seguridad diseñada desde el principio** como ventaja de marca frente al recuerdo de NGL y Gas.

### 4.3 Perfiles de usuario prioritarios

| Perfil | Necesidad | Modo |
|---|---|---|
| **Parejas de 20–35 años que se vacilan** | Complicidad y risa diaria, algo "nuestro" | Duelo diario asíncrono + test de química |
| **Grupos de amigos de WhatsApp (4–12)** | Reactivar el grupo y tener un "evento" | Salas en vivo y rondas asíncronas por enlace |
| **Previas y fiestas** | Romper el hielo y reír fuerte | Modo fiesta con pase de noche |
| **Creadores y streamers** | Contenido para directos | Modo espectador con votos del público (como los 10.000 de Quiplash) |
| **Comunidades (Discord, oficinas)** | Integración con humor | Modo "suave" (más adelante) |

### 4.4 Propuesta de posicionamiento

> **"Tírame: el juego de roast de tu grupo. Tíralo con gracia, aguántalo con estilo y descubre si son la pareja (o el grupo) ideal."**

Ángulos diferenciales: (1) el grupo hace de jurado, como en una batalla de gallos; (2) cada jugador elige de qué temas no se habla; (3) un resultado final para compartir ("Química de carrilla: 91%"); (4) sin suscripciones trampa.

---

## MVP completo propuesto

### A. Bucle principal (sesión de 5–8 minutos, ritmo tipo Tetris)

```
1. Foco: la ruleta elige a quién toca roastear  (3 s)
2. Consigna: "Roastea a Ana por cómo conduce"  (tema aprobado por Ana)
3. Escribes en 20 s (o usas el Comodín IA: 3 ideas en tu estilo)
4. Duelo: aparecen 2 roasts enfrentados (sin nombre hasta votar)
5. Voto del grupo: 👍 / 👎 + reacción 🔥 "¡Ardió!" / 💀 "Me mató"
6. Réplica: Ana tiene 15 s para devolverla (puntos dobles)
7. Puntos, combo y subida de barra de nivel → siguiente ronda
```

La velocidad sube en cada nivel (de 20 a 15 y luego a 12 segundos), como la gravedad de Tetris. Es el "una ronda más".

### B. Cómo se cumplen tus dos propósitos

| Propósito | Mecánica |
|---|---|
| **Que el "tóxico" sienta que tiene tu atención** | "Foco del día": la persona roasteada es protagonista, recibe notificaciones ("3 personas te están roasteando"), gana puntos de **Aguante** por reírse (reaccionar 😂 a su propio roast) y tiene **derecho a réplica** con puntos dobles |
| **Objetivo escalable con puntos y niveles** | Puntos por ronda, combos, niveles de jugador, ligas semanales del grupo, packs de consignas que se desbloquean |
| **Identificar a la pareja o grupo ideal** | Índice final de **"Química de carrilla"** + roles del grupo, en una tarjeta para compartir |

### C. Puntuación

- **Puntos del roast** = 10 × % de 👍 + 100 si ganas el duelo.
- **"¡ARDIÓ!"**: si más del 90% vota 👍, +250 puntos (similar al "Quiplash" del original, [Jackbox Wiki](https://jackboxgames.fandom.com/wiki/Quiplash_(series))).
- **Combo:** 3 duelos ganados seguidos multiplican ×1,5.
- **Aguante** (para quien recibe): +50 por reírse de su roast y +100 por una réplica que gane.
- **Penalización:** si la mayoría vota 👎, o alguien pulsa "Me pasé", el roast se retira y quien lo escribió pierde el combo. Así, la agresividad de verdad no compensa.
- **Niveles de jugador:** Novato → Picador → Vacilador → Carrillero → Leyenda del Roast.
- **Niveles de intensidad de la sala:** Suave, Picante y Sin piedad. "Sin piedad" sigue sin permitir grupos protegidos ni vulgaridad extrema.

### D. Modos del MVP

1. **Modo Pareja (asíncrono diario):** un "Duelo del día" en el que ambos roastean al otro sobre un tema que los dos aprueban. Las respuestas se revelan cuando los dos han contestado, como en Paired. Racha con opción de "reparar" y un test mensual de química.
2. **Modo Grupo en vivo (3–12 jugadores):** sala por código, QR o enlace. Los invitados pueden jugar desde el navegador sin instalar nada, con la app como opción mejor.
3. **Modo Grupo por WhatsApp (asíncrono):** una ronda por enlace. Cada amigo vota desde la web y el ranking se publica en el grupo.

### E. Resultado final: "pareja o grupo ideal"

- **Índice de Química (0–100)** para parejas: se calcula con la risa compartida (ambos 👍 o 😂 en la misma ronda, inspirado en [Kurtz y Algoe](https://pmc.ncbi.nlm.nih.gov/articles/PMC4779443/)), el equilibrio entre dar y recibir, el aguante mutuo y la tasa de "Me pasé" (que resta).
- **Perfil de humor** con un test ligero inspirado en los estilos de Martin (afiliativo, agresivo, etc.), presentado como juego y no como diagnóstico ([PsyToolkit HSQ](https://www.psytoolkit.org/survey-library/humor-hsq.html)).
- **Roles del grupo:** "El que la arma", "El que aguanta todo", "El juez", "El de las réplicas" y "El que se pica".
- **Tarjeta para compartir** con una cuadrícula de emojis (🔥🔥💀😂👍), del estilo "Pareja Tóxica Certificada™ — 91% de química".

### F. Seguridad desde el diseño

| Capa | Implementación |
|---|---|
| Edad | 18+ en el lanzamiento, con filtro de edad neutral (sin sugerir la respuesta "correcta") y sin dirigirse a menores |
| Consentimiento | "Acepto que me roasteen" + lista de temas vetados por persona (físico, familia, ex, peso, dinero, etc.) |
| Sin anonimato | Cada roast va firmado; solo salas privadas por invitación, sin feed público en el MVP |
| Moderación en capas | 1) Lista de palabras en español con variantes regionales; 2) moderación de OpenAI, gratuita ([OpenAI](https://openai.com/index/upgrading-the-moderation-api-with-our-new-multimodal-moderation-model/)); 3) un LLM que juzga si el roast es "benigno" o "hiriente" solo en los casos dudosos; 4) cola de revisión humana para denuncias |
| Controles exigidos por Google Play | Términos de uso aceptados antes de jugar, denunciar contenido o usuario, bloquear, expulsar de la sala ([Google Play](https://support.google.com/googleplay/android-developer/answer/9876937?hl=en)) |
| Fotos y voz | Roasts con foto solo de uno mismo o con consentimiento; nada de clonación de voz ([El País](https://elpais.com/sociedad/2026-07-07/el-consejo-de-ministro-aprueba-la-nueva-ley-del-derecho-al-honor-que-protegera-de-los-deepfakes.html)) |
| Monetización | Nada que premie con dinero la agresividad (por ejemplo, no vender "roasts nucleares") |

### G. IA (con medida)

- **Comodín IA:** 3 ideas por ronda, con límite de uso, en estilos como "abuelita sarcástica", "narrador de fútbol", "freestyle" o "telenovela".
- **Juez IA:** comenta los resultados con gracia y ayuda a moderar.
- **Contra la repetición:** consignas curadas por guionistas y cómicos hispanos, y las mejores consignas votadas por la comunidad pasan al mazo global (solo la consigna, nunca el roast personal).

### H. Monetización honesta

| Opción | Precio orientativo | Justificación |
|---|---|---|
| Núcleo gratis | 0 | Modos Pareja y Grupo con nivel Suave y Picante |
| **Pase de fiesta 24 h** | ~0,99 USD / 0,99 € | Roasted demuestra que se paga por una noche ([App Store](https://apps.apple.com/es/app/juegos-de-fiesta-roasted/id6475793543?l=ca)) |
| **Tírame+ de por vida** | ~4,99–7,99 USD con precio adaptado a cada país | Responde a la queja n.º 1; el anfitrión desbloquea la sala para todos |
| Packs temáticos y cosméticos | 0,99–1,99 | Estilos, marcos y sonidos de "¡Ardió!" |
| Anuncios con recompensa opcionales | — | Nunca en mitad de una partida |

### I. Arquitectura técnica recomendada

Encaja con tu perfil en JavaScript, Node, React y Supabase:

| Componente | Recomendación |
|---|---|
| App Android | **React Native con Expo** (reutiliza tu JS/React). La alternativa nativa sería Kotlin + Jetpack Compose |
| Invitados web | Cliente web ligero (React) para unirse por enlace sin instalar |
| Backend en tiempo real | **Supabase** (Postgres, Auth, Realtime para salas, Edge Functions) o Firebase |
| Enlaces e invitaciones | Android App Links con enlaces verificados ([Android Developers](https://developer.android.com/training/app-links)) + Sharesheet nativa ([Android Developers](https://developer.android.com/develop/ui/compose/sharing/send)), con WhatsApp como primera opción |
| Moderación | Endpoint de moderación de OpenAI + LLM vía OpenRouter solo para los casos dudosos |
| Notificaciones | Expo Notifications o FCM ("Te están roasteando", "Tu pareja ya respondió") |
| Pagos | Google Play Billing (vía RevenueCat, por ejemplo) |
| Analítica | PostHog o Firebase Analytics, con eventos de ronda, voto, "Me pasé" y compartir |

Modelo de datos básico: `users`, `couples/groups`, `rooms`, `rounds`, `roasts` (autor, destinatario, texto, estado de moderación), `votes`, `reactions`, `vetoed_topics`, `scores`, `reports`.

### J. Métricas objetivo

| Métrica | Objetivo | Referencia |
|---|---|---|
| D1 | ≥ 30% | Cuartil superior: 26,5–27,7% ([PlayGenus](https://playgenus.com/docs/guides/good-d7-retention)) |
| D7 | ≥ 8% | Cuartil superior en Android |
| Coeficiente K | ≥ 0,5 al principio | Cada partida invita por sí misma |
| Salas con 3 o más jugadores | ≥ 60% | Mide la salud del modo grupo |
| Parejas vinculadas | ≥ 40% de las altas en modo pareja | El desarrollador independiente citado tenía un 28% ([Reddit](https://www.reddit.com/r/iosdev/comments/1tgni66/my_couples_app_is_still_tiny_but_i_finally/)) |
| Tasa de "Me pasé" | < 3% de los roasts | Indicador de seguridad |
| Tarjetas compartidas | ≥ 1 por cada 3 partidas | Indicador viral |

### K. Plan por fases

1. **Semanas 1–2, validación:** prototipo con un bot de WhatsApp o Discord y 10 grupos reales; medir risas, votos y "Me pasé".
2. **Semanas 3–10, MVP:** modos Pareja y Grupo en vivo, moderación en capas, tarjeta para compartir y pase de fiesta.
3. **Semanas 11–14, beta cerrada** en México, Colombia, Argentina y España, con ajuste de consignas regionales.
4. **Después del lanzamiento:** modo por WhatsApp asíncrono, modo espectador para streamers, ligas y temporadas.

### L. Riesgos principales

| Riesgo | Mitigación |
|---|---|
| Que se use para acoso real | Consentimiento, temas vetados, firma, salas privadas, "Me pasé", moderación y bloqueo |
| Retirada de Google Play | Cumplir la política de contenido de usuarios y no posicionarse como "insultos" sino como "roast con gracia" en la ficha |
| Humor repetitivo | Contenido de los usuarios + consignas curadas + estilos |
| Choque cultural entre países | Modos regionales y moderación entrenada con jerga local |
| Bulos o crisis de reputación (caso Gas) | Transparencia, página de seguridad pública, sin anonimato y sin menores |

---

## Limitaciones de esta investigación

- Las cifras de descargas proceden de rangos públicos de Google Play; las de ingresos son estimaciones de terceros.
- Los porcentajes de quejas de apps de pareja vienen de un análisis agregado de unstar.app, no de una muestra propia.
- Las estimaciones de tamaño del mercado de apps de pareja difieren hasta 10 veces según la consultora, así que no son fiables como cifra absoluta.
- La ley española de menores en entornos digitales seguía en tramitación en las fuentes consultadas.
- Casi toda la investigación académica sobre humor y burla es anglosajona. Conviene validar los hallazgos con pruebas propias en grupos hispanohablantes.
