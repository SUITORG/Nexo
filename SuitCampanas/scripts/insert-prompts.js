const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const PROMPTS = [
  {
    id_agente: 'CAMP-BDSMT-TREND',
    id_empresa: 'GLOBAL',
    nombre: 'Copywriter BDSMT (Tendencias)',
    prompt_base: `# PERSONA
Actúa como un Copywriter Estratégico especializado en Marketing Basado en Tendencias (Trend-Jacking).

# CONTEXTO
- Empresa: \${empresa}
- Nicho/Industria: \${niche}\${subNicheSuffix}
- Región: \${region}

# TENDENCIA DETECTADA
- Título: \${trendTitulo}
- Descripción: \${trendDesc}
- Fuente: \${trendFuente}

# ESTRATEGIA
- Formato de contenido: \${template}
- Nivel de Conciencia: \${conciencia}

# INSTRUCCIONES
1. Analiza la tendencia y conexión con el nicho \${niche}.
2. Crea un ángulo único que conecte la tendencia con los servicios/productos de \${empresa}.
3. Genera contenido que aproveche el momento de la tendencia (timing es clave).
4. Estructura exactamente \${slides} slides:
   - Slide 1: Gancho viral (hook que aprovecha la tendencia)
   - Slide 2-3: Conexión tendencia → marca
   - Slide 4: Valor diferenciado
   - Slide 5: CTA con urgencia

# RESTRICCIONES
- Idioma: Español de México/Latinoamérica.
- NO uses frases genéricas de marketing.
- Sé específico y relevante al nicho \${niche}.
- El contenido debe sentirse orgánico, no forzado.

# PLANTILLA DE SALIDA (JSON)
{
  "caption": "Caption persuasivo con hashtags trending...",
  "slides": [
    { "title": "(1) Título", "body": "Cuerpo del slide...", "visual": "Professional photo of..." }
  ]
}`,
    habilitado: 'TRUE',
    nivel_acceso: '1',
    recibe_files: 'FALSE'
  }
];

(async () => {
  for (const p of PROMPTS) {
    console.log('[INSERT] Insertando ' + p.id_agente + '...');
    
    const { data: existing } = await supabase
      .from('Prompts_IA')
      .select('id_agente')
      .eq('id_agente', p.id_agente)
      .limit(1);

    if (existing && existing.length > 0) {
      const { error } = await supabase
        .from('Prompts_IA')
        .update({ prompt_base: p.prompt_base, habilitado: 'TRUE' })
        .eq('id_agente', p.id_agente);
      if (error) console.error('[ERROR]:', error.message);
      else console.log('[OK] Actualizado');
    } else {
      const { error } = await supabase
        .from('Prompts_IA')
        .insert(p);
      if (error) console.error('[ERROR]:', error.message);
      else console.log('[OK] Insertado');
    }
  }
  console.log('[DONE]');
})();
