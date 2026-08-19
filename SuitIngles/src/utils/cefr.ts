import type { CEFRLevel } from '../types'

export const CEFR_COLORS: Record<CEFRLevel, { bg: string; text: string }> = {
  A1: { bg: '#166534', text: '#bbf7d0' },
  A2: { bg: '#15803d', text: '#dcfce7' },
  B1: { bg: '#1e40af', text: '#bfdbfe' },
  B2: { bg: '#7c3aed', text: '#ddd6fe' },
  C1: { bg: '#a21caf', text: '#e9d5ff' },
  C2: { bg: '#be123c', text: '#fecdd3' },
}

export const CEFR_LABELS: Record<CEFRLevel, string> = {
  A1: 'Básico (A1)',
  A2: 'Básico (A2)',
  B1: 'Intermedio (B1)',
  B2: 'Intermedio (B2)',
  C1: 'Avanzado (C1)',
  C2: 'Dominio (C2)',
}

export const CEFR_ORDER: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

export function compareCEFR(a: CEFRLevel, b: CEFRLevel): number {
  return CEFR_ORDER.indexOf(a) - CEFR_ORDER.indexOf(b)
}
