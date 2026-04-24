'use client'

import { useState, useRef } from 'react'
import { useEvents } from '@/context/EventsContext'
import { parseAgendaMarkdown } from '@/lib/markdown-parser'
import { MOCK_SPORTS, MOCK_COMPETITIONS } from '@/lib/mock-data'
import type { SportEvent } from '@/lib/types'
import { RefreshCw, Upload, CheckCircle2, AlertTriangle, X, CloudLightning, FileUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/Toast'

export default function SyncPanel() {
  const { events, addEvent, refreshFromSupabase, source } = useEvents()
  const { showToast } = useToast()
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
    showToast(`✅ ${added} eventos importados correctamente`, 'success')
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-lg bg-brand/10 border border-brand/20 flex items-center justify-center flex-shrink-0">
            <CloudLightning size={20} className="text-brand" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 text-sm">Sincronización CloudCode</h3>
            <p className="text-gray-500 text-xs font-medium">Importar agenda deportiva automáticamente</p>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={cn(
              'text-[8px] font-bold px-2 py-1 rounded-md border',
              source === 'supabase'
                ? 'bg-green-50 text-green-700 border-green-200'
                : 'bg-gray-100 text-gray-500 border-gray-200'
            )}>
              {source === 'supabase' ? '● EN VIVO' : '○ LOCAL'}
            </span>
            <button
              onClick={async () => {
                setStatus('loading')
                setMessage('Actualizando desde la nube...')
                await refreshFromSupabase()
                setStatus('success')
                setMessage('✓ Datos actualizados correctamente')
              }}
              title="Recargar desde Supabase"
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-brand transition-colors"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <button
            onClick={handleAutoSync}
            disabled={status === 'loading'}
            className={cn(
              'flex flex-col items-center gap-2 p-3 rounded-lg border transition-all text-center disabled:opacity-50 group active:scale-95',
              'border-brand/25 bg-brand/8 hover:bg-brand/12 hover:border-brand/40 shadow-sm'
            )}
          >
            <div className="w-10 h-10 rounded-full bg-brand/15 flex items-center justify-center text-brand group-hover:scale-110 transition-transform">
              <RefreshCw size={18} className={status === 'loading' ? 'animate-spin' : ''} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-800">Auto-Sync</p>
              <p className="text-[10px] text-gray-500 font-medium">Detectar archivos</p>
            </div>
          </button>

          <button
            onClick={() => fileRef.current?.click()}
            disabled={status === 'loading'}
            className={cn(
              'flex flex-col items-center gap-2 p-3 rounded-lg border transition-all text-center disabled:opacity-50 group active:scale-95',
              'border-gray-200 bg-gray-50 hover:bg-gray-100 hover:border-gray-300 shadow-sm'
            )}
          >
            <div className="w-10 h-10 rounded-full bg-gray-200/60 flex items-center justify-center text-gray-600 group-hover:scale-110 transition-transform">
              <FileUp size={18} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-800">Manual</p>
              <p className="text-[10px] text-gray-500 font-medium">Subir archivo</p>
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
            'flex items-start gap-2.5 text-xs rounded-lg px-3 py-2.5 animate-fade-in',
            status === 'error' ? 'bg-red-50 text-red-700 border border-red-200' :
            status === 'success' ? 'bg-green-50 text-green-700 border border-green-200' :
            'bg-gray-50 text-gray-700 border border-gray-200'
          )}>
            <span className="flex-shrink-0 mt-0.5">
              {status === 'loading' && <RefreshCw size={13} className="animate-spin text-gray-600" />}
              {status === 'success' && <CheckCircle2 size={13} className="text-green-600" />}
              {status === 'error' && <AlertTriangle size={13} className="text-red-600" />}
            </span>
            <span className="leading-relaxed font-medium">{message}</span>
          </div>
        )}

        {/* API endpoint info */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Endpoint Público</p>
          <code className="text-[10px] text-gray-600 block leading-relaxed break-all font-mono">
            POST calendariogp.vercel.app/api/sync
          </code>
          <p className="text-[10px] text-gray-500 mt-2">Integración con CloudCode para actualización automática</p>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && preview.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-slide-up">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-brand/10 flex items-center justify-center">
                  <Upload size={18} className="text-brand" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">Vista Previa - {preview.length} eventos</h3>
                  <p className="text-gray-500 text-xs font-medium">Revisa antes de importar</p>
                </div>
              </div>
              <button
                onClick={() => { setShowPreview(false); setStatus('idle') }}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-2">
                {preview.slice(0, 30).map((e, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors">
                    <span className="text-lg w-7 text-center flex-shrink-0">{e.sport?.icon ?? '⚽'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{e.nombre_evento}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {new Date(e.fecha_hora).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                        {' · '}
                        {new Date(e.fecha_hora).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                        {' · '}
                        {e.pais}
                      </p>
                    </div>
                    <span className={`text-[10px] px-2 py-1 rounded-md font-bold border ${
                      e.prioridad === 'alta' ? 'bg-red-50 text-red-700 border-red-200' :
                      e.prioridad === 'media' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                      'bg-green-50 text-green-700 border-green-200'
                    }`}>{e.prioridad}</span>
                  </div>
                ))}
                {preview.length > 30 && (
                  <p className="text-center text-gray-500 text-sm py-3 font-medium">
                    + {preview.length - 30} eventos más...
                  </p>
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex gap-3">
              <button
                onClick={() => { setShowPreview(false); setStatus('idle') }}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-100 transition-colors flex-1"
              >
                Cancelar
              </button>
              <button
                onClick={confirmImport}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-brand to-brand-dark text-white font-semibold hover:brightness-110 transition-all active:scale-95 flex-1"
              >
                <Upload size={16} />
                Importar {preview.length}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
