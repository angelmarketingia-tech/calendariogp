'use client'

import CalendarView from '@/components/calendar/CalendarView'
import EventModal from '@/components/events/EventModal'
import AddEventModal from '@/components/events/AddEventModal'
import { useEvents } from '@/context/EventsContext'
import { CalendarDays, Activity, Plus } from 'lucide-react'
import { useState } from 'react'

export default function CalendarPage() {
  const { selectedEventId } = useEvents()
  const [showAdd, setShowAdd] = useState(false)

  return (
    <>
      <div className="p-6 md:p-8 space-y-5 max-w-[1440px] mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Activity size={16} className="text-brand" />
              <span className="text-xs font-bold text-brand uppercase tracking-widest">Visualización</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Calendario Deportivo</h1>
            <p className="text-slate-500 text-sm font-medium mt-0.5">Vista cronológica de todos los eventos</p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="btn-primary flex-shrink-0"
          >
            <Plus size={15} strokeWidth={2.5} />
            <span className="hidden sm:inline">Nuevo Evento</span>
          </button>
        </div>

        <CalendarView />
      </div>

      {selectedEventId && <EventModal />}
      {showAdd && <AddEventModal onClose={() => setShowAdd(false)} />}
    </>
  )
}
