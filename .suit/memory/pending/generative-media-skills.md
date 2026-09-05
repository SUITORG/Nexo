# Generative Media Skills — Roadmap

## Estado
Pendiente

## Objetivo
Instalar skills de generación multimedia en opencode para crear imágenes/videos directamente desde el CLI.

## Skills a instalar
- **Generative-Media-Skills** (SamurAIGPT/Generative-Media-Skills)
  - Text-to-image (Flux, Midjourney, etc.)
  - Text-to-video (Kling, Sora, Veo, etc.)
  - Lip sync (9 modelos)
  - Multi-image input (hasta 14 imágenes)

## Comando de instalación
```bash
npx skills add SamurAIGPT/Generative-Media-Skills --all
```

## Dependencia
- API key de [Muapi.ai](https://muapi.ai) (tier gratuito disponible)
- Variable de entorno: `MUAPI_API_KEY`

## Pasos pendientes
1. Crear cuenta en Muapi.ai y obtener API key
2. Exportar `MUAPI_API_KEY` en variable de entorno
3. Ejecutar `npx skills add SamurAIGPT/Generative-Media-Skills --all`
4. Probar generación de imagen desde opencode

## Referencia
- Repo: https://github.com/SamurAIGPT/Generative-Media-Skills
- GUI alternativa: https://github.com/Anil-matcha/Open-Generative-AI
