'use client'

import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { Eye, EyeOff, LogIn, Shield, ChevronRight, Lock } from 'lucide-react'
import Image from 'next/image'

export default function LoginPage() {
  const { users, login } = useAuth()
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [shake, setShake] = useState(false)
  const passwordRef = useRef<HTMLInputElement>(null)

  const selectedUser = users.find(u => u.id === selectedUserId)

  // Auto-focus password when user is selected
  useEffect(() => {
    if (selectedUserId) {
      setTimeout(() => passwordRef.current?.focus(), 150)
    }
  }, [selectedUserId])

  const handleLogin = async () => {
    if (!selectedUserId) {
      setError('Selecciona un perfil para continuar')
      return
    }
    if (!password) {
      setError('Ingresa la contraseña')
      return
    }

    setLoading(true)
    setError('')

    // Brief delay for UX feel
    await new Promise(r => setTimeout(r, 600))

    const result = login(selectedUserId, password)

    if (!result.success) {
      setLoading(false)
      setError(result.error ?? 'Error de autenticación')
      setShake(true)
      setTimeout(() => setShake(false), 500)
      setPassword('')
      passwordRef.current?.focus()
    }
    // If success, parent will unmount this component
  }

  return (
    <div className="min-h-screen bg-sidebar flex items-center justify-center p-4 relative overflow-hidden">

      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-brand/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-pink-500/5 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-brand/3 blur-3xl" />
        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(14,165,233,1) 1px, transparent 1px), linear-gradient(90deg, rgba(14,165,233,1) 1px, transparent 1px)',
            backgroundSize: '60px 60px'
          }}
        />
      </div>

      {/* Card */}
      <div
        className={`relative w-full max-w-md animate-slide-up ${shake ? 'animate-[shake_0.4s_ease-in-out]' : ''}`}
        style={shake ? { animation: 'shake 0.4s ease-in-out' } : {}}
      >
        {/* Logo header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-white/5 ring-1 ring-white/10 flex items-center justify-center overflow-hidden shadow-2xl">
              <img
                src="/logo/logo.png"
                alt="Métricas IA"
                className="w-10 h-10 object-contain"
              />
            </div>
            <div className="text-left">
              <h1 className="text-white font-bold text-2xl tracking-tight leading-none">Métricas IA</h1>
              <p className="text-brand text-[11px] font-bold uppercase tracking-widest mt-0.5">SportOps Platform</p>
            </div>
          </div>
          <p className="text-white/30 text-sm font-medium">
            Sistema de gestión de eventos deportivos
          </p>
        </div>

        {/* Login panel */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl">

          {/* Step 1: Select user */}
          <div className="mb-5">
            <p className="text-white/50 text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${selectedUser ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white/50'}`}>
                {selectedUser ? '✓' : '1'}
              </span>
              Selecciona tu perfil
            </p>
            <div className="grid grid-cols-2 gap-3">
              {users.map(u => (
                <button
                  key={u.id}
                  onClick={() => {
                    setSelectedUserId(u.id)
                    setError('')
                  }}
                  className={`
                    relative p-4 rounded-2xl border transition-all duration-200 text-left group active:scale-[0.97]
                    ${selectedUserId === u.id
                      ? 'border-brand/50 bg-brand/10 ring-2 ring-brand/30'
                      : 'border-white/10 bg-white/3 hover:bg-white/8 hover:border-white/20'
                    }
                  `}
                >
                  {/* Selection indicator */}
                  {selectedUserId === u.id && (
                    <div className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-brand flex items-center justify-center">
                      <span className="text-white text-[9px] font-black">✓</span>
                    </div>
                  )}

                  {/* Avatar */}
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${u.color} flex items-center justify-center text-white text-xs font-black mb-3 shadow-lg`}>
                    {u.avatar}
                  </div>

                  {/* Name & role */}
                  <p className={`text-sm font-bold leading-tight transition-colors ${selectedUserId === u.id ? 'text-white' : 'text-white/70 group-hover:text-white'}`}>
                    {u.name}
                  </p>
                  <p className={`text-[10px] font-medium mt-0.5 leading-tight transition-colors ${selectedUserId === u.id ? 'text-brand' : 'text-white/30 group-hover:text-white/50'}`}>
                    {u.id === 'ceo' ? 'CEO' : 'Marketing'}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Password */}
          <div className="mb-4">
            <p className={`text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2 transition-colors ${selectedUser ? 'text-white/50' : 'text-white/20'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${selectedUser ? 'bg-white/10 text-white/50' : 'bg-white/5 text-white/20'}`}>
                2
              </span>
              Contraseña de acceso
            </p>

            <div className="relative">
              <Lock
                size={15}
                className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${selectedUser ? 'text-brand/60' : 'text-white/20'}`}
              />
              <input
                ref={passwordRef}
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => {
                  setPassword(e.target.value)
                  if (error) setError('')
                }}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                placeholder={selectedUser ? "Ingresa la contraseña..." : "Primero selecciona un perfil"}
                disabled={!selectedUser}
                className={`
                  w-full pr-10 pl-10 py-3 rounded-xl text-sm transition-all outline-none
                  ${selectedUser
                    ? 'bg-white/8 border border-white/15 text-white placeholder:text-white/25 focus:border-brand/50 focus:ring-2 focus:ring-brand/20 focus:bg-white/10'
                    : 'bg-white/3 border border-white/5 text-white/20 placeholder:text-white/15 cursor-not-allowed'
                  }
                  ${error ? 'border-red-500/50 ring-2 ring-red-500/20' : ''}
                `}
              />
              {selectedUser && (
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              )}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 flex items-center gap-2 text-red-400 text-xs font-medium px-3 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl animate-fade-in">
              <Shield size={13} className="flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Login button */}
          <button
            onClick={handleLogin}
            disabled={loading || !selectedUser}
            className={`
              w-full py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98]
              ${selectedUser && !loading
                ? 'bg-gradient-to-r from-brand to-brand-dark text-white shadow-brand hover:brightness-110'
                : 'bg-white/5 text-white/25 cursor-not-allowed border border-white/5'
              }
            `}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Verificando...
              </>
            ) : (
              <>
                <LogIn size={16} />
                Ingresar al Sistema
              </>
            )}
          </button>

          {/* Hint */}
          <p className="text-center text-white/15 text-[10px] font-medium mt-4 flex items-center justify-center gap-1.5">
            <Lock size={9} />
            Acceso restringido · Métricas IA © 2026
          </p>
        </div>

        {/* Bottom badge */}
        <div className="flex items-center justify-center gap-2 mt-6">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-white/25 text-[11px] font-medium">Sistema seguro · Todos los datos cifrados</span>
        </div>
      </div>

      {/* Shake keyframe via style tag */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          15% { transform: translateX(-8px); }
          30% { transform: translateX(8px); }
          45% { transform: translateX(-6px); }
          60% { transform: translateX(6px); }
          75% { transform: translateX(-4px); }
          90% { transform: translateX(4px); }
        }
        .shake { animation: shake 0.4s ease-in-out; }
      `}</style>
    </div>
  )
}
