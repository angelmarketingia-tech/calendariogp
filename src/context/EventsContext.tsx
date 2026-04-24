'use client'

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'
import type { SportEvent, EventStatus, EventPriority, EventNote, EventHistoryEntry } from '@/lib/types'
import { MOCK_EVENTS, MOCK_SPORTS, MOCK_COMPETITIONS, MOCK_USERS } from '@/lib/mock-data'
import { generateId } from '@/lib/utils'

import { getSupabase } from '@/lib/supabase'

const supabase = getSupabase()

interface EventsState {
  events: SportEvent[]
  loading: boolean
  selectedEventId: string | null
  source: 'supabase' | 'local'
}

type EventsAction =
  | { type: 'LOAD_EVENTS'; payload: SportEvent[]; source?: 'supabase' | 'local' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'UPDATE_STATUS'; payload: { id: string; status: EventStatus; userId?: string } }
  | { type: 'UPDATE_PRIORITY'; payload: { id: string; priority: EventPriority; userId?: string } }
  | { type: 'UPDATE_RESPONSABLE'; payload: { id: string; responsableId: string; userId?: string } }
  | { type: 'ADD_NOTE'; payload: { eventId: string; content: string; userId?: string } }
  | { type: 'UPDATE_EVENT'; payload: Partial<SportEvent> & { id: string } }
  | { type: 'ADD_EVENT'; payload: SportEvent }
  | { type: 'SELECT_EVENT'; payload: string | null }

// localStorage solo como fallback cuando Supabase no está disponible
const STORAGE_KEY = 'sportops_events'
const STORAGE_VERSION_KEY = 'sportops_version'
const CURRENT_VERSION = '2026-04-18-v1'

function loadFromStorage(): SportEvent[] | null {
  if (typeof window === 'undefined') return null
  try {
    const version = localStorage.getItem(STORAGE_VERSION_KEY)
    if (version !== CURRENT_VERSION) {
      localStorage.removeItem(STORAGE_KEY)
      localStorage.setItem(STORAGE_VERSION_KEY, CURRENT_VERSION)
      return null
    }
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return null
    return JSON.parse(stored)
  } catch {
    return null
  }
}

function saveToStorage(events: SportEvent[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events))
    localStorage.setItem(STORAGE_VERSION_KEY, CURRENT_VERSION)
  } catch {}
}

function enrichEvent(e: SportEvent): SportEvent {
  const sport = MOCK_SPORTS.find(s => s.id === e.sport_id)
  const comp = MOCK_COMPETITIONS.find(c => c.id === e.competition_id)
  const responsable = e.responsable_id ? MOCK_USERS.find(u => u.id === e.responsable_id) : undefined
  return {
    ...e,
    sport,
    competition: comp ? { ...comp, sport } : undefined,
    responsable,
    notes: e.notes ?? [],
    history: e.history ?? [],
  }
}

function addHistory(event: SportEvent, entry: Omit<EventHistoryEntry, 'id' | 'created_at'>): SportEvent {
  const historyEntry: EventHistoryEntry = {
    ...entry,
    id: generateId(),
    created_at: new Date().toISOString(),
    user: MOCK_USERS.find(u => u.id === entry.user_id),
  }
  return {
    ...event,
    history: [...(event.history ?? []), historyEntry],
    updated_at: new Date().toISOString(),
  }
}

