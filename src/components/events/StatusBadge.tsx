import { cn } from '@/lib/utils'
import { STATUS_CONFIG } from '@/lib/constants'
import type { EventStatus } from '@/lib/types'

interface Props {
  status: EventStatus
  size?: 'sm' | 'md'
  dot?: boolean
}

export default function StatusBadge({ status, size = 'md', dot = true }: Props) {
  const cfg = STATUS_CONFIG[status]
  return (
    <span className={cn(
      'badge font-semibold',
      cfg.color, cfg.bg, cfg.border,
      size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1'
    )}>
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', cfg.dot)} />}
      {cfg.label}
    </span>
  )
}
