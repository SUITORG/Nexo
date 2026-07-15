import type { CEFRLevel } from '../types'
import { CEFR_COLORS, CEFR_LABELS } from '../utils/cefr'

interface Props {
  level: CEFRLevel
  compact?: boolean
}

export default function CEFRBadge({ level, compact }: Props) {
  const c = CEFR_COLORS[level]
  return (
    <span
      className="badge-cefr"
      style={{ backgroundColor: c.bg, color: c.text }}
      title={compact ? CEFR_LABELS[level] : undefined}
    >
      {level}
    </span>
  )
}
