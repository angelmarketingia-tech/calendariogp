import { cn } from '@/lib/utils'
import { PRIORITY_CONFIG } from '@/lib/constants'
import type { EventPriority } from '@/lib/types'

interface Props {
  priority: EventPriority
  size?: 'sm' | 'md'
}

const icons: Record<EventPriority, string> = {
  alta: '●',
  media: '●',
  baja: '●',
}

export default function PriorityBadge({ priority, size = 'md' }: Props) {
  const cfg = PRIORITY_CONFIG[priority]
  return (
    <span className={cn(
      'badge font-semibold',
      cfg.color, cfg.bg, cfg.border,
      size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1'
    )}>
      {cfg.label}
    </span>
  )
}
