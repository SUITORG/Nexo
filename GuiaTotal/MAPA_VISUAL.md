# MAPA_VISUAL.md — Versión gráfica de la Guía Total

> **Qué es:** vista derivada de [`MAPA.md`](MAPA.md) (el textual manda). 3 diagramas Mermaid:
> ciclo de vida completo · secuencia de la cadena con switches · grafo de dependencias.
> **Cuándo regenerar:** cuando cambia la estructura/flujo de un nodo de MAPA (misma regla de cierre).
> **Dónde se renderiza:** preview de VSCode y GitHub (extensiones Mermaid).

---

## 1. Ciclo de vida completo (con gates de aprobación)

```mermaid
flowchart TD
    idea["1 · Idea / Validación<br/>⚡ analista-proy → ⚡ panel-juzgador"] --> tax["2 · Taxonomía<br/>⚡ guia-total taxonomia"]
    tax --> ident["3 · Identidad Corporativa<br/>⚡ guia-total identidad"]
    ident --> alta{"¿Alta de<br/>empresa?"}

    alta -->|"a mano"| reg["1.5 · ⚡ empresa-registro<br/>Drive cte&lt;id&gt; + fotoagente + copy + identidad"]
    alta -->|"formulario"| masc["1.8 · ⚡ empresa-mascara<br/>bloque A obligatorios · switches C · barra de avance"]

    masc -->|"switch: empresa_registro"| reg
    masc -->|"switch: clusters"| clus["1.6 · ⚡ clusters-seo<br/>≤9 → Config_SEO + fotos Drive"]
    reg --> clus
    clus -->|"switch: paginas"| pag["1.7 · ⚡ paginas-seo<br/>→ Config_Paginas (3 JSON)"]
    masc -->|"switch: paginas"| pag
    pag --> brief["⚡ brief-engine<br/>→ Config_Empresas.logo_url"]
    masc -->|"switch: brief"| brief
    brief --> activos["⚡ lapvtfu<br/>→ cte&lt;id&gt;/_activos"]
    masc -->|"switch: activos"| activos

    activos --> constr["4 · Construcción<br/>⚡ ciclo F0→F7"]
    constr --> manuales["5 · Manuales<br/>GuiaTotal/manuales/&lt;id&gt;/"]
    manuales --> mant["6 · Mantenimiento<br/>⚡ guia-total → PENDIENTES + MAPA"]
    mant --> prompt["7 · Prompt Origen"]
    prompt --> idx["8 · Índice de Funciones<br/>node scripts/generate-index.js"]
    idx --> aud["9 · Auditoría<br/>⚡ auditoria → docs/00-16"]
    aud -.->|"mejoras / siguiente pasada"| mant

    sync["⚡ syncToSupabase → espejo Supabase<br>(PKs idempotentes)"] -.-> clus
    sync -.-> pag
    sync -.-> reg

    style masc fill:#e1f5fe,stroke:#0288d1
    style reg fill:#e8f5e9,stroke:#2e7d32
    style clus fill:#fff3e0,stroke:#ef6c00
    style pag fill:#fff3e0,stroke:#ef6c00
    style sync fill:#f3e5f5,stroke:#7b1fa2
```

**Leyenda:** rombo `{…}` = gate humano · punteado = disparo condicional/retroalimentación ·
`switch …` = solo ocurre si el eslabón está en `auto` o el usuario aprueba en `preguntar`.

---

## 2. Secuencia de la cadena — `empresa-mascara` con switches

```mermaid
sequenceDiagram
    participant U as Usuario
    participant M as ⚡ empresa-mascara
    participant GS as Google Sheets (maestro)
    participant SP as Supabase (espejo)
    participant C as Cadena (skills)

    U->>M: "máscara HMP"  (o "máscara auto total HMP")
    M->>M: valida bloque A — faltantes → ≤3 preguntas
    M-->>U: [▓░░░░░░░░░] 1/7 · validando
    M->>GS: updateRow Config_Empresas (solo A + D)
    M->>SP: syncToSupabase + verificación
    M-->>U: [▓▓▓░░░░░░░] 3/7 · espejo OK

    loop cada eslabón con switch ≠ skip
        alt mode = auto
            M->>C: ejecuta eslabón sin preguntar
        else mode = preguntar (default)
            M->>U: preview 2-3 líneas + ¿creo X? [s/n]
            U-->>M: sí
            M->>C: ejecuta eslabón
        end
        C-->>U: [▓▓▓▓▓▓░░░░] n/7 · eslabón listo
    end

    Note over M,C: orden: alta → empresa_registro → clusters → paginas → brief → activos
    M-->>U: [▓▓▓▓▓▓▓▓▓▓] 100% → ↪ CIERRE (PENDIENTES + MAPA + 3 líneas)
```

---

## 3. Dependencias entre skills

```mermaid
flowchart LR
    GT["⚡ guia-total"] --> AP["analista-proy"]
    GT --> PJ["panel-juzgador"]
    GT --> CY["ciclo F0→F7"]
    GT --> BE["brief-engine"]
    GT --> AU["auditoria"]
    GT --> ER["empresa-registro"]

    MAS["⚡ empresa-mascara"] --> ER
    MAS --> CS["clusters-seo"]
    MAS --> PS["paginas-seo"]
    MAS --> BE
    MAS --> LV["lapvtfu (activos)"]

    ER --> GM["guia-total identidad"]
    ER --> LP["landing-page-copywriter"]
    ER --> CS
    CS --> PS
    BE --> LV

    style MAS fill:#e1f5fe,stroke:#0288d1
    style GT fill:#ede7f6,stroke:#4527a0
```

---

*Regenerar con cualquier pasada de `guia-total` si el MAPA textual cambió de estructura
(ver cierre común en MAPA.md). Última sincronización: 2026-09-29 (§1.8 + §11 fichas).*
