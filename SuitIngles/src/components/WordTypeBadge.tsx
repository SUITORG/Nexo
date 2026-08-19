import type { WordType } from '../types'

const COLORS: Record<WordType, { bg: string; text: string; label: string }> = {
  verb: { bg: '#1e3a5f', text: '#93c5fd', label: 'v' },
  noun: { bg: '#5f2e1e', text: '#fdba74', label: 'n' },
  adjective: { bg: '#1e5f2e', text: '#86efac', label: 'adj' },
  adverb: { bg: '#3b1e5f', text: '#d8b4fe', label: 'adv' },
  idiom: { bg: '#5f1e4a', text: '#f0abfc', label: ' idiom' },
  'phrasal-verb': { bg: '#4a1e5f', text: '#c4b5fd', label: 'phr.v' },
  preposition: { bg: '#1e4a5f', text: '#67e8f9', label: 'prep' },
  conjunction: { bg: '#4a4a1e', text: '#fef08a', label: 'conj' },
}

interface Props {
  type: WordType
}

export default function WordTypeBadge({ type }: Props) {
  const c = COLORS[type] ?? { bg: '#333', text: '#aaa', label: type }
  return (
    <span
      className="inline-flex items-center text-[10px] font-mono font-bold px-1.5 py-0.5 rounded"
      style={{ backgroundColor: c.bg, color: c.text }}
      title={type}
    >
      {c.label}
    </span>
  )
}
