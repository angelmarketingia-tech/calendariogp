'use client'

import { useState, useEffect } from 'react'
import { useEvents } from '@/context/EventsContext'
import { useToast } from '@/components/ui/Toast'
import { formatDateTime, formatDate, cn } from '@/lib/utils'
import { STATUS_CONFIG, PRIORITY_CONFIG } from '@/lib/constants'
import StatusBadge from './StatusBadge'
import PriorityBadge from './PriorityBadge'
import type { EventPriority, EventStatus } from '@/lib/types'
import {
  X, Clock, Send,
  CheckCircle2, XCircle, RotateCcw, History, ChevronDown,
  CalendarDays, MapPin, Trophy, User2, MessageSquare, Zap
} from 'lucide-react'

export default function EventModal() {
  const { selectedEventId, selectEvent, getEvent, updateStatus, updatePriority, updateResponsable, addNote, users } = useEvents()
  const { showToast } = useToast()
  const [note, setNote] = useState('')
  const [showHistory, setShowHistory] = useState(false)

  const event = selectedEventId ? getEvent(selectedEventId) : null

  useEffect(() => {
    if (selectedEventId) setNote('')
  }, [selectedEventId])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') selectEvent(null)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [selectEvent])

  if (!event) return null

  const handleAddNote = () => {
    if (!note.trim()) return
    addNote(event.id, note.trim())
    setNote('')
  }

  const statusActions: { status: EventStatus; label: string; icon: React.ReactNode; classes: string; toast: string }[] = [
    {
      status: 'arte_solicitado',
      label: 'Arte Solicitado',
      icon: <CheckCircle2 size={15} />,
      classes: 'bg-brand text-white hover:bg-brand-dark shadow-brand',
      toast: '🎨 Arte marcado como solicitado',
    },
    {
      status: 'declinado',
      label: 'Declinar',
      icon: <XCircle size={15} />,
      classes: 'bg-white hover:bg-red-50 text-red-600 border border-red-200',
      toast: '✖️ Evento declinado',
    },
    {
      status: 'pendiente',
      label: 'Volver a Pendiente',
      icon: <RotateCcw size={15} />,
      classes: 'bg-white hover:bg-amber-50 text-amber-700 border border-amber-200',
      toast: '🕐 Evento vuelto a pendiente',
    },
  ]
  const availableActions = statusActions.filter(a => a.status !== event.estado)

  const cfg = STATUS_CONFIG[event.estado]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => selectEvent(null)}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-slide-up">
        {/* Status stripe */}
        <div className={`h-1 w-full ${cfg.dot}`} />

        {/* Header */}
        <div className="flex items-start gap-4 px-6 py-5 border-b border-slate-100">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-2xl flex-shrink-0">
            {event.sport?.icon ?? '🏅'}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-slate-900 text-lg leading-tight">{event.nombre_evento}</h2>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <StatusBadge status={event.estado} />
              <PriorityBadge priority={event.prioridad} />
            </div>
          </div>
          <button
            onClick={() => selectEvent(null)}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors flex-shrink-0"
            title="Cerrar (Esc)"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">

          {/* Info Grid */}
          <div className="px-6 py-5 grid grid-cols-2 gap-4 border-b border-slate-50">
            <InfoRow icon={<CalendarDays size={14} />} label="Fecha y Hora">
              <span className="font-semibold text-slate-800 text-sm">{formatDateTime(event.fecha_hora)}</span>
            </InfoRow>
            <InfoRow icon={<Trophy size={14} />} label="Competición">
              <span className="text-slate-700 text-sm">{event.competition?.name ?? '—'}</span>
            </InfoRow>
            <InfoRow icon={<MapPin size={14} />} label="País / Región">
              <span className="text-slate-700 text-sm">{event.pais}{event.region ? ` · ${event.region}` : ''}</span>
            </InfoRow>
            <InfoRow icon={<User2 size={14} />} label="Responsable">
              {event.responsable ? (
                <select
                  onChange={e => e.target.value && updateResponsable(event.id, e.target.value)}
                  value={event.responsable_id ?? ''}
                  className="text-sm border border-slate-200 rounded-lg px-2 py-1 text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-brand/25"
                >
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.full_name}</option>
                  ))}
                </select>
              ) : (
                <select
                  onChange={e => e.target.value && updateResponsable(event.id, e.target.value)}
                  defaultValue=""
                  className="text-sm border border-slate-200 rounded-lg px-2 py-1 text-slate-500 bg-white focus:outline-none focus:ring-2 focus:ring-brand/25"
                >
                  <option value="">Sin asignar</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.full_name}</option>
                  ))}
                </select>
              )}
            </InfoRow>
            {event.fecha_solicitud_arte && (
              <InfoRow icon={<Clock size={14} />} label="Solicitud de Arte">
                <span className="text-slate-700 text-sm">{formatDate(event.fecha_solicitud_arte)}</span>
              </InfoRow>
            )}
            {event.enviado_equipo_creativo && (
              <InfoRow icon={<CheckCircle2 size={14} />} label="Equipo Creativo">
                <span className="text-emerald-600 font-semibold text-sm">✓ Enviado</span>
              </InfoRow>
            )}
          </div>

          {/* Priority Selector */}
          <div className="px-6 py-4 border-b border-slate-50">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <Zap size={12} />
              Cambiar Prioridad
            </p>
            <div className="flex gap-2">
              {(['alta', 'media', 'baja'] as EventPriority[]).map(p => {
                const cfg = PRIORITY_CONFIG[p]
                const active = event.prioridad === p
                return (
                  <button
                    key={p}
                    onClick={() => updatePriority(event.id, p)}
                    className={cn(
                      'flex-1 py-2 rounded-xl text-xs font-bold border transition-all',
                      active
                        ? `${cfg.bg} ${cfg.color} ${cfg.border} shadow-sm scale-[1.02] ring-2 ring-inset ring-current/20`
                        : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                    )}
                  >
                    {cfg.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Notes */}
          <div className="px-6 py-4 border-b border-slate-50">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <MessageSquare size={12} />
              Notas ({(event.notes ?? []).length})
            </p>
            {(event.notes ?? []).length === 0 ? (
              <p className="text-slate-300 text-sm italic mb-3">Sin notas aún...</p>
            ) : (
              <div className="space-y-2 mb-3 max-h-40 overflow-y-auto">
                {(event.notes ?? []).map(n => (
                  <div key={n.id} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <p className="text-slate-700 text-sm leading-relaxed">{n.content}</p>
                    <p className="text-slate-400 text-[11px] mt-1.5 font-medium">
                      {n.user?.full_name ?? 'Usuario'} · {formatDateTime(n.created_at)}
                    </p>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Escribe una nota..."
                rows={2}
                className="flex-1 text-sm border border-slate-200 rounded-xl px-3 py-2.5 resize-none text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-brand/25 focus:border-brand transition-colors"
                onKeyDown={e => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleAddNote()
                }}
              />
              <button
                onClick={handleAddNote}
                disabled={!note.trim()}
                className="px-3 py-2 bg-brand text-white rounded-xl hover:bg-brand-dark disabled:opacity-30 disabled:cursor-not-allowed transition-colors self-end shadow-brand"
                title="Enviar (Ctrl+Enter)"
              >
                <Send size={16} />
              </button>
            </div>
            <p className="text-slate-400 text-[11px] mt-1.5">Presiona Ctrl+Enter para enviar</p>
          </div>

          {/* History */}
          {(event.history ?? []).length > 0 && (
            <div className="px-6 py-4">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors w-full"
              >
                <History size={12} />
                Historial de Cambios ({event.history?.length})
                <ChevronDown size={13} className={cn('ml-auto transition-transform', showHistory && 'rotate-180')} />
              </button>
              {showHistory && (
                <div className="space-y-2 mt-3 animate-fade-in">
                  {[...(event.history ?? [])].reverse().map(entry => (
                    <div key={entry.id} className="flex items-start gap-2 text-xs text-slate-500">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand/40 mt-1.5 flex-shrink-0" />
                      <div>
                        <span className="font-semibold text-slate-600">{entry.action}</span>
                        {entry.old_value && entry.new_value && (
                          <span> · {entry.old_value} → <span className="font-semibold text-brand">{entry.new_value}</span></span>
                        )}
                        {entry.new_value && !entry.old_value && (
                          <span className="text-slate-400"> · "{entry.new_value?.substring(0, 40)}{(entry.new_value?.length ?? 0) > 40 ? '...' : ''}"</span>
                        )}
                        <span className="text-slate-400 ml-1">— {entry.user?.full_name} · {formatDateTime(entry.created_at)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/60 flex gap-2 flex-wrap">
          {availableActions.map(action => (
            <button
              key={action.status}
              onClick={() => {
                updateStatus(event.id, action.status)
                showToast(action.toast, action.status === 'declinado' ? 'error' : 'success')
              }}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95',
                action.classes
              )}
            >
              {action.icon}
              {action.label}
            </button>
          ))}
          <button
            onClick={() => selectEvent(null)}
            className="ml-auto px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-200 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

function InfoRow({ icon, label, children }: { icon?: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
        {icon && <span className="text-slate-300">{icon}</span>}
        {label}
      </p>
      <div>{children}</div>
    </div>
  )
}
