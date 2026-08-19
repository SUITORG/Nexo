import { useReducer, useCallback, useEffect, useRef } from 'react'
import type { AppState, AppAction, ContentItem, CEFRLevel, TypeFilter } from '../types'
import { getContentForTopic, vocabulary, conversations, grammarNotes } from '../data'
import { USCIS_QUESTIONS } from '../services/immigrationService'
import { getLatestNews } from '../services/newsService'
import type { NewsArticle } from '../services/newsService'
import { saveState, loadState } from '../utils/storage'
import { compareCEFR } from '../utils/cefr'

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const initialState: AppState = {
  currentTopic: null,
  customTopic: '',
  mode: 'random',
  currentIndex: 0,
  visibleContent: [],
  cefrFilter: 'all',
  typeFilter: 'all',
  showPhonetic: true,
  showTranslation: true,
  autoPlayAudio: false,
  darkMode: true,
}

function buildAllContent(cefrFilter: CEFRLevel | 'all', typeFilter: TypeFilter, newsArticles: NewsArticle[] = []): ContentItem[] {
  const items: ContentItem[] = []

  for (const v of vocabulary) {
    if (cefrFilter !== 'all' && v.level !== cefrFilter) continue
    if (typeFilter !== 'all' && v.type !== typeFilter) continue
    items.push({ type: 'vocabulary', data: v })
  }

  for (const c of conversations) {
    if (cefrFilter !== 'all' && c.level !== cefrFilter) continue
    items.push({ type: 'conversation', data: c })
  }

  for (const g of grammarNotes) {
    if (cefrFilter !== 'all' && g.level !== cefrFilter) continue
    items.push({ type: 'grammar', data: g })
  }

  // Add immigration questions (real USCIS content)
  for (const q of USCIS_QUESTIONS) {
    items.push({ type: 'immigration', data: q })
  }

  // Add real news articles
  for (const article of newsArticles) {
    items.push({ type: 'news', data: article })
  }

  return items
}

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_TOPIC': {
      const content = action.topicId ? buildContent(action.topicId, state.cefrFilter, state.typeFilter) : []
      return {
        ...state,
        currentTopic: action.topicId,
        currentIndex: 0,
        visibleContent: state.mode === 'random' ? shuffleArray(content) : content,
        customTopic: '',
      }
    }
    case 'SET_CUSTOM_TOPIC':
      return { ...state, customTopic: action.topic }
    case 'LOAD_ALL': {
      const allContent = buildAllContent(state.cefrFilter, state.typeFilter)
      return {
        ...state,
        currentTopic: null,
        currentIndex: 0,
        visibleContent: shuffleArray(allContent),
      }
    }
    case 'SET_MODE': {
      const content = state.mode === action.mode && action.mode === 'random'
        ? shuffleArray(state.visibleContent)
        : state.visibleContent
      return { ...state, mode: action.mode, currentIndex: 0, visibleContent: content }
    }
    case 'NEXT': {
      const next = state.currentIndex + 1
      const max = state.visibleContent.length
      if (state.mode === 'random' && next >= max) {
        return { ...state, currentIndex: 0, visibleContent: shuffleArray(state.visibleContent) }
      }
      return { ...state, currentIndex: next < max ? next : 0 }
    }
    case 'PREV': {
      const prev = state.currentIndex - 1
      return { ...state, currentIndex: prev >= 0 ? prev : 0 }
    }
    case 'SET_CONTENT':
      return { ...state, visibleContent: action.content, currentIndex: 0 }
    case 'SET_CEFR_FILTER': {
      const newState = { ...state, cefrFilter: action.level }
      if (state.currentTopic) {
        newState.visibleContent = buildContent(state.currentTopic, action.level, state.typeFilter)
        newState.currentIndex = 0
      }
      return newState
    }
    case 'SET_TYPE_FILTER': {
      const newState = { ...state, typeFilter: action.wordType }
      if (state.currentTopic) {
        newState.visibleContent = buildContent(state.currentTopic, state.cefrFilter, action.wordType)
        newState.currentIndex = 0
      }
      return newState
    }
    case 'TOGGLE_PHONETIC':
      return { ...state, showPhonetic: !state.showPhonetic }
    case 'TOGGLE_TRANSLATION':
      return { ...state, showTranslation: !state.showTranslation }
    case 'TOGGLE_AUTO_AUDIO':
      return { ...state, autoPlayAudio: !state.autoPlayAudio }
    case 'SHUFFLE':
      return { ...state, visibleContent: shuffleArray(state.visibleContent), currentIndex: 0 }
    case 'RESTORE':
      return { ...state, ...action.state }
    default:
      return state
  }
}

