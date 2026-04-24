'use client'

import { useState } from 'react'
import { useEvents } from '@/context/EventsContext'
import { useAuth } from '@/context/AuthContext'
import {
  X, Plus, Calendar, Globe, AlertCircle,
  Sparkles, Send, ExternalLink, Database, ChevronRight, Link,
} from 'lucide-react'
import type { EventPriority } from '@/lib/types'

interface Props {
  onClose: () => void
}

type Tab = 'manual' | 'ia'

const priorityOpts: { value: EventPriority; label: string; color: string; bg: string; border: string }[] = [
  { value: 'alta', label: '🔴 Alta', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-300' },
  { value: 'media', label: '🟡 Media', color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-300' },
  { value: 'baja', label: '🟢 Baja', color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-300' },
]

const FORMATOS = ['Story', 'Feed', 'Reel', 'Banner', 'Carrusel', 'Video', 'Otro']
const DIMENSIONES_SUGERIDAS = ['1080×1920 (Story)', '1080×1080 (Feed)', '1200×628 (Banner)', '1080×1350 (Portrait)']

export default function AddEventModal({ onClose }: Props) {
  const { addEvent, sports, competitions } = useEvents()
  const { user, getNotionConfig } = useAuth()

  const [tab, setTab] = useState<Tab>('manual')

  // Evento base
  const [form, setForm] = useState({
    nombre_evento: '',
    sport_id: '',
    competition_id: '',
    fecha_hora: '',
    pais: '',
    region: '',
    prioridad: 'media' as EventPriority,
  })

  // Campos específicos de la solicitud de arte (Notion)
  const [solicitud, setSolicitud] = useState({
    formato: '',
    dimensiones: '',
    copy: '',
    enlace_articulo: '',
    descripcion: '',
    usar_ia: false,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // IA mode
  const [iaText, setIaText] = useState('')
  const [parsingIA, setParsingIA] = useState(false)
  const [iaError, setIaError] = useState('')

  // Notion
  const notionConfig = getNotionConfig()
  const hasNotion = notionConfig?.connected === true
  const [sendToNotion, setSendToNotion] = useState(hasNotion)
  const [notionStatus, setNotionStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [notionResult, setNotionResult] = useState<{ url: string; descripcion: string; copy: string } | null>(null)
  const [notionError, setNotionError] = useState('')

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

  // Parsear texto con IA (DeepSeek)
  const handleParseIA = async () => {
    if (!iaText.trim()) return
    setParsingIA(true)
    setIaError('')
    try {
      const res = await fetch('/api/notion', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ descripcion: iaText }),
      })
      const data = await res.json()
      if (!res.ok || !data.event) {
        setIaError(data.error ?? 'No se pudo interpretar el texto')
        return
      }
      const ev = data.event
      const sport = sports.find(s => s.name.toLowerCase() === (ev.sport ?? '').toLowerCase())
      const competition = sport
        ? competitions.find(c =>
            c.sport_id === sport.id &&
            c.name.toLowerCase().includes((ev.competition ?? '').toLowerCase())
          )
        : undefined

      setForm(f => ({
        ...f,
        nombre_evento: ev.nombre_evento ?? f.nombre_evento,
        sport_id: sport?.id ?? f.sport_id,
        competition_id: competition?.id ?? f.competition_id,
        fecha_hora: ev.fecha_hora?.slice(0, 16) ?? f.fecha_hora,
        pais: ev.pais ?? f.pais,
        prioridad: ['alta', 'media', 'baja'].includes(ev.prioridad) ? ev.prioridad : f.prioridad,
      }))
      setSolicitud(s => ({
        ...s,
        formato: ev.formato ?? s.formato,
        dimensiones: ev.dimensiones ?? s.dimensiones,
      }))
      setTab('manual')
    } catch {
      setIaError('Error de conexión con el servidor')
    } finally {
      setParsingIA(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    const sport = sports.find(s => s.id === form.sport_id)
    const competition = competitions.find(c => c.id === form.competition_id)

    // Guardar localmente
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

    // Enviar a Notion si está activado
    if (sendToNotion && hasNotion && notionConfig) {
      setNotionStatus('sending')
      try {
        const res = await fetch('/api/notion', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            notionToken: notionConfig.token,
            databaseId: notionConfig.databaseId,
            solicitud: {
              nombre_evento: form.nombre_evento,
              sport: sport?.name,
              competition: competition?.name,
              fecha_hora: form.fecha_hora,
              pais: form.pais,
              region: form.region,
              formato: solicitud.formato,
              dimensiones: solicitud.dimensiones,
              copy: solicitud.copy,
              enlace_articulo: solicitud.enlace_articulo,
              descripcion: solicitud.descripcion,
              solicitante: user?.name ?? 'Usuario',
              prioridad: form.prioridad,
              usar_ia: solicitud.usar_ia,
            },
          }),
        })
        const data = await res.json()
        if (res.ok && data.success) {
          setNotionStatus('success')
          setNotionResult({
            url: data.notionUrl,
            descripcion: data.descripcion,
            copy: data.copy,
          })
        } else {
          setNotionStatus('error')
          setNotionError(data.error ?? 'Error al crear en Notion')
        }
      } catch {
        setNotionStatus('error')
        setNotionError('Error de conexión con el servidor')
      }
      return
    }

    onClose()
  }

  // Pantalla de éxito Notion
  if (notionStatus === 'success' && notionResult) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-slide-up">
          <div className="px-6 pt-8 pb-6">
            <div className="text-center mb-5">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                <Database size={28} className="text-emerald-500" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-1">¡Solicitud creada en Notion!</h2>
              <p className="text-slate-500 text-sm">El evento fue registrado y la solicitud de arte fue enviada a tu workspace.</p>
            </div>

            {notionResult.descripcion && (
              <div className="bg-slate-50 rounded-xl p-4 mb-3 border border-slate-100">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Sparkles size={11} className="text-brand" /> Descripción generada por IA
                </p>
                <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">{notionResult.descripcion}</p>
              </div>
            )}

            {notionResult.copy && (
              <div className="bg-brand/5 rounded-xl p-4 mb-5 border border-brand/10">
                <p className="text-[11px] font-bold text-brand/60 uppercase tracking-wider mb-2">✍️ Copy generado</p>
                <p className="text-sm text-slate-700 font-medium italic">"{notionResult.copy}"</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-xl text-sm font-bold border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
              >
                Cerrar
              </button>
              {notionResult.url && (
                <a
                  href={notionResult.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-brand to-brand-dark text-white flex items-center justify-center gap-2 hover:brightness-110 transition-all"
                >
                  <ExternalLink size={14} />
                  Ver en Notion
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-slide-up">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand/10 flex items-center justify-center">
              <Plus size={18} className="text-brand" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-base">Nueva Solicitud de Arte</h2>
              <p className="text-slate-400 text-xs font-medium">Evento deportivo · {user?.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 bg-slate-50/50">
          <button
            onClick={() => setTab('manual')}
            className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
              tab === 'manual' ? 'text-brand border-b-2 border-brand bg-white' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Plus size={12} /> Formulario
          </button>
          <button
            onClick={() => setTab('ia')}
            className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
              tab === 'ia' ? 'text-brand border-b-2 border-brand bg-white' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Sparkles size={12} /> Describir con IA
          </button>
        </div>

        {/* IA Tab */}
        {tab === 'ia' && (
          <div className="px-6 py-5 space-y-4">
            <div className="bg-gradient-to-br from-brand/5 to-purple-50 rounded-xl p-4 border border-brand/10">
              <p className="text-sm font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Sparkles size={14} className="text-brand" />
                Describe el evento en lenguaje natural
              </p>
              <p className="text-xs text-slate-500">
                La IA extraerá los datos automáticamente y llenará el formulario por ti.
              </p>
            </div>

            <textarea
              value={iaText}
              onChange={e => { setIaText(e.target.value); setIaError('') }}
              placeholder={`Ej: "Champions League, Real Madrid vs Bayern el sábado a las 9pm en España, necesito story y feed 1080x1920, prioridad alta"`}
              rows={5}
              className="w-full px-3.5 py-3 rounded-xl text-sm border border-slate-200 outline-none focus:border-brand/50 focus:ring-2 focus:ring-brand/15 resize-none transition-all"
            />

            {iaError && (
              <div className="flex items-center gap-2 text-red-500 text-xs bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
                <AlertCircle size={13} /> {iaError}
              </div>
            )}

            <button
              onClick={handleParseIA}
              disabled={parsingIA || !iaText.trim()}
              className="w-full py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-brand to-brand-dark text-white flex items-center justify-center gap-2 hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
            >
              {parsingIA ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Interpretando...</>
              ) : (
                <><Sparkles size={15} /> Llenar formulario con IA <ChevronRight size={14} /></>
              )}
            </button>
          </div>
        )}

        {/* Manual Form */}
        {tab === 'manual' && (
          <form onSubmit={handleSubmit} className="max-h-[62vh] overflow-y-auto">
            <div className="px-6 py-4 space-y-4">

              {/* ── SECCIÓN: Evento ── */}
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Datos del Evento</p>

              <div>
                <label className="field-label">Nombre del Evento <span className="text-red-400">*</span></label>
                <input
                  value={form.nombre_evento}
                  onChange={e => { setForm({ ...form, nombre_evento: e.target.value }); if (errors.nombre_evento) setErrors({ ...errors, nombre_evento: '' }) }}
                  placeholder="Ej: Real Madrid vs Bayern München"
                  className={`input-base ${errors.nombre_evento ? 'border-red-300 ring-2 ring-red-100' : ''}`}
                />
                {errors.nombre_evento && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={11} /> {errors.nombre_evento}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="field-label">Deporte</label>
                  <select value={form.sport_id} onChange={e => setForm({ ...form, sport_id: e.target.value, competition_id: '' })} className="input-base">
                    <option value="">Seleccionar...</option>
                    {sports.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="field-label">Competición</label>
                  <select value={form.competition_id} onChange={e => setForm({ ...form, competition_id: e.target.value })} className="input-base" disabled={filteredComps.length === 0}>
                    <option value="">Seleccionar...</option>
                    {filteredComps.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="field-label"><Calendar size={10} className="inline mr-1" />Fecha Entrega <span className="text-red-400">*</span></label>
                  <input
                    type="datetime-local"
                    value={form.fecha_hora}
                    onChange={e => { setForm({ ...form, fecha_hora: e.target.value }); if (errors.fecha_hora) setErrors({ ...errors, fecha_hora: '' }) }}
                    className={`input-base ${errors.fecha_hora ? 'border-red-300 ring-2 ring-red-100' : ''}`}
                  />
                  {errors.fecha_hora && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={11} /> {errors.fecha_hora}</p>}
                </div>
                <div>
                  <label className="field-label"><Globe size={10} className="inline mr-1" />País</label>
                  <input value={form.pais} onChange={e => setForm({ ...form, pais: e.target.value })} placeholder="España" className="input-base" />
                </div>
              </div>

              {/* Prioridad */}
              <div>
                <label className="field-label">Prioridad</label>
                <div className="flex gap-2">
                  {priorityOpts.map(opt => (
                    <button
                      key={opt.value} type="button"
                      onClick={() => setForm({ ...form, prioridad: opt.value })}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
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

              {/* ── SECCIÓN: Solicitud de Arte ── */}
              <div className="pt-2 border-t border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Solicitud de Arte</p>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="field-label">Formato</label>
                    <select value={solicitud.formato} onChange={e => setSolicitud({ ...solicitud, formato: e.target.value })} className="input-base">
                      <option value="">Seleccionar...</option>
                      {FORMATOS.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="field-label">Dimensiones</label>
                    <input
                      value={solicitud.dimensiones}
                      onChange={e => setSolicitud({ ...solicitud, dimensiones: e.target.value })}
                      placeholder="1080×1920"
                      list="dimensiones-list"
                      className="input-base"
                    />
                    <datalist id="dimensiones-list">
                      {DIMENSIONES_SUGERIDAS.map(d => <option key={d} value={d.split(' ')[0]} />)}
                    </datalist>
                  </div>
                </div>
              </div>

              {/* Copy */}
              <div>
                <label className="field-label">Copy del Anuncio</label>
                <textarea
                  value={solicitud.copy}
                  onChange={e => setSolicitud({ ...solicitud, copy: e.target.value })}
                  placeholder="Texto que irá en el anuncio... (déjalo vacío si quieres que la IA lo genere)"
                  rows={2}
                  className="input-base resize-none"
                />
              </div>

              {/* Descripción */}
              <div>
                <label className="field-label">Descripción / Instrucciones</label>
                <textarea
                  value={solicitud.descripcion}
                  onChange={e => setSolicitud({ ...solicitud, descripcion: e.target.value })}
                  placeholder="Instrucciones especiales para el equipo creativo... (déjalo vacío para generar con IA)"
                  rows={2}
                  className="input-base resize-none"
                />
              </div>

              {/* Enlace artículo */}
              <div>
                <label className="field-label"><Link size={10} className="inline mr-1" />Enlace de Referencia</label>
                <input
                  type="url"
                  value={solicitud.enlace_articulo}
                  onChange={e => setSolicitud({ ...solicitud, enlace_articulo: e.target.value })}
                  placeholder="https://..."
                  className="input-base"
                />
              </div>

              {/* ── SECCIÓN: Notion ── */}
              {hasNotion && (
                <div className="pt-2 border-t border-slate-100 space-y-3">
                  {/* Toggle Notion */}
                  <div
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                      sendToNotion ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                    onClick={() => setSendToNotion(v => !v)}
                  >
                    <div className={`w-9 h-5 rounded-full relative transition-colors flex-shrink-0 ${sendToNotion ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${sendToNotion ? 'left-4' : 'left-0.5'}`} />
                    </div>
                    <div className="min-w-0">
                      <p className={`text-xs font-bold ${sendToNotion ? 'text-emerald-700' : 'text-slate-500'}`}>
                        <Database size={11} className="inline mr-1" />
                        Crear solicitud en Notion
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">{notionConfig?.email}</p>
                    </div>
                  </div>

                  {/* Toggle IA */}
                  {sendToNotion && (
                    <div
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                        solicitud.usar_ia ? 'bg-brand/5 border-brand/20' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                      }`}
                      onClick={() => setSolicitud(s => ({ ...s, usar_ia: !s.usar_ia }))}
                    >
                      <div className={`w-9 h-5 rounded-full relative transition-colors flex-shrink-0 ${solicitud.usar_ia ? 'bg-brand' : 'bg-slate-300'}`}>
                        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${solicitud.usar_ia ? 'left-4' : 'left-0.5'}`} />
                      </div>
                      <div>
                        <p className={`text-xs font-bold ${solicitud.usar_ia ? 'text-brand' : 'text-slate-500'}`}>
                          <Sparkles size={11} className="inline mr-1" />
                          Generar descripción y copy con IA
                        </p>
                        <p className="text-[10px] text-slate-400">DeepSeek completará los campos vacíos</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!hasNotion && (
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-dashed border-slate-200">
                  <Database size={14} className="text-slate-300 flex-shrink-0" />
                  <p className="text-xs text-slate-400">
                    <span className="font-semibold">Notion no conectado.</span> Conecta tu workspace desde el sidebar.
                  </p>
                </div>
              )}

              {notionStatus === 'error' && (
                <div className="flex items-center gap-2 text-red-500 text-xs bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
                  <AlertCircle size={13} /> {notionError}
                </div>
              )}
            </div>
          </form>
        )}

        {/* Footer */}
        {tab === 'manual' && (
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex gap-3">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={notionStatus === 'sending'}
              className="btn-primary flex-1 justify-center disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {notionStatus === 'sending' ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Enviando a Notion...</>
              ) : sendToNotion && hasNotion ? (
                <><Send size={14} /> Crear + Enviar a Notion</>
              ) : (
                <><Plus size={14} /> Crear Evento</>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
