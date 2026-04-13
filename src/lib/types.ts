export type EventStatus = 'pendiente' | 'arte_solicitado' | 'declinado'
export type EventPriority = 'alta' | 'media' | 'baja'
export type EventSource = 'manual' | 'api' | 'import'

export interface Sport {
  id: string
  name: string
  icon: string
  color: string
}

export interface Competition {
  id: string
  name: string
  sport_id: string
  sport?: Sport
  country: string
  logo_url?: string
}

export interface UserProfile {
  id: string
  full_name: string
  email: string
  avatar_url?: string
  role: 'admin' | 'operator' | 'viewer'
}

export interface EventNote {
  id: string
  event_id: string
  user_id: string
  user?: UserProfile
  content: string
  created_at: string
}

export interface EventHistoryEntry {
  id: string
  event_id: string
  user_id: string
  user?: UserProfile
  action: string
  field?: string
  old_value?: string
  new_value?: string
  created_at: string
}

export interface SportEvent {
  id: string
  nombre_evento: string
  sport_id: string
  sport?: Sport
  competition_id: string
  competition?: Competition
  fecha_hora: string
  pais: string
  region?: string
  prioridad: EventPriority
  estado: EventStatus
  responsable_id?: string
  responsable?: UserProfile
  fecha_solicitud_arte?: string
  enviado_equipo_creativo: boolean
  source: EventSource
  external_id?: string
  notes?: EventNote[]
  history?: EventHistoryEntry[]
  created_at: string
  updated_at: string
}

export interface EventFilters {
  sport_id: string
  competition_id: string
  country: string
  date_from: string
  date_to: string
  estado: EventStatus | ''
  prioridad: EventPriority | ''
  only_unmanaged: boolean
  time_range: 'today' | 'next_3_days' | 'next_7_days' | 'next_15_days' | 'all'
  search: string
}

export interface EventStats {
  total: number
  pendiente: number
  arte_solicitado: number
  declinado: number
  urgent_24h: number
  urgent_3_days: number
}

export type SortField = 'fecha_hora' | 'prioridad' | 'estado' | 'nombre_evento' | 'sport'
export type SortDirection = 'asc' | 'desc'
