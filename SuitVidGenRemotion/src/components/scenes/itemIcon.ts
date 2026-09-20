// El ícono por-tarjeta de los estilos "lista" (Ranking en Tarjetas, Cosmic
// Listicle Dorado, Pizarra Minimalista, chips de Diario Ilustrado) se dibuja
// como texto plano, sin pasar por Iconify (ver CLAUDE.md: "fuera de alcance
// a propósito"). El prompt le pide a la IA "un emoji relacionado", pero en
// vivo se vio que a veces escribe la palabra en vez del glifo (p.ej.
// "checkmark", "cancel", ":star:") — un emoji real siempre son 1-2 unidades
// UTF-16, así que cualquier cosa más larga es texto, no un glifo, y se
// descarta a favor del número de la fila para no mostrar texto roto en pantalla.
export function itemBadgeText(icono: string | undefined, index: number): string {
    if (icono && icono.length <= 4) return icono;
    return String(index + 1);
}
