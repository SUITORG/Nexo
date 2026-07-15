import type { NewsArticle } from '../services/newsService'
import type { ImmigrationQuestion } from '../services/immigrationService'

export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'

export type WordType =
  | 'verb'
  | 'noun'
  | 'adjective'
  | 'adverb'
  | 'idiom'
  | 'phrasal-verb'
  | 'preposition'
  | 'conjunction'

export type Mode = 'random' | 'sequential'

export interface UsageAnalysis {
  canBeVerb?: boolean
  canBeNoun?: boolean
  canBeAdjective?: boolean
  canBeAdverb?: boolean
  phrasalVerb?: string
  commonCollocations?: string[]
}

export interface VocabularyItem {
  id: string
  word: string
  translation: string
  phonetic?: string
  type: WordType
  level: CEFRLevel
  singular?: string
  plural?: string
  examples: string[]
  examplesEs: string[]
  notes?: string
  tags: string[]
  // Enhanced fields for pronunciation & analysis (80/20 impact)
  phoneticAmerican?: string
  connectedSpeech?: string
  pronunciationNotes?: string
  isIdiom?: boolean
  literalMeaning?: string
  usageAnalysis?: UsageAnalysis
}

export interface ConversationLine {
  speaker: 'A' | 'B'
  text: string
  textEs: string
}

export interface Conversation {
  id: string
  topic: string
  title: string
  level: CEFRLevel
  situation: string
  lines: ConversationLine[]
  vocabularyIds: string[]
  tags: string[]
}

export interface GrammarNote {
  id: string
  title: string
  explanation: string
  rule: string
  examples: { en: string; es: string }[]
  level: CEFRLevel
  relatedWordIds: string[]
  tags: string[]
}

export interface Topic {
  id: string
  name: string
  nameEs: string
  icon: string
  category: string
  description: string
  vocabularyIds: string[]
  conversationIds: string[]
  grammarNoteIds: string[]
  levelRange: [CEFRLevel, CEFRLevel]
  tags?: string[]
}

export type ContentType = 'vocabulary' | 'conversation' | 'grammar' | 'news' | 'immigration'

export interface ContentItem {
  type: ContentType
  data: VocabularyItem | Conversation | GrammarNote | NewsArticle | ImmigrationQuestion
}

export type TypeFilter = WordType | 'all'

export interface AppState {
  currentTopic: string | null
  customTopic: string
  mode: Mode
  currentIndex: number
  visibleContent: ContentItem[]
  cefrFilter: CEFRLevel | 'all'
  typeFilter: TypeFilter
  showPhonetic: boolean
  showTranslation: boolean
  autoPlayAudio: boolean
  darkMode: boolean
}

export type AppAction =
  | { type: 'SET_TOPIC'; topicId: string | null }
  | { type: 'SET_CUSTOM_TOPIC'; topic: string }
  | { type: 'LOAD_ALL' }
  | { type: 'SET_MODE'; mode: Mode }
  | { type: 'NEXT' }
  | { type: 'PREV' }
  | { type: 'SET_CONTENT'; content: ContentItem[] }
  | { type: 'SET_CEFR_FILTER'; level: CEFRLevel | 'all' }
  | { type: 'SET_TYPE_FILTER'; wordType: TypeFilter }
  | { type: 'TOGGLE_PHONETIC' }
  | { type: 'TOGGLE_TRANSLATION' }
  | { type: 'TOGGLE_AUTO_AUDIO' }
  | { type: 'SHUFFLE' }
  | { type: 'RESTORE'; state: AppState }