function buildContent(topicId: string, cefrFilter: CEFRLevel | 'all', typeFilter: TypeFilter): ContentItem[] {
  const data = getContentForTopic(topicId)
  const items: ContentItem[] = []

  for (const v of data.vocabulary) {
    if (cefrFilter !== 'all' && v.level !== cefrFilter) continue
    if (typeFilter !== 'all' && v.type !== typeFilter) continue
    items.push({ type: 'vocabulary', data: v })
  }

  for (const c of data.conversations) {
    if (cefrFilter !== `all` && c.level !== cefrFilter) continue
    items.push({ type: 'conversation', data: c })
  }

  for (const g of data.grammarNotes) {
    if (cefrFilter !== 'all' && g.level !== cefrFilter) continue
    items.push({ type: 'grammar', data: g })
  }

  items.sort((a, b) => {
    const aLevel = (a.data as any).level || 'A1'
    const bLevel = (b.data as any).level || 'A1'
    return compareCEFR(aLevel, bLevel)
  })
  return items
}

export function useContent() {
  const [state, dispatch] = useReducer(reducer, initialState, (init) => {
    const saved = loadState()
    if (saved) {
      return { ...init, ...saved }
    }
    return init
  })

  const newsRef = useRef<NewsArticle[]>([])

  useEffect(() => {
    if (state.currentTopic || state.visibleContent.length > 0) {
      saveState(state)
    }
  }, [state.currentTopic, state.mode, state.cefrFilter, state.typeFilter, state.showPhonetic, state.showTranslation, state.autoPlayAudio, state.darkMode])

  const currentItem = state.visibleContent[state.currentIndex] ?? null

  const setTopic = useCallback((topicId: string | null) => {
    dispatch({ type: 'SET_TOPIC', topicId })
  }, [])

  const setMode = useCallback((mode: 'random' | 'sequential') => {
    dispatch({ type: 'SET_MODE', mode })
  }, [])

  const loadAll = useCallback(async () => {
    // Fetch real news first
    try {
      const news = await getLatestNews(15)
      newsRef.current = news
    } catch (error) {
      console.warn('Failed to fetch news, using cached:', error)
      // Keep existing news if fetch fails
    }

    // Build content with news
    const allContent = buildAllContent(state.cefrFilter, state.typeFilter, newsRef.current)
    dispatch({ type: 'SET_CONTENT', content: shuffleArray(allContent) })
  }, [state.cefrFilter, state.typeFilter])

  const next = useCallback(() => dispatch({ type: 'NEXT' }), [])
  const prev = useCallback(() => dispatch({ type: 'PREV' }), [])
  const shuffle = useCallback(() => dispatch({ type: 'SHUFFLE' }), [])

  const setCefrFilter = useCallback((level: CEFRLevel | 'all') => {
    dispatch({ type: 'SET_CEFR_FILTER', level })
  }, [])

  const setTypeFilter = useCallback((wordType: TypeFilter) => {
    dispatch({ type: 'SET_TYPE_FILTER', wordType })
  }, [])

  return {
    state,
    currentItem,
    setTopic,
    setMode,
    loadAll,
    next,
    prev,
    shuffle,
    setCefrFilter,
    setTypeFilter,
    dispatch,
  }
}
