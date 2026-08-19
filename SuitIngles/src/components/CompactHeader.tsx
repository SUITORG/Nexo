import { Shuffle, ArrowLeft, ArrowRight, HelpCircle, Layers, Search } from 'lucide-react'
import type { Mode, CEFRLevel } from '../types'
import { CEFR_ORDER } from '../utils/cefr'
import ModeToggle from './ModeToggle'

interface Props {
  mode: Mode
  cefrFilter: CEFRLevel | 'all'
  onModeToggle: (mode: Mode) => void
  onCefrFilter: (level: CEFRLevel | 'all') => void
  onShuffle: () => void
  onMixAll: () => void
  onNext: () => void
  onPrev: () => void
  total: number
  currentIndex: number
  onShowHelp: () => void
  onSearch: () => void
}

export default function CompactHeader({
  mode, cefrFilter, onModeToggle, onCefrFilter,
  onShuffle, onMixAll, onNext, onPrev,
  total, currentIndex, onShowHelp, onSearch,
}: Props) {
  return (
    <div className="flex items-center justify-between px-3 py-1.5 bg-surface border-b border-border select-none text-xs" style={{ height: 36 }}>
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold tracking-tight">SuitIngles</span>
        <span className="text-text-secondary">|</span>
        <ModeToggle mode={mode} onToggle={onModeToggle} />
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 bg-surface-2 rounded-lg p-0.5 border border-border">
          <button onClick={() => onCefrFilter('all')}
            className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors ${cefrFilter === 'all' ? 'bg-neutral-700 text-white' : 'text-text-secondary hover:text-neutral-200'}`}>
            ALL
          </button>
          {CEFR_ORDER.map(l => (
            <button key={l} onClick={() => onCefrFilter(l)}
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-colors ${cefrFilter === l ? 'bg-neutral-700 text-white' : 'text-text-secondary hover:text-neutral-200'}`}>
              {l}
            </button>
          ))}
        </div>

        <button onClick={onShuffle} className="p-1 rounded hover:bg-neutral-800 transition-colors" title="Aleatorizar (R)">
          <Shuffle size={14} />
        </button>
        <button onClick={onMixAll} className="p-1 rounded hover:bg-neutral-800 transition-colors" title="Mezcla Total - Todos los temas">
          <Layers size={14} />
        </button>

        <button onClick={onSearch} className="p-1 rounded hover:bg-neutral-800 transition-colors" title="Buscar palabra (Ctrl+K)">
          <Search size={14} />
        </button>

        <button onClick={onPrev} className="p-1 rounded hover:bg-neutral-800 transition-colors" title="Anterior (←)">
          <ArrowLeft size={14} />
        </button>
        <span className="text-text-secondary tabular-nums min-w-[4ch] text-center">
          {total > 0 ? `${currentIndex + 1}/${total}` : '0/0'}
        </span>
        <button onClick={onNext} className="p-1 rounded hover:bg-neutral-800 transition-colors" title="Siguiente (→)">
          <ArrowRight size={14} />
        </button>

        <button onClick={onShowHelp} className="p-1 rounded hover:bg-neutral-800 transition-colors text-text-secondary" title="Atajos de teclado (?)">
          <HelpCircle size={14} />
        </button>
      </div>
    </div>
  )
}
