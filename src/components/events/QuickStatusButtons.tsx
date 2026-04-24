'use client'

import { useEvents } from '@/context/EventsContext'
import { useToast } from '@/components/ui/Toast'
import type { EventStatus } from '@/lib/types'
import { cn } from '@/lib/utils'

interface Props {
  eventId: string
  currentStatus: EventStatus
  compact?: boolean
}

const actions: { status: EventStatus; label: string; short: string; classes: string; toast: string }[] = [
  {
    status: 'arte_solicitado',
    label: 'Arte solicitado',
    short: '✓ Arte',
    classes: 'bg-brand/10 border-brand/30 text-brand hover:bg-brand/20',
    toast: '🎨 Arte marcado como solicitado',
  },
  {
    status: 'declinado',
    label: 'Declinar',
    short: '✕',
    classes: 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100',
    toast: '✖️ Evento declinado',
  },
  {
    status: 'pendiente',
    label: 'Pendiente',
    short: '↺',
    classes: 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100',
    toast: '🕐 Evento vuelto a pendiente',
  },
]

export default function QuickStatusButtons({ eventId, currentStatus, compact = false }: Props) {
  const { updateStatus } = useEvents()
  const { showToast } = useToast()

  const available = actions.filter(a => a.status !== currentStatus)

  return (
    <div className={cn('flex gap-1', compact ? '' : 'flex-wrap')}>
      {available.map(action => (
        <button
          key={action.status}
          onClick={(e) => {
            e.stopPropagation()
            updateStatus(eventId, action.status)
            showToast(action.toast, action.status === 'declinado' ? 'error' : 'success')
          }}
          className={cn(
            'border rounded-lg font-bold transition-all text-xs active:scale-95',
            action.classes,
            compact ? 'px-2 py-1' : 'px-3 py-1.5'
          )}
          title={action.label}
        >
          {compact ? action.short : action.label}
        </button>
      ))}
    </div>
  )
}
