import { useState, useMemo } from 'react'
import { Search, Plane, UtensilsCrossed, Stethoscope, Briefcase, Heart, Building, ShoppingBag, Map, Phone, CloudSun, Landmark, Play, Languages, Sparkles } from 'lucide-react'
import type { Topic } from '../types'
import { getTopicsByCategory, searchTopics } from '../data'

const ICON_MAP: Record<string, typeof Plane> = {
  plane: Plane, 'utensils-crossed': UtensilsCrossed, stethoscope: Stethoscope,
  briefcase: Briefcase, heart: Heart, building: Building, 'shopping-bag': ShoppingBag,
  map: Map, phone: Phone, 'cloud-sun': CloudSun, landmark: Landmark,
  play: Play, languages: Languages,
}

interface Props {
  currentTopic: string | null
  customTopic: string
  onSelect: (topicId: string | null) => void
  onCustomTopic: (topic: string) => void
}

export default function TopicSelector({ currentTopic, customTopic, onSelect, onCustomTopic }: Props) {
  const [query, setQuery] = useState('')
  const filtered = useMemo(() => {
    if (!query.trim()) return null
    return searchTopics(query)
  }, [query])

  const categories = useMemo(() => getTopicsByCategory(), [])

  return (
    <div className="flex flex-col h-full bg-surface border-r border-border" style={{ width: 220 }}>
      <div className="p-2 border-b border-border">
        <div className="relative">
          <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar tema..."
            className="w-full bg-surface-2 border border-border rounded-md pl-7 pr-3 py-1.5 text-xs outline-none focus:border-blue-600 transition-colors placeholder:text-text-secondary"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered !== null ? (
          <div className="p-2 space-y-0.5">
            {filtered.length === 0 && (
              <p className="text-xs text-text-secondary text-center py-4">Sin resultados</p>
            )}
            {filtered.map(t => (
              <TopicItem key={t.id} topic={t} active={currentTopic === t.id} onSelect={onSelect} />
            ))}
          </div>
        ) : (
          Array.from(categories.entries()).map(([cat, items]) => (
            <div key={cat} className="py-1">
              <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-text-secondary">
                {cat}
              </div>
              <div className="space-y-0.5">
                {items.map(t => (
                  <TopicItem key={t.id} topic={t} active={currentTopic === t.id} onSelect={onSelect} />
                ))}
              </div>
            </div>
          ))
        )}

        <div className="border-t border-border mt-2 pt-2 px-3 pb-2">
          <div
            onClick={() => onSelect(null)}
            className={`topic-item flex items-center gap-2 ${currentTopic === null && !customTopic ? 'active' : ''}`}
          >
            <Sparkles size={14} className="text-amber-400" />
            <span>Aleatorio</span>
          </div>
          <div className="mt-2">
            <input
              type="text"
              value={customTopic}
              onChange={e => onCustomTopic(e.target.value)}
              placeholder="Escribe un tema libre..."
              className="w-full bg-surface-2 border border-border rounded-md px-2.5 py-1.5 text-xs outline-none focus:border-blue-600 transition-colors placeholder:text-text-secondary"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function TopicItem({ topic, active, onSelect }: { topic: Topic; active: boolean; onSelect: (id: string) => void }) {
  const Icon = ICON_MAP[topic.icon] ?? Play
  return (
    <div
      onClick={() => onSelect(topic.id)}
      className={`topic-item flex items-center gap-2 ${active ? 'active' : ''}`}
      title={topic.description}
    >
      <Icon size={14} className="text-text-secondary shrink-0" />
      <span className="truncate text-xs">{topic.nameEs}</span>
    </div>
  )
}
