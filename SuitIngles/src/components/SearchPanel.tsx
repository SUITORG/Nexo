import { useState, useMemo } from 'react'
import { Search, X, BookOpen, Volume2 } from 'lucide-react'
import type { VocabularyItem } from '../types'
import { vocabulary } from '../data'
import WordTypeBadge from './WordTypeBadge'
import CEFRBadge from './CEFRBadge'
import { useTTS } from '../hooks/useTTS'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSelectWord: (word: VocabularyItem) => void
}

// Verb conjugations helper
function getConjugations(verb: string): Record<string, string> {
  const irregulars: Record<string, Record<string, string>> = {
    'be': { base: 'be', present: 'am/is/are', past: 'was/were', participle: 'been', gerund: 'being' },
    'have': { base: 'have', present: 'has', past: 'had', participle: 'had', gerund: 'having' },
    'do': { base: 'do', present: 'does', past: 'did', participle: 'done', gerund: 'doing' },
    'go': { base: 'go', present: 'goes', past: 'went', participle: 'gone', gerund: 'going' },
    'make': { base: 'make', present: 'makes', past: 'made', participle: 'made', gerund: 'making' },
    'take': { base: 'take', present: 'takes', past: 'took', participle: 'taken', gerund: 'taking' },
    'come': { base: 'come', present: 'comes', past: 'came', participle: 'come', gerund: 'coming' },
    'see': { base: 'see', present: 'sees', past: 'saw', participle: 'seen', gerund: 'seeing' },
    'get': { base: 'get', present: 'gets', past: 'got', participle: 'gotten', gerund: 'getting' },
    'say': { base: 'say', present: 'says', past: 'said', participle: 'said', gerund: 'saying' },
    'give': { base: 'give', present: 'gives', past: 'gave', participle: 'given', gerund: 'giving' },
    'use': { base: 'use', present: 'uses', past: 'used', participle: 'used', gerund: 'using' },
    'call': { base: 'call', present: 'calls', past: 'called', participle: 'called', gerund: 'calling' },
    'apply': { base: 'apply', present: 'applies', past: 'applied', participle: 'applied', gerund: 'applying' },
    'deposit': { base: 'deposit', present: 'deposits', past: 'deposited', participle: 'deposited', gerund: 'depositing' },
    'withdraw': { base: 'withdraw', present: 'withdraws', past: 'withdrew', participle: 'withdrawn', gerund: 'withdrawing' },
    'order': { base: 'order', present: 'orders', past: 'ordered', participle: 'ordered', gerund: 'ordering' },
    'vote': { base: 'vote', present: 'votes', past: 'voted', participle: 'voted', gerund: 'voting' },
    'freeze': { base: 'freeze', present: 'freezes', past: 'froze', participle: 'frozen', gerund: 'freezing' },
  }

  if (irregulars[verb]) return irregulars[verb]

  // Regular verb conjugation
  const base = verb.toLowerCase()
  let present = base
  let past = base
  let participle = base
  let gerund = base

  if (base.endsWith('e')) {
    present = base + 's'
    past = base + 'd'
    participle = base + 'd'
    gerund = base.slice(0, -1) + 'ing'
  } else if (base.endsWith('y') && !['a','e','i','o','u'].includes(base[base.length - 2])) {
    present = base.slice(0, -1) + 'ies'
    past = base + 'ed'
    participle = base + 'ed'
    gerund = base + 'ing'
  } else if (base.endsWith('s') || base.endsWith('x') || base.endsWith('sh') || base.endsWith('ch')) {
    present = base + 'es'
    past = base + 'ed'
    participle = base + 'ed'
    gerund = base + 'ing'
  } else {
    present = base + 's'
    past = base + 'ed'
    participle = base + 'ed'
    gerund = base + 'ing'
  }

  return { base, present, past, participle, gerund }
}

