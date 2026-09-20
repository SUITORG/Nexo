# SuitMaterial

Material propio del usuario (clips de acompañamiento, capturas de pantalla, logos) organizado por empresa. Puede estar vacía — no bloquea nada.

## Estructura

```
SuitMaterial/
  <id_empresa>/
    clips/      # video corto sin sonido, 2-4s, para superponer sobre la voz
    capturas/   # screenshots de webs/herramientas mencionadas
    logos/      # logos propios (si no aplica el catálogo simple-icons)
```

`<id_empresa>` es el mismo identificador que usa `Config_Empresas` en el Sheet.

## Regla de prioridad

Antes de buscar en Pexels/Unsplash/Wikimedia Commons o generar con IA, siempre se revisa primero si hay algo usable en `SuitMaterial/<id_empresa>/` para esa escena.

## Qué NO hace esta carpeta sola

No archiva nada automáticamente. Lo que se descarga de una fuente externa (Pexels/Unsplash/Wikimedia) durante una generación normal sigue sin guardarse aquí — solo se guarda si el usuario lo pide explícitamente o arrastra el archivo él mismo.

## Video real subido aquí

Si hay un `.mp4`/`.mov` en la carpeta de una empresa, antes de proponer cualquier edición se mira entero (frames + transcripción con Whisper) para entender qué se cuenta, el orden, cuánto dura cada parte, y dónde la persona se traba o repite algo.
