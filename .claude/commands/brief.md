Genera un Brief de Marketing completo para la empresa con id_empresa: $ARGUMENTS

Lee .suit/skills/domain/brief-engine.yaml y SuitCampanas/BRIEF.MD completos antes de actuar.

Pasos:
1. Lee la empresa de Config_Empresas por id_empresa ($ARGUMENTS)
2. Parsea el Brief existente si lo hay (parseBrief en local-server-node.js)
3. Consulta catálogos Supabase (industrias, nichos) para taxonomía
4. Investiga audiencia, dolores, competidores, RLP vía web search
5. Arma el vector de 20 campos en orden fijo
6. Valida: sin pipes en valores, 20 campos, LAPVTFU con 7 posiciones
7. Muestra preview y pide aprobación
8. Respaldar valor anterior de logo_url
9. Escribe el Brief en Config_Empresas.logo_url vía GAS
10. Guarda brief.json y confianza.json en cte<id>/_brief/ en Drive

Si el primer argumento es `validar`, solo valida el Brief existente sin generar.
Si el primer argumento es `parsear`, solo parsea y muestra el Brief estructurado.
Si el primer argumento es `campos`, muestra los 20 campos del Brief con su orden y fuente.