export default function SearchPanel({ isOpen, onClose, onSelectWord }: Props) {
  const [query, setQuery] = useState('')
  const { speak, isSupported } = useTTS()

  const results = useMemo(() => {
    if (!query.trim()) return []
    const q = query.toLowerCase().trim()

    return vocabulary.filter(v =>
      v.word.toLowerCase().includes(q) ||
      v.translation.toLowerCase().includes(q) ||
      v.notes?.toLowerCase().includes(q) ||
      v.tags?.some(t => t.toLowerCase().includes(q))
    ).slice(0, 10)
  }, [query])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/70 flex items-start justify-center z-50 pt-20" onClick={onClose}>
      <div className="bg-surface-2 border border-border rounded-xl w-full max-w-lg mx-4 max-h-[70vh] flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Search size={16} className="text-blue-400" />
            <span className="font-semibold text-sm">Word Search & Analysis</span>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-neutral-800 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-3 border-b border-border">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Type a word in English or Spanish..."
              autoFocus
              className="w-full bg-neutral-900 border border-border rounded-lg pl-9 pr-4 py-2.5 text-sm outline-none focus:border-blue-600 transition-colors placeholder:text-text-secondary"
            />
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {query.trim() && results.length === 0 && (
            <div className="text-center py-8">
              <BookOpen size={24} className="mx-auto mb-2 text-text-secondary opacity-50" />
              <p className="text-sm text-text-secondary">No results for "{query}"</p>
              <p className="text-xs text-text-secondary mt-1">Try searching in English or Spanish</p>
            </div>
          )}

          {results.map(word => (
            <WordAnalysisCard
              key={word.id}
              word={word}
              onSelect={() => onSelectWord(word)}
              onSpeak={() => speak(word.word)}
              isSupported={isSupported}
            />
          ))}

          {!query.trim() && (
            <div className="text-center py-8">
              <Search size={24} className="mx-auto mb-2 text-text-secondary opacity-30" />
              <p className="text-xs text-text-secondary">Start typing to search vocabulary</p>
              <p className="text-xs text-text-secondary mt-1">You can search by word, translation, or tag</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function WordAnalysisCard({ word, onSelect, onSpeak, isSupported }: {
  word: VocabularyItem
  onSelect: () => void
  onSpeak: () => void
  isSupported: boolean
}) {
  const conjugations = word.type === 'verb' ? getConjugations(word.word) : null

  return (
    <div className="p-3 bg-neutral-900 rounded-lg border border-border hover:border-blue-800/50 transition-colors cursor-pointer" onClick={onSelect}>
      {/* Header: Word + Type + Level */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold">{word.word}</h3>
            {isSupported && (
              <button
                onClick={(e) => { e.stopPropagation(); onSpeak() }}
                className="text-blue-400 hover:text-blue-300 transition-colors"
                title="Listen"
              >
                <Volume2 size={14} />
              </button>
            )}
          </div>
          <p className="text-sm text-text-secondary">{word.translation}</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <WordTypeBadge type={word.type} />
          <CEFRBadge level={word.level} compact />
        </div>
      </div>

      {/* Phonetic */}
      {word.phoneticAmerican && (
        <div className="mb-2">
          <span className="text-[10px] text-text-secondary uppercase tracking-wide">IPA (American)</span>
          <p className="font-mono text-xs text-blue-300">{word.phoneticAmerican}</p>
        </div>
      )}

      {/* Connected Speech */}
      {word.connectedSpeech && (
        <div className="mb-2 p-2 bg-neutral-800 rounded">
          <span className="text-[10px] text-text-secondary uppercase tracking-wide">Connected Speech</span>
          <p className="font-mono text-xs text-green-300">{word.connectedSpeech}</p>
        </div>
      )}

      {/* Pronunciation Notes */}
      {word.pronunciationNotes && (
        <div className="mb-2">
          <span className="text-[10px] text-text-secondary uppercase tracking-wide">Pronunciation Rule</span>
          <p className="text-xs text-amber-300/80">{word.pronunciationNotes}</p>
        </div>
      )}

      {/* Verb Conjugations */}
      {conjugations && (
        <div className="mb-2 p-2 bg-blue-900/20 rounded border border-blue-800/30">
          <span className="text-[10px] text-blue-400 uppercase tracking-wide font-medium">Verb Conjugation</span>
          <div className="grid grid-cols-2 gap-1 mt-1">
            <div className="text-xs"><span className="text-text-secondary">Base:</span> <span className="text-neutral-200">{conjugations.base}</span></div>
            <div className="text-xs"><span className="text-text-secondary">Present:</span> <span className="text-neutral-200">{conjugations.present}</span></div>
            <div className="text-xs"><span className="text-text-secondary">Past:</span> <span className="text-neutral-200">{conjugations.past}</span></div>
            <div className="text-xs"><span className="text-text-secondary">Participle:</span> <span className="text-neutral-200">{conjugations.participle}</span></div>
            <div className="text-xs col-span-2"><span className="text-text-secondary">Gerund:</span> <span className="text-neutral-200">{conjugations.gerund}</span></div>
          </div>
        </div>
      )}

      {/* Usage Analysis */}
      {word.usageAnalysis && (
        <div className="mb-2">
          <span className="text-[10px] text-text-secondary uppercase tracking-wide">Usage</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {word.usageAnalysis.canBeVerb && (
              <span className="px-2 py-0.5 bg-blue-900/30 text-blue-300 rounded text-[10px] font-medium">verb</span>
            )}
            {word.usageAnalysis.canBeNoun && (
              <span className="px-2 py-0.5 bg-green-900/30 text-green-300 rounded text-[10px] font-medium">noun</span>
            )}
            {word.usageAnalysis.canBeAdjective && (
              <span className="px-2 py-0.5 bg-purple-900/30 text-purple-300 rounded text-[10px] font-medium">adjective</span>
            )}
            {word.usageAnalysis.canBeAdverb && (
              <span className="px-2 py-0.5 bg-orange-900/30 text-orange-300 rounded text-[10px] font-medium">adverb</span>
            )}
            {word.usageAnalysis.phrasalVerb && (
              <span className="px-2 py-0.5 bg-pink-900/30 text-pink-300 rounded text-[10px] font-medium">
                phrasal: {word.usageAnalysis.phrasalVerb}
              </span>
            )}
          </div>
          {word.usageAnalysis.commonCollocations && word.usageAnalysis.commonCollocations.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {word.usageAnalysis.commonCollocations.map((col, i) => (
                <span key={i} className="px-2 py-0.5 bg-neutral-800 text-neutral-400 rounded text-[10px]">{col}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Idiom */}
      {word.isIdiom && (
        <div className="mb-2 p-2 bg-amber-900/20 rounded border border-amber-800/30">
          <span className="text-[10px] text-amber-400 uppercase tracking-wide font-medium">Idiom / Modismo</span>
          <p className="text-xs text-amber-200 mt-0.5">Literal: {word.literalMeaning}</p>
        </div>
      )}

      {/* Notes */}
      {word.notes && (
        <div className="text-[11px] text-text-secondary mt-2 pt-2 border-t border-border">
          <span className="text-amber-400">📝</span> {word.notes}
        </div>
      )}
    </div>
  )
}
