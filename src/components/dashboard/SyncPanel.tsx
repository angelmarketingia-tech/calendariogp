'use client'

import { useState, useRef } from 'react'
import { useEvents } from '@/context/EventsContext'
import { parseAgendaMarkdown } from '@/lib/markdown-parser'
import { MOCK_SPORTS, MOCK_COMPETITIONS } from '@/lib/mock-data'
import type { SportEvent } from '@/lib/types'
import { RefreshCw, Upload, CheckCircle2, AlertTriangle, X, CloudLightning, FileUp } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function SyncPanel() {
  const { events, addEvent } = useEvents()
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [preview, setPreview] = useState<SportEvent[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function enrich(e: SportEvent): SportEvent {
    const sport = MOCK_SPORTS.find(s => s.id === e.sport_id)
    const comp = MOCK_COMPETITIONS.find(c => c.id === e.competition_id)
    return {
      ...e,
      sport,
      competition: comp ? { ...comp, sport } : undefined,
    }
  }

  const handleFile = async (file: File) => {
    setStatus('loading')
    setMessage('Leyendo archivo...')
    try {
      const text = await file.text()
      const parsed = parseAgendaMarkdown(text).map(enrich)
      if (parsed.length === 0) {
        setStatus('error')
        setMessage('No se encontraron eventos en el archivo. Verifica el formato de agenda.')
        return
      }
      setPreview(parsed)
      setShowPreview(true)
      setStatus('success')
      setMessage(`${parsed.length} eventos detectados. Revisa antes de importar.`)
    } catch {
      setStatus('error')
      setMessage('Error leyendo el archivo. Asegúrate de que sea un .md válido.')
    }
  }

  const handleAutoSync = async () => {
    setStatus('loading')
    setMessage('Buscando agenda más reciente...')
    try {
      const listRes = await fetch('/api/sync')
      const listData = await listRes.json()

      if (!listData.available_files?.length) {
        setStatus('error')
        setMessage(`No se encontraron archivos .md en: ${listData.agenda_dir}`)
        return
      }

      const latest = listData.available_files[0]
      setMessage(`Encontrado: ${latest}. Parseando...`)

      const syncRes = await fetch(`/api/sync?file=${encodeURIComponent(latest)}`)
      const syncData = await syncRes.json()

      if (!syncData.success) {
        setStatus('error')
        setMessage(syncData.error ?? 'Error al parsear')
        return
      }

      const enriched = (syncData.events as SportEvent[]).map(enrich)
      setPreview(enriched)
      setShowPreview(true)
      setStatus('success')
      setMessage(`${enriched.length} eventos desde ${latest}`)
    } catch {
      setStatus('error')
      setMessage('No se pudo conectar. Asegúrate de que el dev server esté corriendo.')
    }
  }

  const confirmImport = () => {
    let added = 0
    const existingIds = new Set(events.map(e => e.nombre_evento + e.fecha_hora))
    preview.forEach(e => {
      const key = e.nombre_evento + e.fecha_hora
      if (!existingIds.has(key)) {
        addEvent(e)
        added++
      }
    })
    setShowPreview(false)
    setStatus('success')
    setMessage(`✓ ${added} eventos importados (${preview.length - added} ya existían)`)
    setPreview([])
  }

  return (
    <>
      <div className="card p-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand/20 to-brand/5 border border-brand/20 flex items-center justify-center flex-shrink-0">
            <CloudLightning size={18} className="text-brand" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm tracking-tight">Sincronización</h3>
            <p className="text-slate-400 text-[11px] font-medium">Canal con el Co-working Agent</p>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <button
            onClick={handleAutoSync}
            disabled={status === 'loading'}
            className={cn(
              'flex flex-col items-center gap-2 p-3 rounded-xl border transition-all text-center disabled:opacity-50 group active:scale-95',
              'border-brand/20 bg-brand/5 hover:bg-brand/10 hover:border-brand/40 shadow-sm'
            )}
          >
            <div className="w-9 h-9 rounded-full bg-brand/10 flex items-center justify-center text-brand group-hover:scale-110 transition-transform">
              <RefreshCw size={17} className={status === 'loading' ? 'animate-spin' : ''} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">Auto-Sync</p>
              <p className="text-[10px] text-slate-400 font-medium">Directorio</p>
            </div>
          </button>

          <button
            onClick={() => fileRef.current?.click()}
            disabled={status === 'loading'}
            className={cn(
              'flex flex-col items-center gap-2 p-3 rounded-xl border transition-all text-center disabled:opacity-50 group active:scale-95',
              'border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 shadow-sm'
            )}
          >
            <div className="w-9 h-9 rounded-full bg-slate-200/70 flex items-center justify-center text-slate-500 group-hover:scale-110 transition-transform">
              <FileUp size={17} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">Manual</p>
              <p className="text-[10px] text-slate-400 font-medium">Subir .md</p>
            </div>
          </button>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept=".md,.txt"
          className="hidden"
          onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
        />

        {/* Status */}
        {status !== 'idle' && (
          <div className={cn(
            'flex items-start gap-2 text-xs rounded-xl px-3 py-2 animate-fade-in',
            status === 'error' ? 'bg-red-50 text-red-600 border border-red-100' :
            status === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
            'bg-slate-50 text-slate-600 border border-slate-100'
          )}>
            <span className="flex-shrink-0 mt-0.5">
              {status === 'loading' && <RefreshCw size={13} className="animate-spin text-slate-500" />}
              {status === 'success' && <CheckCircle2 size={13} className="text-emerald-500" />}
              {status === 'error' && <AlertTriangle size={13} className="text-red-500" />}
            </span>
            <span className="leading-relaxed">{message}</span>
          </div>
        )}

        {/* API hint */}
        <div className="mt-3 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Endpoint Co-working</p>
          <code className="text-[10px] text-slate-500 block leading-relaxed break-all">
            POST localhost:3000/api/sync
          </code>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && preview.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-slide-up">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-brand/10 flex items-center justify-center">
                  <Upload size={17} className="text-brand" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Vista Previa de Importación</h3>
                  <p className="text-slate-400 text-xs">{preview.length} eventos detectados</p>
                </div>
              </div>
              <button
                onClick={() => { setShowPreview(false); setStatus('idle') }}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-1.5">
                {preview.slice(0, 30).map((e, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100 transition-colors">
                    <span className="text-base w-7 text-center flex-shrink-0">{e.sport?.icon ?? '🏅'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{e.nombre_evento}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {new Date(e.fecha_hora).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                        {' · '}
                        {new Date(e.fecha_hora).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                        {' · '}
                        {e.pais}
                      </p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                      e.prioridad === 'alta' ? 'bg-red-50 text-red-600 border-red-200' :
                      e.prioridad === 'media' ? 'bg-orange-50 text-orange-600 border-orange-200' :
                      'bg-green-50 text-green-600 border-green-200'
                    }`}>{e.prioridad}</span>
                  </div>
                ))}
                {preview.length > 30 && (
                  <p className="text-center text-slate-400 text-sm py-2 font-medium">
                    + {preview.length - 30} eventos más...
                  </p>
                )}
              </div>
            </div>

            <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/50 flex gap-3">
              <button
                onClick={() => { setShowPreview(false); setStatus('idle') }}
                className="btn-secondary flex-1 justify-center"
              >
                Cancelar
              </button>
              <button
                onClick={confirmImport}
                className="btn-primary flex-1 justify-center"
              >
                <Upload size={15} />
                Importar {preview.length} eventos
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
