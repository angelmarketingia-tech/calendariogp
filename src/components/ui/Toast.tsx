'use client'

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { CheckCircle2, X, AlertTriangle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: string
  message: string
  type: ToastType
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

let idCounter = 0

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = `toast-${++idCounter}`
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3200)
  }, [])

  const remove = (id: string) => setToasts(prev => prev.filter(t => t.id !== id))

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-5 right-5 z-[200] flex flex-col gap-2 pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border min-w-[260px] max-w-sm pointer-events-auto animate-slide-up',
              toast.type === 'success' && 'bg-white border-emerald-100 text-slate-800',
              toast.type === 'error' && 'bg-white border-red-100 text-slate-800',
              toast.type === 'info' && 'bg-white border-brand/20 text-slate-800',
            )}
          >
            <span className={cn(
              'flex-shrink-0',
              toast.type === 'success' && 'text-emerald-500',
              toast.type === 'error' && 'text-red-500',
              toast.type === 'info' && 'text-brand',
            )}>
              {toast.type === 'success' && <CheckCircle2 size={17} />}
              {toast.type === 'error' && <AlertTriangle size={17} />}
              {toast.type === 'info' && <Info size={17} />}
            </span>
            <span className="text-sm font-medium flex-1 leading-snug">{toast.message}</span>
            <button
              onClick={() => remove(toast.id)}
              className="text-slate-300 hover:text-slate-500 transition-colors flex-shrink-0"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
