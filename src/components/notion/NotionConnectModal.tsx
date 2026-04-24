'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { X, Database, CheckCircle2, AlertCircle, ExternalLink, Trash2, Eye, EyeOff } from 'lucide-react'

interface Props {
  onClose: () => void
}

export default function NotionConnectModal({ onClose }: Props) {
  const { user, getNotionConfig, saveNotionConfig, clearNotionConfig } = useAuth()

  const existing = getNotionConfig()
  const [token, setToken] = useState(existing?.token ?? '')
  const [databaseId, setDatabaseId] = useState(existing?.databaseId ?? '')
  const [email, setEmail] = useState(existing?.email ?? user?.email ?? '')
  const [showToken, setShowToken] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null)
  const [saving, setSaving] = useState(false)

  // Reset test result when fields change
  useEffect(() => { setTestResult(null) }, [token, databaseId])

  const testConnection = async () => {
    if (!token.trim() || !databaseId.trim()) {
      setTestResult({ ok: false, message: 'Completa el token y el ID de base de datos' })
      return
    }
    setTesting(true)
    setTestResult(null)
    try {
      // Test by querying the database
      const res = await fetch(`https://api.notion.com/v1/databases/${databaseId.trim()}`, {
        headers: {
          Authorization: `Bearer ${token.trim()}`,
          'Notion-Version': '2022-06-28',
        },
      })
      if (res.ok) {
        const data = await res.json()
        setTestResult({ ok: true, message: `Conectado a: "${data.title?.[0]?.plain_text ?? 'Base de datos sin nombre'}"` })
      } else {
        const err = await res.json()
        setTestResult({ ok: false, message: err.message ?? 'Error de conexión con Notion' })
      }
    } catch {
      setTestResult({ ok: false, message: 'Error de red — verifica tu conexión' })
    } finally {
      setTesting(false)
    }
  }

  const handleSave = () => {
    if (!token.trim() || !databaseId.trim()) return
    setSaving(true)
    saveNotionConfig({
      token: token.trim(),
      databaseId: databaseId.trim(),
      email: email.trim(),
      connected: true,
    })
    setTimeout(() => {
      setSaving(false)
      onClose()
    }, 400)
  }

  const handleDisconnect = () => {
    clearNotionConfig()
    setToken('')
    setDatabaseId('')
    setEmail(user?.email ?? '')
    setTestResult(null)
  }

  const isConnected = existing?.connected === true

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-slide-up">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isConnected ? 'bg-emerald-50' : 'bg-slate-100'}`}>
              <Database size={20} className={isConnected ? 'text-emerald-600' : 'text-slate-500'} />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-base">Conectar Notion</h2>
              <p className="text-slate-400 text-xs font-medium">
                Perfil: <span className="font-semibold text-slate-600">{user?.name}</span> · {user?.role}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">

          {/* Info box */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700">
            <p className="font-semibold mb-1">¿Cómo obtener el token?</p>
            <ol className="list-decimal list-inside space-y-1 text-xs text-blue-600 font-medium">
              <li>Ve a <a href="https://www.notion.so/my-integrations" target="_blank" rel="noreferrer" className="underline inline-flex items-center gap-0.5">notion.so/my-integrations <ExternalLink size={10} /></a></li>
              <li>Crea una integración nueva y copia el token</li>
              <li>Comparte tu base de datos con la integración</li>
              <li>Copia el ID de la base de datos desde la URL</li>
            </ol>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Correo de Notion de este perfil
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-slate-200 outline-none focus:border-brand/50 focus:ring-2 focus:ring-brand/15 transition-all"
            />
            <p className="text-[11px] text-slate-400 mt-1">Correo asociado a tu workspace de Notion</p>
          </div>

          {/* Token */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Integration Token <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <input
                type={showToken ? 'text' : 'password'}
                value={token}
                onChange={e => setToken(e.target.value)}
                placeholder="secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                className="w-full pr-10 px-3.5 py-2.5 rounded-xl text-sm border border-slate-200 outline-none focus:border-brand/50 focus:ring-2 focus:ring-brand/15 transition-all font-mono"
              />
              <button
                type="button"
                onClick={() => setShowToken(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showToken ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Database ID */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              ID de Base de Datos <span className="text-red-400">*</span>
            </label>
            <input
              value={databaseId}
              onChange={e => setDatabaseId(e.target.value)}
              placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-slate-200 outline-none focus:border-brand/50 focus:ring-2 focus:ring-brand/15 transition-all font-mono"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Se encuentra en la URL de la base de datos: notion.so/.../<span className="font-mono font-semibold">ID</span>?v=...
            </p>
          </div>

          {/* Test result */}
          {testResult && (
            <div className={`flex items-start gap-2.5 p-3 rounded-xl text-sm ${testResult.ok ? 'bg-emerald-50 border border-emerald-100 text-emerald-700' : 'bg-red-50 border border-red-100 text-red-600'}`}>
              {testResult.ok
                ? <CheckCircle2 size={16} className="flex-shrink-0 mt-0.5" />
                : <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              }
              <span className="text-xs font-medium">{testResult.message}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center gap-3">
          {isConnected && (
            <button
              onClick={handleDisconnect}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-red-500 hover:bg-red-50 border border-red-100 transition-colors"
            >
              <Trash2 size={13} />
              Desconectar
            </button>
          )}
          <div className="flex-1 flex gap-2 justify-end">
            <button
              onClick={testConnection}
              disabled={testing || !token.trim() || !databaseId.trim()}
              className="px-4 py-2.5 rounded-xl text-sm font-bold border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              {testing ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-slate-300 border-t-brand rounded-full animate-spin" />
                  Probando...
                </>
              ) : 'Probar conexión'}
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !token.trim() || !databaseId.trim()}
              className="px-4 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-brand to-brand-dark text-white shadow-brand hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Database size={14} />
                  {isConnected ? 'Actualizar' : 'Guardar conexión'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
