import { useState, useCallback, useMemo, useEffect } from 'react'
import { X, Keyboard } from 'lucide-react'
import CompactHeader from './components/CompactHeader'
import TopicSelector from './components/TopicSelector'
import ContentPanel from './components/ContentPanel'
import SearchPanel from './components/SearchPanel'
import { useContent } from './hooks/useContent'
import { useTTS } from './hooks/useTTS'
import { useKeyboard } from './hooks/useKeyboard'
import { vocabulary, conversations, grammarNotes } from './data'
import type { ContentItem, VocabularyItem } from './types'

export default function App() {
  const { state, currentItem, setTopic, setMode, loadAll, next, prev, shuffle, setCefrFilter, setTypeFilter, dispatch } = useContent()
  const [showHelp, setShowHelp] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const tts = useTTS()

  const allContent = useMemo(() => {
    const items: ContentItem[] = [
      ...vocabulary.map(v => ({ type: 'vocabulary' as const, data: v })),
      ...conversations.map(c => ({ type: 'conversation' as const, data: c })),
      ...grammarNotes.map(g => ({ type: 'grammar' as const, data: g })),
    ]
    return items
  }, [])

  useEffect(() => {
    if (state.currentTopic === null && state.visibleContent.length === 0) {
      loadAll()
    }
  }, [loadAll])

  const handleSelectSearchWord = useCallback((word: VocabularyItem) => {
    // Find the word in the current content and navigate to it
    const index = state.visibleContent.findIndex(item =>
      item.type === 'vocabulary' && (item.data as VocabularyItem).id === word.id
    )
    if (index !== -1) {
      // If found, navigate to it
      dispatch({ type: 'SET_CONTENT', content: state.visibleContent })
    }
    setShowSearch(false)
  }, [state.visibleContent])

  const handleSpeak = useCallback(() => {
    if (currentItem) {
      if (currentItem.type === 'vocabulary') {
        tts.speak((currentItem.data as any).word)
      } else if (currentItem.type === 'conversation') {
        const lines = (currentItem.data as any).lines
        if (lines.length > 0) tts.speak(lines[0].text)
      } else if (currentItem.type === 'grammar') {
        const examples = (currentItem.data as any).examples
        if (examples.length > 0) tts.speak(examples[0].en)
      }
    }
  }, [currentItem, tts])

  const keyboardHandlers = useMemo(() => ({
    onNext: next,
    onPrev: prev,
    onShuffle: shuffle,
    onModeToggle: setMode,
    onCefrFilter: setCefrFilter,
    onSpeak: handleSpeak,
    onSearch: () => setShowSearch(true),
  }), [next, prev, shuffle, setMode, setCefrFilter, handleSpeak])

  useKeyboard(keyboardHandlers)

  return (
    <div className="h-dvh flex flex-col bg-neutral-950 text-neutral-100 overflow-hidden">
      <CompactHeader
        mode={state.mode}
        cefrFilter={state.cefrFilter}
        onModeToggle={setMode}
        onCefrFilter={setCefrFilter}
        onShuffle={shuffle}
        onMixAll={loadAll}
        onNext={next}
        onPrev={prev}
        total={state.visibleContent.length}
        currentIndex={state.currentIndex}
        onShowHelp={() => setShowHelp(true)}
        onSearch={() => setShowSearch(true)}
      />

      <div className="flex flex-1 overflow-hidden">
        <TopicSelector
          currentTopic={state.currentTopic}
          customTopic={state.customTopic}
          onSelect={setTopic}
          onCustomTopic={(t) => {
            if (t.trim()) {
              setTopic(null)
              const matching = allContent.filter(item => {
                const data = item.data as any
                return data.tags?.some((tag: string) => tag.toLowerCase().includes(t.toLowerCase()))
              })
              if (matching.length > 0) {
                setTypeFilter('all')
              }
            }
          }}
        />

        <ContentPanel
          item={currentItem}
          showPhonetic={state.showPhonetic}
          showTranslation={state.showTranslation}
          total={state.visibleContent.length}
          currentIndex={state.currentIndex}
        />
      </div>

      <SearchPanel
        isOpen={showSearch}
        onClose={() => setShowSearch(false)}
        onSelectWord={handleSelectSearchWord}
      />

      {showHelp && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowHelp(false)}>
          <div className="bg-surface-2 border border-border rounded-xl p-5 max-w-sm w-full mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Keyboard size={16} />
                <span className="font-semibold text-sm">Atajos de teclado</span>
              </div>
              <button onClick={() => setShowHelp(false)} className="text-text-secondary hover:text-neutral-200">
                <X size={16} />
              </button>
            </div>
            <div className="space-y-2 text-xs">
              {[
                ['← / →', 'Anterior / Siguiente'],
                ['Espacio', 'Escuchar pronunciación'],
                ['R', 'Aleatorizar contenido'],
                ['S', 'Modo secuencial'],
                ['M', 'Modo aleatorio'],
                ['1-6', 'Filtrar por nivel CEFR (A1-C2)'],
                ['0', 'Mostrar todos los niveles'],
              ].map(([key, desc]) => (
                <div key={key} className="flex items-center justify-between bg-neutral-900 rounded-md px-3 py-1.5">
                  <span className="font-mono text-blue-400 font-semibold">{key}</span>
                  <span className="text-text-secondary">{desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
