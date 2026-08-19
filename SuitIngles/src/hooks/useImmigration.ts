import { useState, useCallback } from 'react'
import {
  USCIS_QUESTIONS,
  getQuestionsByCategory,
  getQuestionsByDifficulty,
  getRandomQuestions,
  getCategoriesWithCounts
} from '../services/immigrationService'
import type { ImmigrationQuestion } from '../services/immigrationService'

interface UseImmigrationReturn {
  questions: ImmigrationQuestion[]
  currentQuestion: ImmigrationQuestion | null
  currentIndex: number
  showAnswer: boolean
  byCategory: (category: ImmigrationQuestion['category']) => ImmigrationQuestion[]
  byDifficulty: (difficulty: ImmigrationQuestion['difficulty']) => ImmigrationQuestion[]
  random: (count: number) => void
  next: () => void
  prev: () => void
  toggleAnswer: () => void
  categories: { category: string; count: number }[]
  setCategory: (category: ImmigrationQuestion['category'] | 'all') => void
}

export function useImmigration(): UseImmigrationReturn {
  const [questions, setQuestions] = useState<ImmigrationQuestion[]>(USCIS_QUESTIONS)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)

  const currentQuestion = questions[currentIndex] || null

  const byCategory = useCallback((category: ImmigrationQuestion['category']) => {
    return getQuestionsByCategory(category)
  }, [])

  const byDifficulty = useCallback((difficulty: ImmigrationQuestion['difficulty']) => {
    return getQuestionsByDifficulty(difficulty)
  }, [])

  const random = useCallback((count: number) => {
    setQuestions(getRandomQuestions(count))
    setCurrentIndex(0)
    setShowAnswer(false)
  }, [])

  const next = useCallback(() => {
    setCurrentIndex(prev => (prev + 1) % questions.length)
    setShowAnswer(false)
  }, [questions.length])

  const prev = useCallback(() => {
    setCurrentIndex(prev => (prev - 1 + questions.length) % questions.length)
    setShowAnswer(false)
  }, [questions.length])

  const toggleAnswer = useCallback(() => {
    setShowAnswer(prev => !prev)
  }, [])

  const setCategory = useCallback((category: ImmigrationQuestion['category'] | 'all') => {
    if (category === 'all') {
      setQuestions(USCIS_QUESTIONS)
    } else {
      setQuestions(getQuestionsByCategory(category))
    }
    setCurrentIndex(0)
    setShowAnswer(false)
  }, [])

  return {
    questions,
    currentQuestion,
    currentIndex,
    showAnswer,
    byCategory,
    byDifficulty,
    random,
    next,
    prev,
    toggleAnswer,
    categories: getCategoriesWithCounts(),
    setCategory
  }
}
