'use client'

import EventsTable from '@/components/events/EventsTable'
import EventModal from '@/components/events/EventModal'
import { useEvents } from '@/context/EventsContext'
import { useAuth } from '@/context/AuthContext'
import { useState, useCallback, Suspense } from 'react'
import AddEventModal from '@/components/events/AddEventModal'
import { Plus, Download, Activity } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import type { EventFilters } from '@/lib/types'
import { DEFAULT_FILTERS } from '@/lib/constants'

function EventsPageInner() {
  const { selectedEventId, events } = useEvents()
  const { user } = useAuth()
  const [showAdd, setShowAdd] = useState(false)
  const searchParams = useSearchParams()

  // Build initial filters from URL query params (from KPI card links)
  const buildInitialFilters = useCallback((): EventFilters => {
    const estado = searchParams.get('estado')
    const urgente = searchParams.get('urgente')

    const filters: EventFilters = { ...DEFAULT_FILTERS }

    if (estado === 'pendiente' || estado === 'arte_solicitado' || estado === 'declinado') {
      filters.estado = estado
    }
    if (urgente === '24h') {
      filters.time_range = 'today'
      filters.estado = 'pendiente'
    } else if (urgente === '3d') {
      filters.time_range = 'next_3_days'
      filters.estado = 'pendiente'
    }

    return filters
  }, [searchParams])

  const [initialFilters] = useState<EventFilters>(buildInitialFilters)

  const exportCSV = () => {
    const headers = ['Fecha', 'Hora', 'Deporte', 'Competición', 'Evento', 'País', 'Prioridad', 'Estado', 'Responsable']
    const rows = events.map(e => [
      new Date(e.fecha_hora).toLocaleDateString('es-ES'),
      new Date(e.fecha_hora).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      e.sport?.name ?? '',
      e.competition?.name ?? '',
      e.nombre_evento,
      e.pais,
      e.prioridad,
      e.estado,
      e.responsable?.full_name ?? '',
    ])
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `metricas-ia-eventos-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Detect active filter banner text from URL params
  const filterBanner = (() => {
    const estado = searchParams.get('estado')
    const urgente = searchParams.get('urgente')
    if (urgente === '24h') return '⚡ Mostrando eventos urgentes de las próximas 24 horas'
    if (urgente === '3d') return '⚠️ Mostrando eventos urgentes de los próximos 3 días'
    if (estado === 'pendiente') return '🕐 Mostrando eventos pendientes'
    if (estado === 'arte_solicitado') return '🎨 Mostrando eventos con arte solicitado'
    if (estado === 'declinado') return '✖️ Mostrando eventos declinados'
    return null
  })()

  return (
    <>
      <div className="p-6 md:p-8 space-y-5 max-w-[1440px] mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Activity size={16} className="text-brand" />
              <span className="text-xs font-bold text-brand uppercase tracking-widest">Gestión</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Tabla de Eventos</h1>
            <p className="text-slate-500 text-sm font-medium mt-0.5">
              {events.length} eventos registrados en el sistema
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            {user?.canExportCSV && (
              <button
                onClick={exportCSV}
                className="btn-secondary"
              >
                <Download size={15} className="text-slate-500" />
                <span className="hidden sm:inline">Exportar CSV</span>
              </button>
            )}
            <button
              onClick={() => setShowAdd(true)}
              className="btn-primary"
            >
              <Plus size={15} strokeWidth={2.5} />
              <span className="hidden sm:inline">Nuevo Evento</span>
            </button>
          </div>
        </div>

        {/* Active filter banner */}
        {filterBanner && (
          <div className="flex items-center gap-2.5 px-4 py-2.5 bg-brand/5 border border-brand/15 rounded-xl text-sm font-medium text-brand animate-fade-in">
            <span>{filterBanner}</span>
          </div>
        )}

        <EventsTable initialFilters={initialFilters} />
      </div>

      {selectedEventId && <EventModal />}
      {showAdd && <AddEventModal onClose={() => setShowAdd(false)} />}
    </>
  )
}

export default function EventsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-400">Cargando...</div>}>
      <EventsPageInner />
    </Suspense>
  )
}
