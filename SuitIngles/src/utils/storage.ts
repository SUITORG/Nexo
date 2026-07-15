import type { AppState } from '../types'

const STORAGE_KEY = 'suitingles-state'

export function saveState(state: AppState) {
  try {
    const toSave = {
      currentTopic: state.currentTopic,
      mode: state.mode,
      cefrFilter: state.cefrFilter,
      typeFilter: state.typeFilter,
      showPhonetic: state.showPhonetic,
      showTranslation: state.showTranslation,
      autoPlayAudio: state.autoPlayAudio,
      darkMode: state.darkMode,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave))
  } catch {
    /* localStorage no disponible */
  }
}

export function loadState(): Partial<AppState> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as Partial<AppState>
  } catch {
    return null
  }
}
