---
description: Sube la nueva versión a la web oficial
---

Este workflow despliega los cambios guardados hacia el repositorio central y activa el despliegue automático a producción.

1. Asegurar que los cambios locales estén guardados:
> **Nota:** Ejecuta primero `/1commit` si aún ves la letra "M" en tus archivos.

2. Enviar cambios al repositorio de GitHub (Rama main):
// turbo
`git push origin main`

3. Confirmar finalización:
Informa al usuario que el despliegue ha sido enviado y que la web oficial (Vercel) se actualizará en unos instantes.
