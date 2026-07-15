import { BookOpen, Volume2, MessageSquare, Lightbulb } from 'lucide-react'
import type { VocabularyItem } from '../types'

interface Props {
  item: VocabularyItem
}

export default function WordAnalysis({ item }: Props) {
  const hasAnalysis = item.usageAnalysis || item.isIdiom || item.connectedSpeech || item.pronunciationNotes

  if (!hasAnalysis) return null

  return (
    <div className="mt-4 p-3 bg-surface-2 rounded-lg border border-border space-y-3">
      <div className="flex items-center gap-2 text-xs font-semibold text-text-secondary">
        <BookOpen size={14} />
        <span>Word Analysis</span>
      </div>

      {/* Idiom Section */}
      {item.isIdiom && (
        <div className="p-2 bg-amber-900/20 rounded-md border border-amber-800/30">
          <div className="flex items-center gap-2 text-xs font-medium text-amber-400 mb-1">
            <Lightbulb size={12} />
            <span>Idiom / Modismo</span>
          </div>
          <p className="text-xs text-neutral-300">
            <span className="text-amber-300">Literal:</span> {item.literalMeaning}
          </p>
          <p className="text-xs text-neutral-300 mt-1">
            <span className="text-green-400">Real meaning:</span> {item.translation}
          </p>
        </div>
      )}

      {/* Usage Analysis */}
      {item.usageAnalysis && (
        <div className="space-y-2">
          <div className="text-[10px] text-text-secondary font-medium uppercase tracking-wide">Usos</div>
          <div className="flex flex-wrap gap-1.5">
            {item.usageAnalysis.canBeVerb && (
              <span className="px-2 py-0.5 bg-blue-900/30 text-blue-300 rounded text-[10px] font-medium">verb</span>
            )}
            {item.usageAnalysis.canBeNoun && (
              <span className="px-2 py-0.5 bg-green-900/30 text-green-300 rounded text-[10px] font-medium">noun</span>
            )}
            {item.usageAnalysis.canBeAdjective && (
              <span className="px-2 py-0.5 bg-purple-900/30 text-purple-300 rounded text-[10px] font-medium">adjective</span>
            )}
            {item.usageAnalysis.canBeAdverb && (
              <span className="px-2 py-0.5 bg-orange-900/30 text-orange-300 rounded text-[10px] font-medium">adverb</span>
            )}
            {item.usageAnalysis.phrasalVerb && (
              <span className="px-2 py-0.5 bg-pink-900/30 text-pink-300 rounded text-[10px] font-medium">
                phrasal: {item.usageAnalysis.phrasalVerb}
              </span>
            )}
          </div>

          {item.usageAnalysis.commonCollocations && item.usageAnalysis.commonCollocations.length > 0 && (
            <div className="mt-2">
              <div className="text-[10px] text-text-secondary font-medium uppercase tracking-wide mb-1">Collocations</div>
              <div className="flex flex-wrap gap-1">
                {item.usageAnalysis.commonCollocations.map((collocation, i) => (
                  <span key={i} className="px-2 py-0.5 bg-neutral-800 text-neutral-300 rounded text-[10px]">
                    {collocation}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Connected Speech */}
      {item.connectedSpeech && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[10px] text-text-secondary font-medium uppercase tracking-wide">
            <Volume2 size={12} />
            <span>Connected Speech</span>
          </div>
          <div className="p-2 bg-neutral-800 rounded-md">
            <div className="text-xs text-neutral-300 font-mono">{item.connectedSpeech}</div>
          </div>
        </div>
      )}

      {/* Pronunciation Rules */}
      {item.pronunciationNotes && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[10px] text-text-secondary font-medium uppercase tracking-wide">
            <MessageSquare size={12} />
            <span>Pronunciation Rule</span>
          </div>
          <p className="text-xs text-neutral-400">{item.pronunciationNotes}</p>
        </div>
      )}
    </div>
  )
}
