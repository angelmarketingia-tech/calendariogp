'use client'

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react'
import type { SportEvent, EventStatus, EventPriority, EventNote, EventHistoryEntry } from '@/lib/types'
import { MOCK_EVENTS, MOCK_SPORTS, MOCK_COMPETITIONS, MOCK_USERS } from '@/lib/mock-data'
import { generateId } from '@/lib/utils'

interface EventsState {
  events: SportEvent[]
  loading: boolean
  selectedEventId: string | null
}

type EventsAction =
  | { type: 'LOAD_EVENTS'; payload: SportEvent[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'UPDATE_STATUS'; payload: { id: string; status: EventStatus; userId?: string } }
  | { type: 'UPDATE_PRIORITY'; payload: { id: string; priority: EventPriority; userId?: string } }
  | { type: 'UPDATE_RESPONSABLE'; payload: { id: string; responsableId: string; userId?: string } }
  | { type: 'ADD_NOTE'; payload: { eventId: string; content: string; userId?: string } }
  | { type: 'UPDATE_EVENT'; payload: Partial<SportEvent> & { id: string } }
  | { type: 'ADD_EVENT'; payload: SportEvent }
  | { type: 'SELECT_EVENT'; payload: string | null }

const STORAGE_KEY = 'sportops_events'
const STORAGE_VERSION_KEY = 'sportops_version'
const CURRENT_VERSION = '2026-04-12-v3' // directora de marketing

function loadFromStorage(): SportEvent[] | null {
  if (typeof window === 'undefined') return null
  try {
    const version = localStorage.getItem(STORAGE_VERSION_KEY)
    if (version !== CURRENT_VERSION) {
      // nueva versión de datos → resetear
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
  } catch {
    // ignore
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
      return { ...state, events: action.payload, loading: false }

    case 'SET_LOADING':
      return { ...state, loading: action.payload }

    case 'SELECT_EVENT':
      return { ...state, selectedEventId: action.payload }

    case 'UPDATE_STATUS': {
      const { id, status, userId = 'user1' } = action.payload
      const updated = state.events.map(e => {
        if (e.id !== id) return e
        let ev = { ...e, estado: status }
        if (status === 'arte_solicitado') {
          ev = { ...ev, fecha_solicitud_arte: new Date().toISOString() }
        }
        return addHistory(ev, {
          event_id: id,
          user_id: userId,
          action: 'Estado cambiado',
          field: 'estado',
          old_value: e.estado,
          new_value: status,
        })
      })
      return { ...state, events: updated }
    }

    case 'UPDATE_PRIORITY': {
      const { id, priority, userId = 'user1' } = action.payload
      const updated = state.events.map(e => {
        if (e.id !== id) return e
        const ev = { ...e, prioridad: priority }
        return addHistory(ev, {
          event_id: id,
          user_id: userId,
          action: 'Prioridad cambiada',
          field: 'prioridad',
          old_value: e.prioridad,
          new_value: priority,
        })
      })
      return { ...state, events: updated }
    }

    case 'UPDATE_RESPONSABLE': {
      const { id, responsableId, userId = 'user1' } = action.payload
      const responsable = MOCK_USERS.find(u => u.id === responsableId)
      const updated = state.events.map(e => {
        if (e.id !== id) return e
        const ev = { ...e, responsable_id: responsableId, responsable }
        return addHistory(ev, {
          event_id: id,
          user_id: userId,
          action: 'Responsable asignado',
          field: 'responsable',
          old_value: e.responsable?.full_name,
          new_value: responsable?.full_name,
        })
      })
      return { ...state, events: updated }
    }

    case 'ADD_NOTE': {
      const { eventId, content, userId = 'user1' } = action.payload
      const note: EventNote = {
        id: generateId(),
        event_id: eventId,
        user_id: userId,
        user: MOCK_USERS.find(u => u.id === userId),
        content,
        created_at: new Date().toISOString(),
      }
      const updated = state.events.map(e => {
        if (e.id !== eventId) return e
        const withNote = { ...e, notes: [...(e.notes ?? []), note] }
        const ev = addHistory(withNote, {
          event_id: eventId,
          user_id: userId,
          action: 'Nota agregada',
          new_value: content,
        })
        return ev
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
  selectEvent: (id: string | null) => void
  updateStatus: (id: string, status: EventStatus) => void
  updatePriority: (id: string, priority: EventPriority) => void
  updateResponsable: (id: string, responsableId: string) => void
  addNote: (eventId: string, content: string) => void
  updateEvent: (event: Partial<SportEvent> & { id: string }) => void
  addEvent: (event: Omit<SportEvent, 'id' | 'created_at' | 'updated_at'>) => void
  getEvent: (id: string) => SportEvent | undefined
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
  })

  useEffect(() => {
    const stored = loadFromStorage()
    dispatch({ type: 'LOAD_EVENTS', payload: stored ?? MOCK_EVENTS })
  }, [])

  useEffect(() => {
    if (!state.loading) {
      saveToStorage(state.events)
    }
  }, [state.events, state.loading])

  const selectEvent = useCallback((id: string | null) => {
    dispatch({ type: 'SELECT_EVENT', payload: id })
  }, [])

  const updateStatus = useCallback((id: string, status: EventStatus) => {
    dispatch({ type: 'UPDATE_STATUS', payload: { id, status } })
  }, [])

  const updatePriority = useCallback((id: string, priority: EventPriority) => {
    dispatch({ type: 'UPDATE_PRIORITY', payload: { id, priority } })
  }, [])

  const updateResponsable = useCallback((id: string, responsableId: string) => {
    dispatch({ type: 'UPDATE_RESPONSABLE', payload: { id, responsableId } })
  }, [])

  const addNote = useCallback((eventId: string, content: string) => {
    dispatch({ type: 'ADD_NOTE', payload: { eventId, content } })
  }, [])

  const updateEvent = useCallback((event: Partial<SportEvent> & { id: string }) => {
    dispatch({ type: 'UPDATE_EVENT', payload: event })
  }, [])

  const addEvent = useCallback((eventData: Omit<SportEvent, 'id' | 'created_at' | 'updated_at'>) => {
    const event: SportEvent = {
      ...eventData,
      id: generateId(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    dispatch({ type: 'ADD_EVENT', payload: event })
  }, [])

  const getEvent = useCallback((id: string) => {
    return state.events.find(e => e.id === id)
  }, [state.events])

  return (
    <EventsContext.Provider value={{
      events: state.events,
      loading: state.loading,
      selectedEventId: state.selectedEventId,
      selectEvent,
      updateStatus,
      updatePriority,
      updateResponsable,
      addNote,
      updateEvent,
      addEvent,
      getEvent,
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
