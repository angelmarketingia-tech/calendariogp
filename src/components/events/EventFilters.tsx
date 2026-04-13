'use client'

import { useEvents } from '@/context/EventsContext'
import type { EventFilters } from '@/lib/types'
import { TIME_RANGE_OPTIONS } from '@/lib/constants'
import { Search, X, SlidersHorizontal, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface Props {
  filters: EventFilters
  onChange: (filters: EventFilters) => void
}

export default function EventFiltersBar({ filters, onChange }: Props) {
  const { sports, competitions } = useEvents()
  const [expanded, setExpanded] = useState(false)

  const update = (patch: Partial<EventFilters>) => onChange({ ...filters, ...patch })

  const filteredComps = competitions.filter(
    c => !filters.sport_id || c.sport_id === filters.sport_id
  )

  const activeCount = [
    filters.sport_id,
    filters.competition_id,
    filters.country,
    filters.estado,
    filters.prioridad,
    filters.date_from,
    filters.date_to,
    filters.only_unmanaged ? 'x' : '',
    filters.time_range !== 'all' ? filters.time_range : '',
  ].filter(Boolean).length

  const resetFilters = () => onChange({
    sport_id: '', competition_id: '', country: '', date_from: '', date_to: '',
    estado: '', prioridad: '', only_unmanaged: false, time_range: 'all', search: filters.search,
  })

  return (
    <div className="card p-4 space-y-3">
      {/* Top row */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={filters.search}
            onChange={e => update({ search: e.target.value })}
            placeholder="Buscar evento, deporte, país..."
            className="w-full pl-9 pr-9 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/25 focus:border-brand bg-slate-50 placeholder:text-slate-400 transition-colors"
          />
          {filters.search && (
            <button
              onClick={() => update({ search: '' })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Time range */}
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1 flex-shrink-0 overflow-x-auto scrollbar-hide">
          {TIME_RANGE_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => update({ time_range: opt.value as EventFilters['time_range'] })}
              className={cn(
                'px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap',
                filters.time_range === opt.value
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Filters toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className={cn(
            'flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-bold transition-all flex-shrink-0',
            expanded || activeCount > 0
              ? 'bg-brand text-white border-brand shadow-brand'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          )}
        >
          <SlidersHorizontal size={14} />
          Filtros
          {activeCount > 0 && (
            <span className="bg-white/25 text-white text-[10px] px-1.5 py-0.5 rounded-full font-black">
              {activeCount}
            </span>
          )}
          <ChevronDown size={12} className={cn('transition-transform', expanded && 'rotate-180')} />
        </button>

        {activeCount > 0 && (
          <button
            onClick={resetFilters}
            className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            title="Limpiar filtros"
          >
            <X size={15} />
          </button>
        )}
      </div>

      {/* Expanded filters */}
      {expanded && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-3 border-t border-slate-100 animate-fade-in">
          {/* Sport */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Deporte</label>
            <select
              value={filters.sport_id}
              onChange={e => update({ sport_id: e.target.value, competition_id: '' })}
              className="w-full border border-slate-200 rounded-lg px-2 py-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand/25 text-slate-700"
            >
              <option value="">Todos</option>
              {sports.map(s => (
                <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
              ))}
            </select>
          </div>

          {/* Competition */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Competición</label>
            <select
              value={filters.competition_id}
              onChange={e => update({ competition_id: e.target.value })}
              className="w-full border border-slate-200 rounded-lg px-2 py-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand/25 text-slate-700"
              disabled={filteredComps.length === 0}
            >
              <option value="">Todas</option>
              {filteredComps.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Estado</label>
            <select
              value={filters.estado}
              onChange={e => update({ estado: e.target.value as any })}
              className="w-full border border-slate-200 rounded-lg px-2 py-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand/25 text-slate-700"
            >
              <option value="">Todos</option>
              <option value="pendiente">Pendiente</option>
              <option value="arte_solicitado">Arte Solicitado</option>
              <option value="declinado">Declinado</option>
            </select>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Prioridad</label>
            <select
              value={filters.prioridad}
              onChange={e => update({ prioridad: e.target.value as any })}
              className="w-full border border-slate-200 rounded-lg px-2 py-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand/25 text-slate-700"
            >
              <option value="">Todas</option>
              <option value="alta">🔴 Alta</option>
              <option value="media">🟡 Media</option>
              <option value="baja">🟢 Baja</option>
            </select>
          </div>

          {/* Date From */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Desde</label>
            <input
              type="date"
              value={filters.date_from}
              onChange={e => update({ date_from: e.target.value })}
              className="w-full border border-slate-200 rounded-lg px-2 py-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand/25 text-slate-700"
            />
          </div>

          {/* Date To */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Hasta</label>
            <input
              type="date"
              value={filters.date_to}
              onChange={e => update({ date_to: e.target.value })}
              className="w-full border border-slate-200 rounded-lg px-2 py-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand/25 text-slate-700"
            />
          </div>

          {/* Only unmanaged */}
          <div className="flex items-center col-span-2 lg:col-span-6">
            <label className="flex items-center gap-2.5 cursor-pointer group">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={filters.only_unmanaged}
                  onChange={e => update({ only_unmanaged: e.target.checked })}
                  className="sr-only"
                />
                <div className={cn(
                  'w-9 h-5 rounded-full transition-colors',
                  filters.only_unmanaged ? 'bg-brand' : 'bg-slate-200'
                )}>
                  <div className={cn(
                    'w-3.5 h-3.5 bg-white rounded-full shadow-sm transition-transform mt-0.75 ml-0.5 mt-[3px]',
                    filters.only_unmanaged ? 'translate-x-4' : 'translate-x-0'
                  )} />
                </div>
              </div>
              <span className="text-xs font-semibold text-slate-600 group-hover:text-slate-800 transition-colors">
                Solo eventos sin gestionar
              </span>
            </label>
          </div>
        </div>
      )}
    </div>
  )
}
