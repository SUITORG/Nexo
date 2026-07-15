import { useState, useEffect, useCallback } from 'react'
import { getLatestNews, getNewsByCategory } from '../services/newsService'
import type { NewsArticle } from '../services/newsService'

interface UseNewsReturn {
  articles: NewsArticle[]
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
  getByCategory: (category: NewsArticle['category']) => Promise<NewsArticle[]>
}

export function useNews(): UseNewsReturn {
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchNews = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const news = await getLatestNews(30)
      setArticles(news)
    } catch (err) {
      setError('Failed to fetch news. Using cached content.')
      console.error('News fetch error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const getByCategory = useCallback(async (category: NewsArticle['category']) => {
    try {
      return await getNewsByCategory(category)
    } catch (err) {
      return articles.filter(a => a.category === category)
    }
  }, [articles])

  useEffect(() => {
    fetchNews()
  }, [fetchNews])

  return {
    articles,
    isLoading,
    error,
    refresh: fetchNews,
    getByCategory
  }
}
