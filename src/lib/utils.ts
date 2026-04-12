import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, isToday, isTomorrow, differenceInHours, isPast, isWithinInterval, addDays, startOfDay } from 'date-fns'
import { es } from 'date-fns/locale'
import type { SportEvent, EventFilters } from './types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr)
  return format(date, "d MMM yyyy 'a las' HH:mm", { locale: es })
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return format(date, 'd MMM yyyy', { locale: es })
}

export function formatTime(dateStr: string): string {
  const date = new Date(dateStr)
  return format(date, 'HH:mm')
}

export function getRelativeLabel(dateStr: string): string {
  const date = new Date(dateStr)
  if (isToday(date)) return 'Hoy'
  if (isTomorrow(date)) return 'Mañana'
  return format(date, 'EEEE d MMM', { locale: es })
}

export function isUrgent(dateStr: string, hoursThreshold = 24): boolean {
  const date = new Date(dateStr)
  const now = new Date()
  const hours = differenceInHours(date, now)
  return hours >= 0 && hours <= hoursThreshold
}

export function isEventPast(dateStr: string): boolean {
  return isPast(new Date(dateStr))
}

export function hoursUntilEvent(dateStr: string): number {
  return differenceInHours(new Date(dateStr), new Date())
}

export function filterEvents(events: SportEvent[], filters: EventFilters): SportEvent[] {
  const now = new Date()
  const today = startOfDay(now)

  return events.filter(event => {
    const eventDate = new Date(event.fecha_hora)

    // Time range filter
    if (filters.time_range !== 'all') {
      const ranges = {
        today: { start: today, end: addDays(today, 1) },
        next_3_days: { start: today, end: addDays(today, 3) },
        next_7_days: { start: today, end: addDays(today, 7) },
        next_15_days: { start: today, end: addDays(today, 15) },
      }
      const range = ranges[filters.time_range]
      if (!isWithinInterval(eventDate, range)) return false
    }

    // Date range filter
    if (filters.date_from && eventDate < new Date(filters.date_from)) return false
    if (filters.date_to && eventDate > new Date(filters.date_to)) return false

    // Sport filter
    if (filters.sport_id && event.sport_id !== filters.sport_id) return false

    // Competition filter
    if (filters.competition_id && event.competition_id !== filters.competition_id) return false

    // Country filter
    if (filters.country && !event.pais.toLowerCase().includes(filters.country.toLowerCase())) return false

    // Status filter
    if (filters.estado && event.estado !== filters.estado) return false

    // Priority filter
    if (filters.prioridad && event.prioridad !== filters.prioridad) return false

    // Only unmanaged
    if (filters.only_unmanaged && event.estado !== 'pendiente') return false

    // Search
    if (filters.search) {
      const q = filters.search.toLowerCase()
      const match =
        event.nombre_evento.toLowerCase().includes(q) ||
        event.sport?.name.toLowerCase().includes(q) ||
        event.competition?.name.toLowerCase().includes(q) ||
        event.pais.toLowerCase().includes(q)
      if (!match) return false
    }

    return true
  })
}

export function sortEvents(events: SportEvent[], field: string, direction: 'asc' | 'desc'): SportEvent[] {
  const priorityOrder: Record<string, number> = { alta: 0, media: 1, baja: 2 }
  const statusOrder: Record<string, number> = { pendiente: 0, arte_solicitado: 1, declinado: 2 }

  return [...events].sort((a, b) => {
    let comparison = 0
    switch (field) {
      case 'fecha_hora':
        comparison = new Date(a.fecha_hora).getTime() - new Date(b.fecha_hora).getTime()
        break
      case 'prioridad':
        comparison = priorityOrder[a.prioridad] - priorityOrder[b.prioridad]
        break
      case 'estado':
        comparison = statusOrder[a.estado] - statusOrder[b.estado]
        break
      case 'nombre_evento':
        comparison = a.nombre_evento.localeCompare(b.nombre_evento)
        break
      case 'sport':
        comparison = (a.sport?.name ?? '').localeCompare(b.sport?.name ?? '')
        break
    }
    return direction === 'asc' ? comparison : -comparison
  })
}

export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}
