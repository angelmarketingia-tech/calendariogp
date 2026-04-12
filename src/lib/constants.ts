import type { EventStatus, EventPriority } from './types'

export const STATUS_CONFIG: Record<EventStatus, { label: string; color: string; bg: string; border: string; dot: string }> = {
  pendiente: {
    label: 'Pendiente',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    dot: 'bg-amber-400',
  },
  arte_solicitado: {
    label: 'Arte Solicitado',
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    dot: 'bg-blue-500',
  },
  declinado: {
    label: 'Declinado',
    color: 'text-gray-500',
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    dot: 'bg-gray-400',
  },
}

export const PRIORITY_CONFIG: Record<EventPriority, { label: string; color: string; bg: string; border: string }> = {
  alta: {
    label: 'Alta',
    color: 'text-red-700',
    bg: 'bg-red-50',
    border: 'border-red-200',
  },
  media: {
    label: 'Media',
    color: 'text-orange-700',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
  },
  baja: {
    label: 'Baja',
    color: 'text-green-700',
    bg: 'bg-green-50',
    border: 'border-green-200',
  },
}

export const CALENDAR_EVENT_COLORS: Record<EventStatus, string> = {
  pendiente: 'bg-amber-400 hover:bg-amber-500',
  arte_solicitado: 'bg-sky-500 hover:bg-sky-600',
  declinado: 'bg-slate-400 hover:bg-slate-500',
}

export const DEFAULT_FILTERS = {
  sport_id: '',
  competition_id: '',
  country: '',
  date_from: '',
  date_to: '',
  estado: '' as const,
  prioridad: '' as const,
  only_unmanaged: false,
  time_range: 'all' as const,
  search: '',
}

export const TIME_RANGE_OPTIONS = [
  { value: 'all', label: 'Todos los eventos' },
  { value: 'today', label: 'Hoy' },
  { value: 'next_3_days', label: 'Próximos 3 días' },
  { value: 'next_7_days', label: 'Próximos 7 días' },
  { value: 'next_15_days', label: 'Próximos 15 días' },
]

export const DAYS_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
export const MONTHS_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]
