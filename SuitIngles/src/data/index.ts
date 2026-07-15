import type { Topic, VocabularyItem, Conversation, GrammarNote } from '../types'
import topicsData from './topics.json'
import vocabularyData from './vocabulary.json'
import conversationsData from './conversations.json'
import grammarNotesData from './grammar-notes.json'

export const topics = topicsData as Topic[]
export const vocabulary = vocabularyData as VocabularyItem[]
export const conversations = conversationsData as Conversation[]
export const grammarNotes = grammarNotesData as GrammarNote[]

export const vocabularyMap = new Map(vocabulary.map(v => [v.id, v]))
export const conversationsMap = new Map(conversations.map(c => [c.id, c]))
export const grammarNotesMap = new Map(grammarNotes.map(g => [g.id, g]))

export function getTopicById(id: string): Topic | undefined {
  return topics.find(t => t.id === id)
}

export function getContentForTopic(topicId: string) {
  const topic = getTopicById(topicId)
  if (!topic) return { vocabulary: [], conversations: [], grammarNotes: [] }
  return {
    vocabulary: topic.vocabularyIds.map(id => vocabularyMap.get(id)).filter(Boolean) as VocabularyItem[],
    conversations: topic.conversationIds.map(id => conversationsMap.get(id)).filter(Boolean) as Conversation[],
    grammarNotes: topic.grammarNoteIds.map(id => grammarNotesMap.get(id)).filter(Boolean) as GrammarNote[],
  }
}

export function searchTopics(query: string): Topic[] {
  const q = query.toLowerCase()
  return topics.filter(
    t =>
      t.name.toLowerCase().includes(q) ||
      t.nameEs.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q) ||
      t.tags?.some(tag => tag.toLowerCase().includes(q))
  )
}

export function getTopicsByCategory(): Map<string, Topic[]> {
  const grouped = new Map<string, Topic[]>()
  for (const t of topics) {
    const cat = t.category || 'General'
    if (!grouped.has(cat)) grouped.set(cat, [])
    grouped.get(cat)!.push(t)
  }
  return grouped
}
