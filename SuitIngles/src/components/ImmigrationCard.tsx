import { useState } from 'react'
import { ChevronDown, ChevronUp, BookOpen, HelpCircle } from 'lucide-react'
import type { ImmigrationQuestion } from '../services/immigrationService'

interface Props {
  question: ImmigrationQuestion
  showAnswer: boolean
  onToggleAnswer: () => void
}

export default function ImmigrationCard({ question, showAnswer, onToggleAnswer }: Props) {
  const [showNotes, setShowNotes] = useState(false)

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      general: 'General',
      civics: 'Cívicas',
      history: 'Historia',
      english: 'Inglés',
      documents: 'Documentos'
    }
    return labels[category] || category
  }

  const getDifficultyColor = (difficulty: string) => {
    const colors: Record<string, string> = {
      basic: 'bg-green-900/30 text-green-300',
      intermediate: 'bg-yellow-900/30 text-yellow-300',
      advanced: 'bg-red-900/30 text-red-300'
    }
    return colors[difficulty] || colors.basic
  }

  return (
    <div className="word-card space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <HelpCircle size={16} className="text-amber-400" />
          <span className="text-xs font-semibold text-text-secondary">USCIS Real Question</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${getDifficultyColor(question.difficulty)}`}>
            {question.difficulty}
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-neutral-800 text-neutral-300">
            {getCategoryLabel(question.category)}
          </span>
        </div>
      </div>

      {/* Question */}
      <div className="p-3 bg-surface-2 rounded-lg border border-border">
        <p className="text-sm font-medium text-neutral-100">{question.question}</p>
        <p className="text-xs text-text-secondary mt-1">{question.questionEs}</p>
      </div>

      {/* Answer Toggle */}
      <button
        onClick={onToggleAnswer}
        className="w-full flex items-center justify-between p-2 bg-neutral-800 hover:bg-neutral-750 rounded-lg transition-colors"
      >
        <span className="text-xs font-medium text-text-secondary">
          {showAnswer ? 'Hide Answer' : 'Show Answer'}
        </span>
        {showAnswer ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {/* Answer */}
      {showAnswer && (
        <div className="p-3 bg-green-900/20 rounded-lg border border-green-800/30 space-y-2">
          <p className="text-sm text-green-200">{question.answer}</p>
          <p className="text-xs text-green-300/70">{question.answerEs}</p>
        </div>
      )}

      {/* Learning Notes */}
      {question.notes && question.notes.length > 0 && (
        <div className="space-y-2">
          <button
            onClick={() => setShowNotes(!showNotes)}
            className="flex items-center gap-2 text-[10px] font-medium text-text-secondary hover:text-neutral-200 transition-colors"
          >
            <BookOpen size={12} />
            <span>English Learning Notes ({question.notes.length})</span>
            {showNotes ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
          </button>

          {showNotes && (
            <div className="p-2 bg-amber-900/20 rounded-md border border-amber-800/30">
              <ul className="space-y-1">
                {question.notes.map((note, i) => (
                  <li key={i} className="text-[11px] text-amber-200/80 flex items-start gap-1.5">
                    <span className="text-amber-400 mt-0.5">•</span>
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