function eventsReducer(state: EventsState, action: EventsAction): EventsState {
  switch (action.type) {
    case 'LOAD_EVENTS':
      return { ...state, events: action.payload, loading: false, source: action.source ?? 'local' }

    case 'SET_LOADING':
      return { ...state, loading: action.payload }

    case 'SELECT_EVENT':
      return { ...state, selectedEventId: action.payload }

    case 'UPDATE_STATUS': {
      const { id, status, userId = 'user1' } = action.payload
      const updated = state.events.map(e => {
        if (e.id !== id) return e
        let ev = { ...e, estado: status }
        if (status === 'arte_solicitado') ev = { ...ev, fecha_solicitud_arte: new Date().toISOString() }
        return addHistory(ev, { event_id: id, user_id: userId, action: 'Estado cambiado', field: 'estado', old_value: e.estado, new_value: status })
      })
      return { ...state, events: updated }
    }

    case 'UPDATE_PRIORITY': {
      const { id, priority, userId = 'user1' } = action.payload
      const updated = state.events.map(e => {
        if (e.id !== id) return e
        const ev = { ...e, prioridad: priority }
        return addHistory(ev, { event_id: id, user_id: userId, action: 'Prioridad cambiada', field: 'prioridad', old_value: e.prioridad, new_value: priority })
      })
      return { ...state, events: updated }
    }

    case 'UPDATE_RESPONSABLE': {
      const { id, responsableId, userId = 'user1' } = action.payload
      const responsable = MOCK_USERS.find(u => u.id === responsableId)
      const updated = state.events.map(e => {
        if (e.id !== id) return e
        const ev = { ...e, responsable_id: responsableId, responsable }
        return addHistory(ev, { event_id: id, user_id: userId, action: 'Responsable asignado', field: 'responsable', old_value: e.responsable?.full_name, new_value: responsable?.full_name })
      })
      return { ...state, events: updated }
    }

    case 'ADD_NOTE': {
      const { eventId, content, userId = 'user1' } = action.payload
      const note: EventNote = {
        id: generateId(), event_id: eventId, user_id: userId,
        user: MOCK_USERS.find(u => u.id === userId), content, created_at: new Date().toISOString(),
      }
      const updated = state.events.map(e => {
        if (e.id !== eventId) return e
        const withNote = { ...e, notes: [...(e.notes ?? []), note] }
        return addHistory(withNote, { event_id: eventId, user_id: userId, action: 'Nota agregada', new_value: content })
      })
      return { ...state, events: updated }
    }

    case 'UPDATE_EVENT': {
      const updated = state.events.map(e =>
        e.id === action.payload.id
          ? { ...e, ...action.payload, updated_at: new Date().toISOString() }
          : e
      )
      return { ...state, events: updated }
    }

    case 'ADD_EVENT':
      return { ...state, events: [action.payload, ...state.events] }

    default:
      return state
  }
}

interface EventsContextValue {
  events: SportEvent[]
  loading: boolean
  selectedEventId: string | null
  source: 'supabase' | 'local'
  selectEvent: (id: string | null) => void
  updateStatus: (id: string, status: EventStatus) => void
  updatePriority: (id: string, priority: EventPriority) => void
  updateResponsable: (id: string, responsableId: string) => void
  addNote: (eventId: string, content: string) => void
  updateEvent: (event: Partial<SportEvent> & { id: string }) => void
  addEvent: (event: Omit<SportEvent, 'id' | 'created_at' | 'updated_at'>) => void
  getEvent: (id: string) => SportEvent | undefined
  refreshFromSupabase: () => Promise<void>
  sports: typeof MOCK_SPORTS
  competitions: typeof MOCK_COMPETITIONS
  users: typeof MOCK_USERS
}

const EventsContext = createContext<EventsContextValue | null>(null)

