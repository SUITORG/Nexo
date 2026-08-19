---
name: AmbuRide
colors:
  surface: '#f9f9f9'
  surface-dim: '#dadada'
  surface-bright: '#f9f9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f3'
  surface-container: '#eeeeee'
  surface-container-high: '#e8e8e8'
  surface-container-highest: '#e2e2e2'
  on-surface: '#1a1c1c'
  on-surface-variant: '#5b403d'
  inverse-surface: '#2f3131'
  inverse-on-surface: '#f1f1f1'
  outline: '#8f6f6c'
  outline-variant: '#e4beba'
  surface-tint: '#ba1a20'
  primary: '#af101a'
  on-primary: '#ffffff'
  primary-container: '#d32f2f'
  on-primary-container: '#fff2f0'
  inverse-primary: '#ffb3ac'
  secondary: '#005faf'
  on-secondary: '#ffffff'
  secondary-container: '#54a0fe'
  on-secondary-container: '#003567'
  tertiary: '#016619'
  on-tertiary: '#ffffff'
  tertiary-container: '#298030'
  on-tertiary-container: '#daffd1'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdad6'
  primary-fixed-dim: '#ffb3ac'
  on-primary-fixed: '#410003'
  on-primary-fixed-variant: '#930010'
  secondary-fixed: '#d4e3ff'
  secondary-fixed-dim: '#a5c8ff'
  on-secondary-fixed: '#001c3a'
  on-secondary-fixed-variant: '#004786'
  tertiary-fixed: '#9df898'
  tertiary-fixed-dim: '#82db7e'
  on-tertiary-fixed: '#002204'
  on-tertiary-fixed-variant: '#005312'
  background: '#f9f9f9'
  on-background: '#1a1c1c'
  surface-variant: '#e2e2e2'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 26px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-bold:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  mono-data:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 24px
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 64px
---

## Brand & Style
The design system is engineered for high-stakes healthcare and emergency logistics. The brand personality is authoritative, decisive, and calming. It operates under a "Modern Corporate" aesthetic with "High-Contrast" functional overrides to ensure accessibility in high-glare or low-light environments.

The UI avoids decorative flourishes in favor of utility and speed. The emotional response should be one of immediate confidence—users must feel that the interface is as responsive as the emergency services it facilitates. Motion should be minimal and purposeful, limited to state transitions that confirm user actions.

## Colors
This design system utilizes a high-contrast palette to differentiate between levels of urgency and service types. 

- **Primary (Emergency Red):** Reserved strictly for critical alerts, emergency requests, and destructive actions.
- **Secondary (Trust Blue):** Used for standard navigation, primary actions that are not life-critical, and branding.
- **Tertiary (Safety Green):** Applied to success states and "System Ready" indicators.
- **Neutral:** A range of cool grays used to reduce eye strain and provide a clean backdrop for critical data.

**Status Badges:**
- **Basic:** Utilizes Secondary Blue to signal standard care.
- **Advanced:** Utilizes Primary Red to signal high-intensity care requirements.
- **Transfer:** Utilizes a Deep Purple (#7B1FA2) to distinguish non-emergency movement from active rescues.

## Typography
Inter is selected for its exceptional legibility and tall x-height, which remains readable even on low-resolution mobile displays used by field technicians.

- **Headlines:** Use Bold weights to establish immediate hierarchy.
- **Body:** Standardized at 16px to ensure readability for all age groups and vision capabilities.
- **Numeric Data:** For timestamps or coordinates, use the `mono-data` role to ensure characters align vertically for quick scanning.
- **Accessibility:** Never use a font size below 12px for critical information.

## Layout & Spacing
The layout follows an **8px grid system** for consistent rhythm. 

- **Mobile:** Uses a single-column fluid layout with 16px side margins. Tap targets are prioritized with a minimum height of 48px.
- **Desktop:** Employs a 12-column fixed grid with a 1200px max-width to keep information dense but organized.
- **Touch Areas:** In emergency contexts, spacing between interactive elements is increased to `lg` (24px) to prevent accidental taps (fat-finger errors) during high-stress movement.

## Elevation & Depth
This design system uses **Tonal Layers** and **Low-Contrast Outlines** rather than heavy shadows. This minimizes visual clutter and ensures the UI feels "flat" and fast-loading.

- **Level 0 (Surface):** The base background (#F5F5F5).
- **Level 1 (Cards):** Pure White (#FFFFFF) with a 1px solid border (#E0E0E0). No shadow.
- **Level 2 (Active/Floating):** Used for active input fields or modals. Includes a soft, tight shadow (0px 2px 4px rgba(0,0,0,0.05)) to distinguish from the background.
- **Urgency Elevation:** Critical alerts do not use depth; they use high-contrast color fills (Primary Red) to demand attention through hue rather than perceived height.

## Shapes
A **Soft** approach is used for this design system. 

- **Standard Elements:** 0.25rem (4px) corner radius. This provides a professional, geometric look that feels more modern than sharp edges but more serious than highly rounded shapes.
- **Large Components:** Cards and containers use 0.5rem (8px) for `rounded-lg`.
- **Urgent Buttons:** Maintain the 4px radius; do not use pill shapes for primary actions as sharp, defined corners are associated with precision and efficiency.

## Components

### Buttons
- **Urgent Action:** Full-width, Primary Red background, white text, 16px padding. Used for "Dispatch" or "Confirm Emergency."
- **Standard Action:** Trust Blue background, white text. Used for "Save" or "Next."
- **Ghost/Secondary:** Transparent background with a 1px Blue or Gray border. Used for "Cancel" or "Back."

### Status Badges
- **Structure:** Small, caps-lock text with a light-tint background of the status color and a dark-tint text of the same hue.
- **Basic:** Blue tint.
- **Advanced:** Red tint.
- **Transfer:** Purple tint.

### Input Fields (Phone/Registration)
- **Visuals:** 1px solid border (#BDBDBD) that thickens and changes to Trust Blue on focus.
- **Helper Text:** Positioned directly below the field. Error states use Primary Red for both text and border.
- **Input Size:** Large (56px height) for easy tapping on mobile devices during registration.

### Cards
- White background, 1px neutral border. Headers within cards should have a subtle gray bottom border to separate the title from the content.

### Emergency Ticker
- A persistent top-bar component that flashes Primary Red for unassigned high-priority cases.