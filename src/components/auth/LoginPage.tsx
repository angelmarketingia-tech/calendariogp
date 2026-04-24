'use client'

import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const { login, loginAsGuest } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [shake, setShake] = useState(false)
  const usernameRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    usernameRef.current?.focus()
  }, [])

  const handleLogin = async () => {
    if (!username) {
      setError('Ingresa tu usuario')
      return
    }
    if (!password) {
      setError('Ingresa tu contraseña')
      return
    }

    setLoading(true)
    setError('')

    const result = await login(username, password)

    if (!result.success) {
      setLoading(false)
      setError(result.error ?? 'Error de autenticación')
      setShake(true)
      setTimeout(() => setShake(false), 500)
      setPassword('')
    }
  }

  const handleGuestLogin = () => {
    loginAsGuest()
  }

  return (
    <div className="min-h-screen bg-brand-surface flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-brand/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-brand/3 blur-3xl" />
      </div>

      {/* Login Card */}
      <div
        className={`relative w-full max-w-md`}
        style={shake ? { animation: 'shake 0.4s ease-in-out' } : {}}
      >
        {/* Logo and Branding */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center mb-4">
            <div className="w-16 h-16 rounded-2xl bg-brand flex items-center justify-center shadow-lg overflow-hidden">
              <img
                src="/logo/ganaplay.png"
                alt="GanaPlay"
                className="w-12 h-12 object-contain"
              />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-1">
            GanaPlay
          </h1>
          <p className="text-brand font-semibold text-sm tracking-wider">
            PLATAFORMA DEPORTIVA
          </p>
          <p className="text-gray-600 text-sm font-medium mt-3">
            Sistema profesional de gestión de eventos
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          {/* Username Input */}
          <div className="mb-5">
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
              Usuario
            </label>
            <input
              ref={usernameRef}
              type="text"
              value={username}
              onChange={e => {
                setUsername(e.target.value)
                if (error) setError('')
              }}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="Ingresa tu usuario"
              disabled={loading}
              className={`
                w-full px-4 py-3 rounded-xl text-sm border transition-all outline-none
                ${error
                  ? 'border-red-500/50 ring-2 ring-red-500/20 bg-red-50'
                  : 'border-gray-200 focus:border-brand focus:ring-2 focus:ring-brand/20 focus:bg-white'
                }
                ${loading ? 'opacity-60 cursor-not-allowed bg-gray-50' : 'bg-white'}
              `}
            />
          </div>

          {/* Password Input */}
          <div className="mb-6">
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
              Contraseña
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => {
                  setPassword(e.target.value)
                  if (error) setError('')
                }}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                placeholder="Ingresa tu contraseña"
                disabled={loading}
                className={`
                  w-full px-4 py-3 rounded-xl text-sm border transition-all outline-none pr-11
                  ${error
                    ? 'border-red-500/50 ring-2 ring-red-500/20 bg-red-50'
                    : 'border-gray-200 focus:border-brand focus:ring-2 focus:ring-brand/20 focus:bg-white'
                  }
                  ${loading ? 'opacity-60 cursor-not-allowed bg-gray-50' : 'bg-white'}
                `}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 flex items-center gap-3 text-red-700 text-sm px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
              <AlertCircle size={18} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Login Button */}
          <button
            onClick={handleLogin}
            disabled={loading || !username || !password}
            className={`
              w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] mb-3
              ${loading || !username || !password
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-brand to-brand-dark text-white shadow-lg shadow-brand/30 hover:brightness-110'
              }
            `}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Verificando...
              </>
            ) : (
              <>
                <LogIn size={18} />
                Entrar
              </>
            )}
          </button>

          {/* Guest Login Button */}
          <button
            onClick={handleGuestLogin}
            disabled={loading}
            className="w-full py-3 rounded-xl text-sm font-semibold text-brand border-2 border-brand/30 hover:border-brand/60 hover:bg-brand/5 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            Entrar como invitado
          </button>

          {/* Footer */}
          <p className="text-center text-gray-400 text-[11px] font-medium mt-6">
            Acceso seguro · Todos los datos protegidos · GanaPlay © 2026
          </p>
        </div>

        {/* Live indicator */}
        <div className="flex items-center justify-center gap-2 mt-6">
          <div className="w-2 h-2 rounded-full bg-brand animate-pulse" />
          <span className="text-gray-500 text-[12px] font-medium">Plataforma operativa</span>
        </div>
      </div>

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
      `}</style>
    </div>
  )
}
