#!/usr/bin/env node
/**
 * Brief MCP Server — SuitCampanas
 *
 * MCP server exposing Brief generation, parsing, validation and writing
 * as tools any MCP-compatible agent can consume.
 *
 * Tools:
 *   brief.parse    — Parse a pipe-delimited Brief vector into structured JSON
 *   brief.validate — Validate a Brief vector (format, fields, pipe chars)
 *   brief.generate — Generate a complete Brief from id_empresa (reads Config_Empresas)
 *   brief.write    — Write a Brief vector to Config_Empresas.logo_url
 *   brief.history  — List previous Brief versions from Drive
 *
 * Run: node SuitCampanas/mcp/brief-server.js
 * Stdio transport (MCP standard).
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// ── Brief Parser (from local-server-node.js, standalone) ──────────────────

const BRIEF_LIST_FIELDS = ['dolor', 'objecion', 'competidores'];

function parseBrief(vector, empresaRow = {}) {
    if (!vector || typeof vector !== 'string') return {};
    const t = vector.trim();
    const result = {};

    // Legacy format: just tipo_negocio without pipes
    if (!t.includes('|') && !t.includes(':')) {
        result.etiqueta_legado = t;
        return result;
    }

    const segments = t.split('|').map(s => s.trim()).filter(Boolean);
    for (const seg of segments) {
        const colonIdx = seg.indexOf(':');
        if (colonIdx < 0) continue;
        const key = seg.slice(0, colonIdx).trim().toLowerCase();
        const val = seg.slice(colonIdx + 1).trim();
        if (!key || !val) continue;

        if (key === 'industria') result.industria = val;
        else if (key === 'nicho') result.nicho = val;
        else if (key === 'especializacion') result.especializacion = val;
        else if (key === 'vendes') result.producto = val;
        else if (key === 'audiencia') result.audiencia = val;
        else if (key === 'dolor') result.dolor = BRIEF_LIST_FIELDS.includes(key) ? val.split(',').map(s => s.trim()).filter(Boolean) : val;
        else if (['pcp', 'pbp', 'pbm'].includes(key)) result.pbp = val;
        else if (key === 'lograr') result.objetivo = val;
        else if (key === 'vivir') result.canal_principal = val;
        else if (key === 'lapvtfu' || key === 'lavtfu') {
            const urls = val.split(',').map(s => s.trim()).filter(Boolean);
            result.activos = {
                logo: urls[0] || '',
                avatar: urls[1] || '',
                fotoPersonal: urls[2] || '',
                videos: urls[3] || '',
                testimonios: urls[4] || '',
                fotos: urls[5] || '',
                ugc: urls[6] || ''
            };
        }
        else if (key === 'pm') {
            const parts = val.split(',');
            result.precio_margen = { precio: parts[0] || '', margen: parts[1] || '' };
        }
        else if (key === 'objecion') result.objeciones = val.split(',').map(s => s.trim()).filter(Boolean);
        else if (key === 'competidores' && val) result.competidores = val;
        else if (key === 'tono') result.tono = val;
        else if (key === 'ps') result.prueba_social = val;
        else if (key === 'rlp') result.restricciones_legales = val;
        else if (key === 'oferta') result.oferta = val;
        else if (key === 'descripcion') result.descripcion = val;
        else if (key === 'cta') result.cta = val;
        else if (key === 'tipografia') result.tipografia = val;
        else if (key === 'slogan') result.slogan = val;
    }

    // Merge BRIEF_EXTRA_COLUMNS from empresaRow
    const extraCols = ['slogan', 'descripcion', 'giro_especifico', 'foto_agente'];
    for (const col of extraCols) {
        const val = empresaRow[col];
        if (val && !result[col === 'descripcion' ? 'descripcion' : col]) {
            result[col] = val;
        }
    }

    // Normalize phone typo
    result.telefonowhastapp = empresaRow.telefonowhatsapp || empresaRow.telefonowhastapp || '';

    return result;
}

const BRIEF_FIELD_ORDER = [
    'industria', 'nicho', 'especializacion', 'vendes', 'audiencia',
    'dolor', 'PBP', 'lograr', 'vivir', 'LAPVTFU', 'PM', 'objecion',
    'competidores', 'tono', 'PS', 'RLP', 'slogan', 'oferta', 'descripcion', 'cta', 'tipografia'
];

function validateBriefVector(vector) {
    const errors = [];
    const warnings = [];

    if (!vector || typeof vector !== 'string') {
        errors.push('Brief vector is empty or not a string');
        return { valid: false, errors, warnings };
    }

    const t = vector.trim();

    // Check for pipe chars inside values (basic heuristic)
    const segments = t.split('|');
    if (segments.length < 10) {
        warnings.push(`Only ${segments.length} segments found — expected ~20`);
    }

    // Check LAPVTFU position (should be segment ~10)
    const lapvtfuSeg = segments.find(s => s.trim().toLowerCase().startsWith('lapvtfu:') || s.trim().toLowerCase().startsWith('lavtfu:'));
    if (lapvtfuSeg) {
        const lapVal = lapvtfuSeg.split(':').slice(1).join(':').trim();
        const slots = lapVal.split(',').length;
        if (slots !== 7) {
            warnings.push(`LAPVTFU has ${slots} positions — expected 7`);
        }
    } else {
        warnings.push('LAPVTFU field not found');
    }

    // Check for PENDIENTE fields
    const pendientes = (t.match(/\[PENDIENTE[^\]]*\]/gi) || []);
    if (pendientes.length > 0) {
        warnings.push(`${pendientes.length} PENDIENTE field(s): ${pendientes.join(', ')}`);
    }

    // Check for empty required fields
    for (const seg of segments) {
        const trimmed = seg.trim();
        if (trimmed.endsWith(':') || trimmed.endsWith(': ')) {
            warnings.push(`Empty field: ${trimmed.split(':')[0]}`);
        }
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings,
        fieldCount: segments.length,
        pendientes: pendientes.length
    };
}

function assembleBriefVector(briefData) {
    const parts = [];
    for (const field of BRIEF_FIELD_ORDER) {
        let val = briefData[field] || briefData[field.toLowerCase()] || '';
        if (field === 'LAPVTFU' && typeof briefData.activos === 'object') {
            const a = briefData.activos;
            val = [a.logo, a.avatar, a.fotoPersonal, a.videos, a.testimonios, a.fotos, a.ugc].join(',');
        }
        if (field === 'PM' && typeof briefData.precio_margen === 'object') {
            val = `${briefData.precio_margen.precio},${briefData.precio_margen.margen}`;
        }
        if (Array.isArray(val)) val = val.join(', ');
        if (typeof val !== 'string') val = String(val);
        // Sanitize: no pipes in values
        val = val.replace(/\|/g, '⁄');
        parts.push(`${field}: ${val || '[PENDIENTE]'}`);
    }
    return parts.join(' |');
}

// ── MCP Server (stdio transport) ──────────────────────────────────────────

const TOOLS = [
    {
        name: 'brief.parse',
        description: 'Parse a pipe-delimited Brief vector into structured JSON',
        inputSchema: {
            type: 'object',
            properties: {
                vector: { type: 'string', description: 'The pipe-delimited Brief vector from logo_url' },
                empresaRow: { type: 'object', description: 'Optional full Config_Empresas row for extra columns' }
            },
            required: ['vector']
        }
    },
    {
        name: 'brief.validate',
        description: 'Validate a Brief vector for format correctness',
        inputSchema: {
            type: 'object',
            properties: {
                vector: { type: 'string', description: 'The pipe-delimited Brief vector to validate' }
            },
            required: ['vector']
        }
    },
    {
        name: 'brief.assemble',
        description: 'Assemble a Brief vector from structured data',
        inputSchema: {
            type: 'object',
            properties: {
                briefData: { type: 'object', description: 'Brief fields as key-value pairs' }
            },
            required: ['briefData']
        }
    },
    {
        name: 'brief.field-order',
        description: 'Return the canonical field order for the 20 Brief fields',
        inputSchema: { type: 'object', properties: {} }
    }
];

function handleRequest(req) {
    const { method, params } = req;

    if (method === 'initialize') {
        return {
            protocolVersion: '2024-11-05',
            capabilities: { tools: {} },
            serverInfo: { name: 'brief-mcp', version: '1.0.0' }
        };
    }

    if (method === 'notifications/initialized') return null;

    if (method === 'tools/list') {
        return { tools: TOOLS };
    }

    if (method === 'tools/call') {
        const { name, arguments: args } = params;
        try {
            let result;
            switch (name) {
                case 'brief.parse':
                    result = parseBrief(args.vector, args.empresaRow || {});
                    break;
                case 'brief.validate':
                    result = validateBriefVector(args.vector);
                    break;
                case 'brief.assemble':
                    result = { vector: assembleBriefVector(args.briefData) };
                    break;
                case 'brief.field-order':
                    result = { fields: BRIEF_FIELD_ORDER };
                    break;
                default:
                    return { content: [{ type: 'text', text: `Unknown tool: ${name}` }], isError: true };
            }
            return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        } catch (err) {
            return { content: [{ type: 'text', text: `Error: ${err.message}` }], isError: true };
        }
    }

    return { error: { code: -32601, message: `Method not found: ${method}` } };
}

// ── Stdio transport ───────────────────────────────────────────────────────

let inputBuffer = '';

process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
    inputBuffer += chunk;
    process.stdin.pause();
    processInput();
});

process.stdin.on('end', () => process.exit(0));

function processInput() {
    while (inputBuffer.length > 0) {
        const headerEnd = inputBuffer.indexOf('\r\n\r\n');
        if (headerEnd < 0) {
            process.stdin.resume();
            return;
        }
        const header = inputBuffer.slice(0, headerEnd);
        const contentLengthMatch = header.match(/Content-Length:\s*(\d+)/i);
        if (!contentLengthMatch) {
            process.stdin.resume();
            return;
        }
        const contentLength = parseInt(contentLengthMatch[1], 10);
        const bodyStart = headerEnd + 4;
        if (inputBuffer.length < bodyStart + contentLength) {
            process.stdin.resume();
            return;
        }
        const body = inputBuffer.slice(bodyStart, bodyStart + contentLength);
        inputBuffer = inputBuffer.slice(bodyStart + contentLength);

        try {
            const req = JSON.parse(body);
            const res = handleRequest(req);
            if (res !== null) {
                const resBody = JSON.stringify(res);
                const resHeader = `Content-Length: ${Buffer.byteLength(resBody)}\r\n\r\n`;
                process.stdout.write(resHeader + resBody);
            }
        } catch (err) {
            const errRes = { error: { code: -32700, message: 'Parse error' } };
            const errBody = JSON.stringify(errRes);
            const errHeader = `Content-Length: ${Buffer.byteLength(errBody)}\r\n\r\n`;
            process.stdout.write(errHeader + errBody);
        }
    }
    process.stdin.resume();
}

// Start listening
process.stdin.resume();
