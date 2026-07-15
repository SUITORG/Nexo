// News Service - Fetches real news from US newspapers
// Sources: Reuters, AP News, NPR, CNN, BBC US

export interface NewsArticle {
  id: string
  title: string
  summary: string
  source: string
  category: 'politics' | 'science' | 'health' | 'weather' | 'business' | 'world'
  publishedAt: string
  url: string
  imageUrl?: string
}

// RSS Feed URLs from major US newspapers (no API key required)
const RSS_FEEDS = {
  reuters: {
    politics: 'https://feeds.reuters.com/reuters/politicsNews',
    science: 'https://feeds.reuters.com/reuters/scienceNews',
    health: 'https://feeds.reuters.com/reuters/healthNews',
    world: 'https://feeds.reuters.com/reuters/worldNews',
  },
  npr: {
    politics: 'https://feeds.npr.org/1014/rss.xml',
    science: 'https://feeds.npr.org/1007/rss.xml',
    health: 'https://feeds.npr.org/1032/rss.xml',
  },
  bbc: {
    us: 'https://feeds.bbci.co.uk/news/world/us_and_canada/rss.xml',
    science: 'https://feeds.bbci.co.uk/news/science_and_environment/rss.xml',
    health: 'https://feeds.bbci.co.uk/news/health/rss.xml',
  }
}

// Parse RSS XML to extract articles
function parseRSS(xml: string, source: string): NewsArticle[] {
  const articles: NewsArticle[] = []
  const parser = new DOMParser()
  const doc = parser.parseFromString(xml, 'text/xml')
  const items = doc.querySelectorAll('item')

  items.forEach((item, index) => {
    const title = item.querySelector('title')?.textContent || ''
    const description = item.querySelector('description')?.textContent || ''
    const link = item.querySelector('link')?.textContent || ''
    const pubDate = item.querySelector('pubDate')?.textContent || ''

    // Clean HTML from description
    const cleanDescription = description.replace(/<[^>]*>/g, '').substring(0, 300)

    articles.push({
      id: `${source}-${Date.now()}-${index}`,
      title,
      summary: cleanDescription,
      source,
      category: categorizeArticle(title + ' ' + cleanDescription),
      publishedAt: pubDate,
      url: link
    })
  })

  return articles
}

// Categorize article based on keywords
function categorizeArticle(text: string): NewsArticle['category'] {
  const lowerText = text.toLowerCase()

  if (lowerText.includes('election') || lowerText.includes('president') || lowerText.includes('congress') ||
      lowerText.includes('senate') || lowerText.includes('vote') || lowerText.includes('campaign') ||
      lowerText.includes('republican') || lowerText.includes('democrat')) {
    return 'politics'
  }

  if (lowerText.includes('vaccine') || lowerText.includes('covid') || lowerText.includes('pandemic') ||
      lowerText.includes('health') || lowerText.includes('hospital') || lowerText.includes('fda') ||
      lowerText.includes('who') || lowerText.includes('medical')) {
    return 'health'
  }

  if (lowerText.includes('science') || lowerText.includes('research') || lowerText.includes('technology') ||
      lowerText.includes('ai') || lowerText.includes('space') || lowerText.includes('climate')) {
    return 'science'
  }

  if (lowerText.includes('weather') || lowerText.includes('temperature') || lowerText.includes('storm') ||
      lowerText.includes('hurricane') || lowerText.includes('tornado') || lowerText.includes('heat')) {
    return 'weather'
  }

  return 'world'
}

// Fetch with CORS proxy (for client-side)
async function fetchWithProxy(url: string): Promise<string> {
  const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`
  const response = await fetch(proxyUrl)
  if (!response.ok) throw new Error(`Failed to fetch: ${response.statusText}`)
  return response.text()
}

// Fetch news from all sources
export async function fetchAllNews(): Promise<NewsArticle[]> {
  const allArticles: NewsArticle[] = []

  const fetchPromises = Object.entries(RSS_FEEDS).flatMap(([source, feeds]) =>
    Object.entries(feeds).map(async ([category, url]) => {
      try {
        const xml = await fetchWithProxy(url)
        const articles = parseRSS(xml, source)
        return articles.slice(0, 5) // Limit per feed
      } catch (error) {
        console.warn(`Failed to fetch ${source}/${category}:`, error)
        return []
      }
    })
  )

  const results = await Promise.allSettled(fetchPromises)
  results.forEach(result => {
    if (result.status === 'fulfilled') {
      allArticles.push(...result.value)
    }
  })

  return allArticles
}

// Get news by category
export async function getNewsByCategory(category: NewsArticle['category']): Promise<NewsArticle[]> {
  const allNews = await fetchAllNews()
  return allNews.filter(article => article.category === category)
}

// Get latest news (sorted by date)
export async function getLatestNews(limit: number = 20): Promise<NewsArticle[]> {
  const allNews = await fetchAllNews()
  return allNews
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, limit)
}