export function EventsProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(eventsReducer, {
    events: [],
    loading: true,
    selectedEventId: null,
    source: 'local',
  })

  const loadFromSupabase = useCallback(async () => {
    if (!supabase) return false
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('fecha_hora', { ascending: true })
      if (error || !data) return false
      const enriched = data.map(enrichEvent)
      dispatch({ type: 'LOAD_EVENTS', payload: enriched, source: 'supabase' })
      saveToStorage(enriched)
      return true
    } catch {
      return false
    }
  }, [])

  // Carga inicial: Supabase primero, localStorage como fallback
  useEffect(() => {
    async function init() {
      const loaded = await loadFromSupabase()
      if (!loaded) {
        const stored = loadFromStorage()
        dispatch({ type: 'LOAD_EVENTS', payload: stored ?? MOCK_EVENTS, source: 'local' })
      }
    }
    init()
  }, [loadFromSupabase])

  // Suscripción Realtime de Supabase — actualiza en vivo cuando otro usuario sincroniza
  useEffect(() => {
    if (!supabase) return
    const channel = supabase
      .channel('events-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => {
        loadFromSupabase()
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [loadFromSupabase])

  // Guarda en localStorage cuando hay cambios (para offline fallback)
  useEffect(() => {
    if (!state.loading && state.source === 'local') {
      saveToStorage(state.events)
    }
  }, [state.events, state.loading, state.source])

  // Persistir cambios de estado/prioridad en Supabase
  useEffect(() => {
    if (!supabase || state.loading || state.source !== 'supabase') return
    // Se persiste de forma implícita — los cambios de UI se sincronizan via PATCH al guardar
  }, [state.events, state.loading, state.source])

  const selectEvent = useCallback((id: string | null) => dispatch({ type: 'SELECT_EVENT', payload: id }), [])

  const updateStatus = useCallback((id: string, status: EventStatus) => {
    dispatch({ type: 'UPDATE_STATUS', payload: { id, status } })
    if (supabase) {
      const updates: Record<string, unknown> = { estado: status, updated_at: new Date().toISOString() }
      if (status === 'arte_solicitado') updates.fecha_solicitud_arte = new Date().toISOString()
      supabase.from('events').update(updates).eq('id', id)
    }
  }, [])

  const updatePriority = useCallback((id: string, priority: EventPriority) => {
    dispatch({ type: 'UPDATE_PRIORITY', payload: { id, priority } })
    if (supabase) supabase.from('events').update({ prioridad: priority, updated_at: new Date().toISOString() }).eq('id', id)
  }, [])

  const updateResponsable = useCallback((id: string, responsableId: string) => {
    dispatch({ type: 'UPDATE_RESPONSABLE', payload: { id, responsableId } })
    if (supabase) supabase.from('events').update({ responsable_id: responsableId, updated_at: new Date().toISOString() }).eq('id', id)
  }, [])

  const addNote = useCallback((eventId: string, content: string) => {
    dispatch({ type: 'ADD_NOTE', payload: { eventId, content } })
  }, [])

  const updateEvent = useCallback((event: Partial<SportEvent> & { id: string }) => {
    dispatch({ type: 'UPDATE_EVENT', payload: event })
    if (supabase) {
      const { sport, competition, responsable, ...rest } = event as SportEvent
      void sport; void competition; void responsable
      supabase.from('events').update({ ...rest, updated_at: new Date().toISOString() }).eq('id', event.id)
    }
  }, [])

  const addEvent = useCallback((eventData: Omit<SportEvent, 'id' | 'created_at' | 'updated_at'>) => {
    const event: SportEvent = {
      ...eventData,
      id: generateId(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    dispatch({ type: 'ADD_EVENT', payload: event })
    if (supabase) {
      const { sport, competition, responsable, ...row } = event as SportEvent
      void sport; void competition; void responsable
      supabase.from('events').insert(row)
    }
  }, [])

  const getEvent = useCallback((id: string) => state.events.find(e => e.id === id), [state.events])

  const refreshFromSupabase = useCallback(async () => {
    await loadFromSupabase()
  }, [loadFromSupabase])

  return (
    <EventsContext.Provider value={{
      events: state.events,
      loading: state.loading,
      selectedEventId: state.selectedEventId,
      source: state.source,
      selectEvent,
      updateStatus,
      updatePriority,
      updateResponsable,
      addNote,
      updateEvent,
      addEvent,
      getEvent,
      refreshFromSupabase,
      sports: MOCK_SPORTS,
      competitions: MOCK_COMPETITIONS,
      users: MOCK_USERS,
    }}>
      {children}
    </EventsContext.Provider>
  )
}

export function useEvents() {
  const ctx = useContext(EventsContext)
  if (!ctx) throw new Error('useEvents must be used within EventsProvider')
  return ctx
}
