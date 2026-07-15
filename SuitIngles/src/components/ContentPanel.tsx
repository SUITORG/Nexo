import { BookOpen } from 'lucide-react'
import type { ContentItem } from '../types'
import VocabularyCard from './VocabularyCard'
import ConversationCard from './ConversationCard'
import GrammarNoteCard from './GrammarNote'
import NewsCard from './NewsCard'
import ImmigrationCard from './ImmigrationCard'
import type { NewsArticle } from '../services/newsService'
import type { ImmigrationQuestion } from '../services/immigrationService'

interface Props {
  item: ContentItem | null
  showPhonetic: boolean
  showTranslation: boolean
  total: number
  currentIndex: number
}

export default function ContentPanel({ item, showPhonetic, showTranslation, total, currentIndex }: Props) {
  if (!item) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-text-secondary gap-3">
        <BookOpen size={32} className="opacity-30" />
        <p className="text-sm">Selecciona un tema para empezar</p>
        <p className="text-[11px]">O presiona 1-6 para filtrar por nivel CEFR</p>
      </div>
    )
  }

  const getTypeLabel = () => {
    switch (item.type) {
      case 'vocabulary': return 'Vocabulario'
      case 'conversation': return 'Conversación'
      case 'grammar': return 'Gramática'
      case 'news': return 'Noticias Reales'
      case 'immigration': return 'Preguntas USCIS'
      default: return item.type
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="max-w-xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-text-secondary">
            {getTypeLabel()}
            {' '}· {currentIndex + 1}/{total}
          </span>
        </div>

        {item.type === 'vocabulary' && (
          <VocabularyCard item={item.data as any} showPhonetic={showPhonetic} showTranslation={showTranslation} />
        )}
        {item.type === 'conversation' && (
          <ConversationCard conversation={item.data as any} showTranslation={showTranslation} />
        )}
        {item.type === 'grammar' && (
          <GrammarNoteCard note={item.data as any} showTranslation={showTranslation} />
        )}
        {item.type === 'news' && (
          <NewsCard article={item.data as NewsArticle} />
        )}
        {item.type === 'immigration' && (
          <ImmigrationCard
            question={item.data as ImmigrationQuestion}
            showAnswer={true}
            onToggleAnswer={() => {}}
          />
        )}
      </div>
    </div>
  )
}
