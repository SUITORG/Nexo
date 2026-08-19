import { useCallback } from 'react'
import { Volume2, BookOpen } from 'lucide-react'
import type { VocabularyItem } from '../types'
import CEFRBadge from './CEFRBadge'
import WordTypeBadge from './WordTypeBadge'
import WordAnalysis from './WordAnalysis'
import { useTTS } from '../hooks/useTTS'
import { pluralize } from '../utils/pluralize'

interface Props {
  item: VocabularyItem
  showPhonetic: boolean
  showTranslation: boolean
}

export default function VocabularyCard({ item, showPhonetic, showTranslation }: Props) {
  const { speak, isSupported } = useTTS()

  const handleSpeakWord = useCallback(() => speak(item.word), [speak, item.word])
  const handleSpeakExample = useCallback((ex: string) => speak(ex), [speak])

  const autoPlural = item.type === 'noun' ? pluralize(item.word) : undefined
  const actualPlural = item.plural || autoPlural
  const hasPlural = item.type === 'noun' && actualPlural && actualPlural !== item.word

  return (
    <div className="word-card space-y-2.5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-semibold">{item.word}</h3>
            {showPhonetic && item.phonetic && (
              <span className="font-mono text-xs text-text-secondary">{item.phonetic}</span>
            )}
            {isSupported && (
              <button onClick={handleSpeakWord} className="text-blue-400 hover:text-blue-300 transition-colors" title="Escuchar">
                <Volume2 size={14} />
              </button>
            )}
          </div>
          {showTranslation && (
            <p className="text-sm text-text-secondary mt-0.5">{item.translation}</p>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <WordTypeBadge type={item.type} />
          <CEFRBadge level={item.level} compact />
        </div>
      </div>

      {(item.singular || hasPlural) && (
        <div className="flex items-center gap-2 text-xs text-text-secondary bg-surface-3 rounded px-2 py-1">
          <BookOpen size={12} />
          {item.singular && <span>sg: <strong className="text-neutral-200">{item.singular}</strong></span>}
          {hasPlural && <span>pl: <strong className="text-neutral-200">{actualPlural}</strong></span>}
        </div>
      )}

      <div className="space-y-1">
        {item.examples.map((ex, i) => (
          <div key={i} className="group flex items-start gap-1.5">
            <span className="text-blue-400/60 mt-0.5 shrink-0">→</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-neutral-300">{ex}</p>
              {showTranslation && item.examplesEs[i] && (
                <p className="text-[11px] text-text-secondary">{item.examplesEs[i]}</p>
              )}
            </div>
            {isSupported && (
              <button
                onClick={() => handleSpeakExample(ex)}
                className="opacity-0 group-hover:opacity-100 text-text-secondary hover:text-blue-400 transition-all shrink-0"
                title="Escuchar ejemplo"
              >
                <Volume2 size={11} />
              </button>
            )}
          </div>
        ))}
      </div>

      {item.notes && (
        <div className="grammar-note mt-1">
          <p className="text-[11px] leading-relaxed text-amber-200/80">
            <span className="font-semibold text-amber-300/90">📝 </span>
            {item.notes}
          </p>
        </div>
      )}

      <WordAnalysis item={item} />
    </div>
  )
}
