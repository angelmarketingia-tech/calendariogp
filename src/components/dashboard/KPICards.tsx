'use client'

import { useMemo } from 'react'
import { useEvents } from '@/context/EventsContext'
import { isUrgent } from '@/lib/utils'
import { AlertTriangle, Clock, CheckCircle2, XCircle, TrendingUp, Zap, BarChart2 } from 'lucide-react'
import Link from 'next/link'

interface KPICardProps {
  title: string
  value: number
  icon: React.ReactNode
  colorIcon: string
  bgIcon: string
  valueColor?: string
  href?: string
  alert?: boolean
  subtitle?: string
}

function KPICard({ title, value, icon, colorIcon, bgIcon, valueColor, href, alert, subtitle }: KPICardProps) {
  const content = (
    <div className={`card-hover p-5 group transition-all cursor-default ${alert && value > 0 ? 'border-red-100 ring-1 ring-red-100' : ''}`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`w-11 h-11 rounded-xl ${bgIcon} flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105`}>
          <span className={colorIcon}>{icon}</span>
        </div>
        {alert && value > 0 && (
          <span className="flex h-2.5 w-2.5 mt-0.5">
            <span className="animate-ping absolute inline-flex h-2.5 w-2.5 rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
          </span>
        )}
      </div>
      <p className="text-slate-500 text-xs font-semibold leading-tight mb-1">{title}</p>
      <p className={`text-3xl font-extrabold tracking-tight ${valueColor ?? 'text-slate-900'} ${alert && value > 0 ? 'animate-pulse' : ''}`}>
        {value}
      </p>
      {subtitle && <p className="text-[10px] text-slate-400 mt-1 font-medium">{subtitle}</p>}
    </div>
  )

  if (href) {
    return <Link href={href} className="block">{content}</Link>
  }
  return content
}

export default function KPICards() {
  const { events } = useEvents()

  const stats = useMemo(() => {
    return {
      total: events.length,
      pendiente: events.filter(e => e.estado === 'pendiente').length,
      arte_solicitado: events.filter(e => e.estado === 'arte_solicitado').length,
      declinado: events.filter(e => e.estado === 'declinado').length,
      urgent_24h: events.filter(e => e.estado === 'pendiente' && isUrgent(e.fecha_hora, 24)).length,
      urgent_3_days: events.filter(e => e.estado === 'pendiente' && isUrgent(e.fecha_hora, 72)).length,
    }
  }, [events])

  const cards: KPICardProps[] = [
    {
      title: 'Total Eventos',
      value: stats.total,
      icon: <BarChart2 size={21} />,
      colorIcon: 'text-brand',
      bgIcon: 'bg-brand/10',
      valueColor: 'text-slate-900',
      href: '/events',
      subtitle: 'En el sistema',
    },
    {
      title: 'Pendientes',
      value: stats.pendiente,
      icon: <Clock size={21} />,
      colorIcon: 'text-amber-600',
      bgIcon: 'bg-amber-50',
      valueColor: 'text-amber-700',
      href: '/events?estado=pendiente',
      subtitle: 'Sin gestionar',
    },
    {
      title: 'Arte Solicitado',
      value: stats.arte_solicitado,
      icon: <CheckCircle2 size={21} />,
      colorIcon: 'text-brand',
      bgIcon: 'bg-brand/10',
      valueColor: 'text-brand',
      href: '/events?estado=arte_solicitado',
      subtitle: 'En proceso',
    },
    {
      title: 'Declinados',
      value: stats.declinado,
      icon: <XCircle size={21} />,
      colorIcon: 'text-slate-500',
      bgIcon: 'bg-slate-100',
      valueColor: 'text-slate-600',
      subtitle: 'Cancelados',
    },
    {
      title: 'Urgentes Hoy',
      value: stats.urgent_24h,
      icon: <Zap size={21} />,
      colorIcon: 'text-red-600',
      bgIcon: 'bg-red-50',
      valueColor: 'text-red-600',
      href: '/events?urgente=24h',
      alert: true,
      subtitle: 'Próximas 24h',
    },
    {
      title: 'En 3 Días',
      value: stats.urgent_3_days,
      icon: <AlertTriangle size={21} />,
      colorIcon: 'text-orange-600',
      bgIcon: 'bg-orange-50',
      valueColor: 'text-orange-600',
      href: '/events?urgente=3d',
      subtitle: 'Próximas 72h',
    },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
      {cards.map(card => (
        <KPICard key={card.title} {...card} />
      ))}
    </div>
  )
}
