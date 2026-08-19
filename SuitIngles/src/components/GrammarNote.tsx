import { useCallback } from 'react'
import { Volume2, FileText } from 'lucide-react'
import type { GrammarNote as GrammarNoteType } from '../types'
import CEFRBadge from './CEFRBadge'
import { useTTS } from '../hooks/useTTS'

interface Props {
  note: GrammarNoteType
  showTranslation: boolean
}

export default function GrammarNote({ note, showTranslation }: Props) {
  const { speak, isSupported } = useTTS()

  const handleSpeak = useCallback((text: string) => speak(text), [speak])

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <FileText size={16} className="text-amber-400" />
        <h2 className="text-sm font-semibold">{note.title}</h2>
        <CEFRBadge level={note.level} compact />
      </div>

      <div className="grammar-note space-y-2">
        <p className="text-xs leading-relaxed text-amber-200/90">{note.explanation}</p>
        <div className="bg-amber-950/30 border border-amber-800/20 rounded-md px-3 py-2">
          <p className="text-[11px] font-semibold text-amber-300/90 mb-1">Regla:</p>
          <p className="text-[11px] leading-relaxed text-amber-200/80">{note.rule}</p>
        </div>
      </div>

      <div className="space-y-1.5">
        <p className="text-[11px] font-semibold text-text-secondary">Ejemplos:</p>
        {note.examples.map((ex, i) => (
          <div key={i} className="group flex items-start gap-2 bg-surface-2 rounded-lg p-2 border border-border">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-neutral-300">{ex.en}</p>
              {showTranslation && (
                <p className="text-[11px] text-text-secondary mt-0.5">{ex.es}</p>
              )}
            </div>
            {isSupported && (
              <button
                onClick={() => handleSpeak(ex.en)}
                className="opacity-0 group-hover:opacity-100 text-text-secondary hover:text-blue-400 transition-all shrink-0"
                title="Escuchar"
              >
                <Volume2 size={12} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
