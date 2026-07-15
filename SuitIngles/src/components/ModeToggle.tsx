import { Shuffle, ListOrdered } from 'lucide-react'
import type { Mode } from '../types'

interface Props {
  mode: Mode
  onToggle: (mode: Mode) => void
}

export default function ModeToggle({ mode, onToggle }: Props) {
  return (
    <div className="flex items-center gap-1 bg-surface-2 rounded-lg p-0.5 border border-border">
      <button
        onClick={() => onToggle('random')}
        className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors ${
          mode === 'random' ? 'bg-neutral-700 text-white' : 'text-text-secondary hover:text-neutral-200'
        }`}
        title="Modo aleatorio (R)"
      >
        <Shuffle size={12} />
        Aleatorio
      </button>
      <button
        onClick={() => onToggle('sequential')}
        className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors ${
          mode === 'sequential' ? 'bg-neutral-700 text-white' : 'text-text-secondary hover:text-neutral-200'
        }`}
        title="Modo secuencial (S)"
      >
        <ListOrdered size={12} />
        Secuencial
      </button>
    </div>
  )
}
