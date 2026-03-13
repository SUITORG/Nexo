# RESPONSIVE-UI STANDARD
> Versión 1.0 | Proyecto: Personal Brand / Multi-proyecto
> Aplicar en TODOS los componentes visuales de cualquier proyecto.

---

## 1. BREAKPOINTS BASE

| Nombre   | Rango px         | Uso típico         |
|----------|------------------|--------------------|
| Mobile   | 320px – 767px    | Smartphones        |
| Tablet   | 768px – 1023px   | iPad, tablets      |
| Laptop   | 1024px – 1439px  | Laptops estándar   |
| Desktop  | 1440px+          | Monitores grandes  |

---

## 2. LAYOUT

- Usar **CSS Grid o Flexbox** siempre. Nunca posicionamiento absoluto para estructuras principales.
- Columnas por breakpoint:
  - Mobile: 1 columna
  - Tablet: 2 columnas
  - Laptop: 3 columnas
  - Desktop: 3–4 columnas
- Gap entre columnas:
  - Mobile: 16px
  - Tablet: 24px
  - Desktop: 32px
- Padding de contenedor principal:
  ```css
  padding-inline: clamp(16px, 4vw, 64px);
  ```
