import { ExternalLink, RefreshCw, Newspaper } from 'lucide-react'
import type { NewsArticle } from '../services/newsService'

interface Props {
  article: NewsArticle
  isLoading?: boolean
  onRefresh?: () => void
}

export default function NewsCard({ article, isLoading, onRefresh }: Props) {
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      politics: 'bg-red-900/30 text-red-300',
      health: 'bg-green-900/30 text-green-300',
      science: 'bg-blue-900/30 text-blue-300',
      weather: 'bg-yellow-900/30 text-yellow-300',
      business: 'bg-purple-900/30 text-purple-300',
      world: 'bg-neutral-800 text-neutral-300'
    }
    return colors[category] || colors.world
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    } catch {
      return dateString
    }
  }

  return (
    <div className="word-card space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <Newspaper size={16} className="text-blue-400" />
          <span className="text-xs font-semibold text-text-secondary">Real News from US</span>
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-1 rounded hover:bg-neutral-800 transition-colors text-text-secondary hover:text-neutral-200 disabled:opacity-50"
            title="Refresh news"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          </button>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${getCategoryColor(article.category)}`}>
            {article.category.toUpperCase()}
          </span>
          <span className="text-[10px] text-text-secondary">{article.source}</span>
        </div>

        <h3 className="text-sm font-semibold leading-tight">{article.title}</h3>

        <p className="text-xs text-text-secondary leading-relaxed">{article.summary}</p>

        <div className="flex items-center justify-between pt-2">
          <span className="text-[10px] text-text-secondary">{formatDate(article.publishedAt)}</span>
          {article.url && (
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300 transition-colors"
            >
              Read more <ExternalLink size={10} />
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
