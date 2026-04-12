'use client'

import EventsTable from '@/components/events/EventsTable'
import EventModal from '@/components/events/EventModal'
import { useEvents } from '@/context/EventsContext'
import { useState } from 'react'
import AddEventModal from '@/components/events/AddEventModal'
import { Plus, Download, ListFilter, Activity } from 'lucide-react'

export default function EventsPage() {
  const { selectedEventId, events } = useEvents()
  const [showAdd, setShowAdd] = useState(false)

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
            <button
              onClick={exportCSV}
              className="btn-secondary"
            >
              <Download size={15} className="text-slate-500" />
              <span className="hidden sm:inline">Exportar CSV</span>
            </button>
            <button
              onClick={() => setShowAdd(true)}
              className="btn-primary"
            >
              <Plus size={15} strokeWidth={2.5} />
              <span className="hidden sm:inline">Nuevo Evento</span>
            </button>
          </div>
        </div>

        <EventsTable />
      </div>

      {selectedEventId && <EventModal />}
      {showAdd && <AddEventModal onClose={() => setShowAdd(false)} />}
    </>
  )
}
