# Sistema de Gestión de Campañas para Redes Sociales

## Descripción

Un sistema modular para crear, gestionar y generar contenido optimizado para redes sociales. Separado del núcleo principal de SUITORG para permitir crecimiento independiente.

## Arquitectura

```
Campañas/
├── config/          # Configuración de prompts y formatos
├── database/        # Base de datos local (JSON)
├── generators/      # Módulos de generación de contenido
├── output/         # Archivos generados
└── index.html       # Interfaz web
```

## Características

### 🎯 Formatos Soportados
- **Reels**: Videos de 15-30 segundos con estructura técnica
- **Posts**: Imágenes para redes sociales
- **Stories**: Contenido interactivo para Instagram
- **Banners**: Imágenes promocionales

### 🚀 Proceso de Trabajo
1. **Alimentación**: Formulario web para crear campañas
2. **Configuración**: Plantillas con prompts optimizados
3. **Generación**: Scripts estructurados en JSON
4. **Producción**: Assets visuales según formato

## Uso

### 1. Crear Campaña
- Llenar formulario con datos básicos
- Seleccionar formato y plantilla
- Configurar número de elementos

### 2. Generar Contenido
- Sistema aplica prompt dinámico
- Variables reemplazadas automáticamente
- Salida en formato JSON estructurado

### 3. Producción de Assets
- Generación de imágenes/videos
- Optimización para web
- Metadata completa

## Integración con Google Sheets

El sistema puede conectarse a Google Sheets mediante:

```javascript
// Ejemplo de integración
const { GoogleSpreadsheet } = require('google-spreadsheet');

async function cargarDesdeSheet() {
  const doc = new GoogleSpreadsheet('ID_DE_SHEET');
  await doc.useServiceAccountAuth(credentials);
  await doc.loadInfo();
  
  const sheet = doc.sheetsByTitle['Campañas'];
  const rows = await sheet.getRows();
  
  return rows;
}
```

## Optimización de Tokens

### Entrada
- Solo campos necesarios
- Variables dinámicas reemplazadas
- Cache de prompts comunes

### Salida
- JSON estructurado y compacto
- Metadata completa
- Referencias a assets

## Ejemplo de Prompt Dinámico

```json
{
  "prompt_template": "Actúa como experto en comunicación técnica. Diseña un carrusel de [Número] láminas sobre [Tema].",
  "variables": {
    "Número": "8",
    "Tema": "Comunicación Técnica"
  }
}
```

## Ejemplo de Salida JSON

```json
{
  "id": "camp_001",
  "laminas": [
    {
      "id": 1,
      "titulo": "Error Común",
      "cuerpo": "Usamos jerga técnica sin contexto",
      "visual": "Diagrama de brecha",
      "duracion": 3
    }
  ]
}
```

## Próximos Pasos

1. Integración con APIs de generación de imágenes
2. Sistema de templates avanzados
3. Programación de publicaciones
4. Analytics integrado
5. Conector con Google Sheets

## Notas de Seguridad

- No almacena datos sensibles
- Configuración externa
- Archivos generados en local
- Sin dependencia del core principal