'use client'

import { useState } from 'react'
import { useEvents } from '@/context/EventsContext'
import { X, Plus, Calendar, Globe, AlertCircle } from 'lucide-react'
import type { EventPriority } from '@/lib/types'

interface Props {
  onClose: () => void
}

export default function AddEventModal({ onClose }: Props) {
  const { addEvent, sports, competitions } = useEvents()
  const [form, setForm] = useState({
    nombre_evento: '',
    sport_id: '',
    competition_id: '',
    fecha_hora: '',
    pais: '',
    region: '',
    prioridad: 'media' as EventPriority,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const filteredComps = competitions.filter(
    c => !form.sport_id || c.sport_id === form.sport_id
  )

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!form.nombre_evento.trim()) newErrors.nombre_evento = 'El nombre es obligatorio'
    if (!form.fecha_hora) newErrors.fecha_hora = 'La fecha y hora son obligatorias'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    const sport = sports.find(s => s.id === form.sport_id)
    const competition = competitions.find(c => c.id === form.competition_id)
    addEvent({
      ...form,
      sport,
      competition: competition ? { ...competition, sport } : undefined,
      estado: 'pendiente',
      enviado_equipo_creativo: false,
      source: 'manual',
      notes: [],
      history: [],
    })
    onClose()
  }

  const priorityOpts: { value: EventPriority; label: string; color: string; bg: string; border: string }[] = [
    { value: 'alta', label: '🔴 Alta', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-300' },
    { value: 'media', label: '🟡 Media', color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-300' },
    { value: 'baja', label: '🟢 Baja', color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-300' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-slide-up">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center">
              <Plus size={20} className="text-brand" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-base">Nuevo Evento</h2>
              <p className="text-slate-400 text-xs font-medium">Registro manual de evento deportivo</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">

          {/* Event name */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Nombre del Evento <span className="text-red-400">*</span>
            </label>
            <input
              value={form.nombre_evento}
              onChange={e => {
                setForm({ ...form, nombre_evento: e.target.value })
                if (errors.nombre_evento) setErrors({ ...errors, nombre_evento: '' })
              }}
              placeholder="Ej: Real Madrid vs Barcelona"
              className={`input-base ${errors.nombre_evento ? 'border-red-300 ring-2 ring-red-100' : ''}`}
            />
            {errors.nombre_evento && (
              <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                <AlertCircle size={11} /> {errors.nombre_evento}
              </p>
            )}
          </div>

          {/* Sport & Competition */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Deporte
              </label>
              <select
                value={form.sport_id}
                onChange={e => setForm({ ...form, sport_id: e.target.value, competition_id: '' })}
                className="input-base"
              >
                <option value="">Seleccionar...</option>
                {sports.map(s => (
                  <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Competición
              </label>
              <select
                value={form.competition_id}
                onChange={e => setForm({ ...form, competition_id: e.target.value })}
                className="input-base"
                disabled={filteredComps.length === 0}
              >
                <option value="">Seleccionar...</option>
                {filteredComps.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Date & Time */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              <Calendar size={11} className="inline mr-1" />
              Fecha y Hora <span className="text-red-400">*</span>
            </label>
            <input
              type="datetime-local"
              value={form.fecha_hora}
              onChange={e => {
                setForm({ ...form, fecha_hora: e.target.value })
                if (errors.fecha_hora) setErrors({ ...errors, fecha_hora: '' })
              }}
              className={`input-base ${errors.fecha_hora ? 'border-red-300 ring-2 ring-red-100' : ''}`}
            />
            {errors.fecha_hora && (
              <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                <AlertCircle size={11} /> {errors.fecha_hora}
              </p>
            )}
          </div>

          {/* Country & Region */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                <Globe size={11} className="inline mr-1" />
                País
              </label>
              <input
                value={form.pais}
                onChange={e => setForm({ ...form, pais: e.target.value })}
                placeholder="España"
                className="input-base"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Región
              </label>
              <input
                value={form.region}
                onChange={e => setForm({ ...form, region: e.target.value })}
                placeholder="Opcional"
                className="input-base"
              />
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Prioridad
            </label>
            <div className="flex gap-2">
              {priorityOpts.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm({ ...form, prioridad: opt.value })}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                    form.prioridad === opt.value
                      ? `${opt.bg} ${opt.color} ${opt.border} ring-2 ring-inset ring-current/20 scale-[1.02]`
                      : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary flex-1 justify-center"
          >
            Cancelar
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="btn-primary flex-1 justify-center"
          >
            <Plus size={15} />
            Crear Evento
          </button>
        </div>
      </div>
    </div>
  )
}
