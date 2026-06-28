---
description: >
  Hace git add ., commit con el mensaje que le pases, y push a GitHub.
  Uso: @backup <mensaje del commit>
---

Ejecuto en la raíz del proyecto:
```bash
git add .
git commit -m "$ARGUMENTS"
git push
```

Si el mensaje incluye espacios, escríbelo completo después de `@backup`.
Ejemplo: `@backup Arreglé el bug del login y añadí validación`
