import { useEffect } from 'react'
import type { Mode, CEFRLevel } from '../types'

interface KeyHandlers {
  onNext: () => void
  onPrev: () => void
  onModeToggle: (mode: Mode) => void
  onShuffle: () => void
  onCefrFilter: (level: CEFRLevel | 'all') => void
  onSpeak: () => void
  onSearch: () => void
}

export function useKeyboard(handlers: KeyHandlers) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault()
          handlers.onNext()
          break
        case 'ArrowLeft':
          e.preventDefault()
          handlers.onPrev()
          break
        case ' ':
          e.preventDefault()
          handlers.onSpeak()
          break
        case 'r':
        case 'R':
          handlers.onShuffle()
          break
        case 'm':
        case 'M':
          handlers.onModeToggle('sequential')
          break
        case 's':
        case 'S':
          handlers.onModeToggle('random')
          break
        case '1':
          handlers.onCefrFilter('A1')
          break
        case '2':
          handlers.onCefrFilter('A2')
          break
        case '3':
          handlers.onCefrFilter('B1')
          break
        case '4':
          handlers.onCefrFilter('B2')
          break
        case '5':
          handlers.onCefrFilter('C1')
          break
        case '6':
          handlers.onCefrFilter('C2')
          break
        case '0':
          handlers.onCefrFilter('all')
          break
      }

      // Ctrl+K for search
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault()
        handlers.onSearch()
      }
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [handlers])
}
