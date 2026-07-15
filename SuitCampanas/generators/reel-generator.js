const fs = require('fs');
const path = require('path');

class ReelGenerator {
  constructor() {
    this.configPath = path.join(__dirname, '../config/prompts.json');
    this.campañasPath = path.join(__dirname, '../database/campañas.json');
    this.outputPath = path.join(__dirname, '../output/reels');
  }

  // Cargar configuración y campañas
  async loadData() {
    try {
      const configData = fs.readFileSync(this.configPath, 'utf8');
      const campañasData = fs.readFileSync(this.campañasPath, 'utf8');

      return {
        config: JSON.parse(configData),
        campañas: JSON.parse(campañasData)
      };
    } catch (error) {
      console.error('Error al cargar datos:', error);
      throw error;
    }
  }

  // Reemplazar variables en el prompt
  replaceVariables(prompt, variables) {
    let processedPrompt = prompt;

    // Reemplazar variables básicas
    const replacements = {
      '[Número]': variables.numero_laminas || '5',
      '[Tema]': variables.tema || 'Comunicación',
      '[Público]': variables.publico || 'Profesionales'
    };

    Object.entries(replacements).forEach(([key, value]) => {
      processedPrompt = processedPrompt.replace(new RegExp(key, 'g'), value);
    });

    return processedPrompt;
  }

  // Generar guión en formato JSON optimizado
  async generarScript(campañaId) {
    try {
      const { config, campañas } = await this.loadData();
      const campaña = campañas.campañas.find(c => c.id === campañaId);

      if (!campaña) {
        throw new Error(`Campaña ${campañaId} no encontrada`);
      }

      const promptTemplate = config[campaña.configuracion.plantilla];
      const processedPrompt = this.replaceVariables(promptTemplate, campaña.configuracion);

      // Aquí iría la llamada a la API de IA
      // Por ahora, generamos un ejemplo estructurado
      const script = {
        id: campaña.id,
        empresa: campaña.empresa,
        tema: campaña.tema,
        laminas: this.generarEjemploLaminas(campaña.configuracion.numero_laminas),
        metadata: {
          generado_el: new Date().toISOString(),
          formato: 'reel',
          duracion_estimada: `${campaña.configuracion.numero_laminas * 3} segundos`
        }
      };

      // Guardar script generado
      const outputPath = path.join(this.outputPath, `${campañaId}_script.json`);
      fs.writeFileSync(outputPath, JSON.stringify(script, null, 2));

      console.log(`✅ Script generado para ${campañaId}`);
      return script;

    } catch (error) {
      console.error('Error al generar script:', error);
      throw error;
    }
  }

  // Generar ejemplo de láminas (simulado)
  generarEjemploLaminas(numero) {
    const laminas = [];

    for (let i = 1; i <= numero; i++) {
      laminas.push({
        id: i,
        titulo: this.generarTitulo(i),
        cuerpo: this.generarContenido(i),
        visual: this.generarSugerenciaVisual(i),
        duracion: 3
      });
    }

    return laminas;
  }

  // Generar títulos concisos
  generar(numero) {
    const titulos = [
      "Error Común", "El Problema", "Por Qué Falla", "Analogía",
      "Solución Proceso", "Implementación", "Beneficios", "CTA"
    ];
    return titulos[numero - 1] || `Lámina ${numero}`;
  }

  // Generar contenido breve
  generarContenido(numero) {
    const contenidos = [
      "Usamos jerga técnica sin contexto. ¿El mensaje llega?",
      "La brecha entre conocimiento y comprensión es real.",
      "El problema no es la complejidad, es la ausencia de claridad.",
      "Imagina construir un puente sin cimientos.",
      "La solución está en el proceso, no en la herramienta.",
      "Implementación gradual con métricas claras.",
      "Beneficios tangibles vs. promesas vacías.",
      "Debate técnico: ¿Qué piensas de este enfoque?"
    ];
    return contenidos[numero - 1] || "Contenido placeholder";
  }

  // Generar sugerencia visual
  generarSugerenciaVisual(numero) {
    const visuales = [
      "Diagrama de brecha", "Icono de confusión", "Puente colapsado",
      "Cimientos sólidos", "Flujo de proceso", "Checklist", "Gráfico de resultados", "Ícono de discusión"
    ];
    return visuales[numero - 1] || "Visual placeholder";
  }

  // Actualizar estado de campaña
  async actualizarEstado(campañaId, estado) {
    try {
      const campañasData = fs.readFileSync(this.campañasPath, 'utf8');
      const campañas = JSON.parse(campañasData);

      const campaña = campañas.campañas.find(c => c.id === campañaId);
      if (campaña) {
        campaña.estado = estado;
        campaña.contenido_generado = true;
        campañas.metadatos.ultima_actualizacion = new Date().toISOString();

        fs.writeFileSync(this.campañasPath, JSON.stringify(campañas, null, 2));
        console.log(`✅ Estado actualizado para ${campañaId}: ${estado}`);
      }
    } catch (error) {
      console.error('Error al actualizar estado:', error);
      throw error;
    }
  }
}

module.exports = ReelGenerator;