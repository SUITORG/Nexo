import { useCallback } from 'react'
import { Volume2, MessageSquare } from 'lucide-react'
import type { Conversation } from '../types'
import CEFRBadge from './CEFRBadge'
import { useTTS } from '../hooks/useTTS'

interface Props {
  conversation: Conversation
  showTranslation: boolean
}

export default function ConversationCard({ conversation, showTranslation }: Props) {
  const { speak, isSupported } = useTTS()

  const handleSpeakLine = useCallback((text: string) => speak(text), [speak])

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <MessageSquare size={16} className="text-blue-400" />
        <h2 className="text-sm font-semibold">{conversation.title}</h2>
        <CEFRBadge level={conversation.level} compact />
      </div>
      <p className="text-[11px] text-text-secondary mb-3 italic">{conversation.situation}</p>

      <div className="space-y-2">
        {conversation.lines.map((line, i) => (
          <div key={i} className={`conversation-line ${line.speaker === 'A' ? 'speaker-a' : 'speaker-b'}`}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                  {line.speaker === 'A' ? 'Tú' : 'Otra persona'}
                </span>
                <p className="text-sm mt-0.5">{line.text}</p>
                {showTranslation && (
                  <p className="text-xs text-text-secondary mt-0.5">{line.textEs}</p>
                )}
              </div>
              {isSupported && (
                <button
                  onClick={() => handleSpeakLine(line.text)}
                  className="text-text-secondary hover:text-blue-400 transition-colors shrink-0 mt-1"
                  title="Escuchar"
                >
                  <Volume2 size={13} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
