'use client'

import { useState, useMemo } from 'react'
import { useEvents } from '@/context/EventsContext'
import { filterEvents, sortEvents, formatDate, formatTime, isUrgent, cn } from '@/lib/utils'
import type { EventFilters, SortField, SortDirection } from '@/lib/types'
import StatusBadge from './StatusBadge'
import PriorityBadge from './PriorityBadge'
import QuickStatusButtons from './QuickStatusButtons'
import EventFiltersBar from './EventFilters'
import { DEFAULT_FILTERS } from '@/lib/constants'
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronRight, AlertTriangle, Search } from 'lucide-react'

function SortIcon({ field, current, direction }: { field: string; current: string; direction: SortDirection }) {
  if (field !== current) return <ArrowUpDown size={12} className="text-slate-300" />
  return direction === 'asc'
    ? <ArrowUp size={12} className="text-brand" />
    : <ArrowDown size={12} className="text-brand" />
}

export default function EventsTable() {
  const { events, selectEvent } = useEvents()
  const [filters, setFilters] = useState<EventFilters>(DEFAULT_FILTERS)
  const [sortField, setSortField] = useState<SortField>('fecha_hora')
  const [sortDir, setSortDir] = useState<SortDirection>('asc')

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const filtered = useMemo(() =>
    sortEvents(filterEvents(events, filters), sortField, sortDir),
    [events, filters, sortField, sortDir]
  )

  const columns: { key: SortField | 'actions'; label: string; sortable?: boolean; width?: string }[] = [
    { key: 'fecha_hora', label: 'Fecha / Hora', sortable: true, width: 'w-36' },
    { key: 'sport', label: 'Deporte', sortable: true },
    { key: 'nombre_evento', label: 'Evento', sortable: true },
    { key: 'prioridad', label: 'Prioridad', sortable: true, width: 'w-28' },
    { key: 'estado', label: 'Estado', sortable: true, width: 'w-36' },
    { key: 'actions', label: 'Acciones', width: 'w-32' },
  ]

  return (
    <div className="space-y-4">
      <EventFiltersBar filters={filters} onChange={setFilters} />

      <div className="card overflow-hidden">
        {/* Results header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <p className="text-sm text-slate-600">
              <span className="font-bold text-slate-900">{filtered.length}</span> eventos
              {filtered.length !== events.length && (
                <span className="text-slate-400"> de {events.length}</span>
              )}
            </p>
            {filtered.length === 0 && filters.search && (
              <span className="text-xs text-slate-400">— sin resultados para «{filters.search}»</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
              Urgente 24h
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              Pendiente
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-white">
                {columns.map(col => (
                  <th
                    key={col.key}
                    className={cn(
                      'text-left px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider',
                      col.sortable && 'cursor-pointer hover:text-brand select-none transition-colors',
                      col.width
                    )}
                    onClick={() => col.sortable && handleSort(col.key as SortField)}
                  >
                    <span className="flex items-center gap-1.5">
                      {col.label}
                      {col.sortable && (
                        <SortIcon field={col.key} current={sortField} direction={sortDir} />
                      )}
                    </span>
                  </th>
                ))}
                <th className="px-4 py-3 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
                        <Search size={22} className="text-slate-300" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-500 text-sm">Sin resultados</p>
                        <p className="text-slate-400 text-xs mt-0.5">Prueba ajustando los filtros</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map(event => {
                  const urgent = isUrgent(event.fecha_hora, 24) && event.estado === 'pendiente'
                  return (
                    <tr
                      key={event.id}
                      className={cn(
                        'hover:bg-slate-50 transition-colors group',
                        urgent && 'bg-red-50/30'
                      )}
                    >
                      {/* Date */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {urgent && (
                            <AlertTriangle size={12} className="text-red-400 flex-shrink-0" />
                          )}
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{formatDate(event.fecha_hora)}</p>
                            <p className="text-xs text-slate-400 font-medium">{formatTime(event.fecha_hora)}</p>
                          </div>
                        </div>
                      </td>

                      {/* Sport */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-base w-6">{event.sport?.icon}</span>
                          <div className="min-w-0">
                            <p className="text-sm text-slate-700 font-medium truncate">{event.sport?.name ?? '—'}</p>
                            <p className="text-xs text-slate-400 truncate max-w-[120px]">{event.competition?.name}</p>
                          </div>
                        </div>
                      </td>

                      {/* Event Name */}
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900 max-w-xs truncate">
                            {event.nombre_evento}
                          </p>
                          <p className="text-xs text-slate-400">
                            {event.pais}{event.region ? ` · ${event.region}` : ''}
                          </p>
                        </div>
                      </td>

                      {/* Priority */}
                      <td className="px-4 py-3">
                        <PriorityBadge priority={event.prioridad} size="sm" />
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <StatusBadge status={event.estado} size="sm" />
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <QuickStatusButtons
                          eventId={event.id}
                          currentStatus={event.estado}
                          compact
                        />
                      </td>

                      {/* Detail */}
                      <td className="px-3 py-3">
                        <button
                          onClick={() => selectEvent(event.id)}
                          className="p-1.5 rounded-lg text-slate-200 hover:text-brand hover:bg-brand/10 transition-colors opacity-0 group-hover:opacity-100"
                          title="Ver detalle"
                        >
                          <ChevronRight size={15} />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
