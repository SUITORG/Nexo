# -*- coding: utf-8 -*-
"""PDF mínimo de texto SIN dependencias (FPDF/reportlab no están en el entorno).

Sirve solo para el "Análisis de fuentes": una lista de líneas -> PDF 1.4 A4.
Codificación WinAnsi (cp1252), que es la que entienden las fuentes Type1 del PDF;
los símbolos que no existen ahí (✓, ≥, →…) se sustituyen por equivalentes ASCII.

Formato del PDF: catálogo -> páginas -> 2 fuentes -> (página + contenido) por página
-> xref con offsets reales -> trailer. Nada de imágenes ni fuentes incrustadas.
"""
import os

PAG_ANCHO, PAG_ALTO = 595, 842              # A4 en puntos (72 pt = 1 pulgada)
MARGEN_X, Y_ARRIBA, Y_ABAJO = 40, 800, 46
MAX_LINEAS = 72                             # por página (interlínea de 11.3 pt)

# símbolos que no están en WinAnsi -> ASCII (el resto lo resuelve cp1252)
_REEMPLAZOS = (
    ('\u2713', 'OK'), ('\u2714', 'OK'),      # ✓ ✔
    ('\u2265', '>='), ('\u2264', '<='),      # ≥ ≤
    ('\u2192', '->'), ('\u2190', '<-'),      # → ←
    ('\u25b2', '^'), ('\u25bc', 'v'),        # ▲ ▼
    ('\u2026', '...'),                        # …
)


def _pdf_str(s):
    """Cadena PDF: (texto) escapada y en cp1252."""
    t = str(s)
    for a, b in _REEMPLAZOS:
        t = t.replace(a, b)
    t = t.replace('\t', '    ')
    datos = t.encode('cp1252', errors='replace')
    return b'(' + datos.replace(b'\\', b'\\\\').replace(b'(', b'\\(').replace(b')', b'\\)') + b')'


def _contenido(lineas, pagina, total):
    """Content stream de una página: cada línea con su propio BT/Tm/Tj/ET."""
    partes = []
    y = Y_ARRIBA
    for i, ln in enumerate(lineas):
        if pagina == 1 and i == 0:
            cuerpo = b'BT /F1 12 Tf 1 0 0 1 %d %d Tm %s Tj ET' % (MARGEN_X, y, _pdf_str(ln))
        elif pagina == 1 and i == 1:
            cuerpo = b'BT /F1 9 Tf 1 0 0 1 %d %d Tm %s Tj ET' % (MARGEN_X, y, _pdf_str(ln))
        else:
            cuerpo = b'BT /F2 8.4 Tf 1 0 0 1 %d %d Tm %s Tj ET' % (MARGEN_X, y, _pdf_str(ln))
        partes.append(cuerpo)
        y -= 11.3
        if y < Y_ABAJO:
            break
    pie = 'SuitCVLO-open - analisis de fuentes - pagina %d de %d' % (pagina, total)
    partes.append(b'BT /F2 7.5 Tf 1 0 0 1 %d 30 Tm %s Tj ET'
                  % (MARGEN_X, _pdf_str(pie)))
    return b'\n'.join(partes)


def generar_pdf(lineas, ruta_destino):
    """Escribe el PDF en `ruta_destino`. Devuelve (ruta, bytes)."""
    lineas = [str(l) for l in (lineas or [])]
    paginas = [lineas[i:i + MAX_LINEAS] for i in range(0, len(lineas), MAX_LINEAS)] or [[]]
    total = len(paginas)

    objetos = []
    objetos.append((1, b'<< /Type /Catalog /Pages 2 0 R >>'))
    kids = ' '.join('%d 0 R' % (5 + 2 * i) for i in range(total))
    objetos.append((2, ('<< /Type /Pages /Kids [%s] /Count %d >>' % (kids, total))
                    .encode('latin-1')))
    objetos.append((3, b'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold'
                       b' /Encoding /WinAnsiEncoding >>'))
    objetos.append((4, b'<< /Type /Font /Subtype /Type1 /BaseFont /Courier'
                       b' /Encoding /WinAnsiEncoding >>'))
    for i, ls in enumerate(paginas):
        num_pag, num_con = 5 + 2 * i, 6 + 2 * i
        objetos.append((num_pag, (
            '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 %d %d] '
            '/Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> '
            '/Contents %d 0 R >>' % (PAG_ANCHO, PAG_ALTO, num_con)).encode('latin-1')))
        flujo = _contenido(ls, i + 1, total)
        objetos.append((num_con, b'<< /Length %d >>\nstream\n' % len(flujo)
                        + flujo + b'\nendstream'))

    out = bytearray(b'%PDF-1.4\n%\xe2\xe3\xcf\xd3\n')
    offsets = {}
    for num, cuerpo in sorted(objetos):
        offsets[num] = len(out)
        out += b'%d 0 obj\n' % num + cuerpo + b'\nendobj\n'
    xref = len(out)
    max_num = max(n for n, _c in objetos)
    out += b'xref\n0 %d\n' % (max_num + 1)
    out += b'0000000000 65535 f \n'
    for i in range(1, max_num + 1):
        out += b'%010d 00000 n \n' % offsets.get(i, 0)
    out += (b'trailer\n<< /Size %d /Root 1 0 R >>\nstartxref\n%d\n%%%%EOF\n'
            % (max_num + 1, xref))

    carpeta = os.path.dirname(ruta_destino)
    if carpeta:
        os.makedirs(carpeta, exist_ok=True)
    with open(ruta_destino, 'wb') as f:
        f.write(out)
    return ruta_destino, len(out)
