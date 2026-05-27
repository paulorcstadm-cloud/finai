'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Bell, CheckCheck, Filter, CreditCard, TrendingUp,
  Target, Users, Repeat, Lightbulb, AlertTriangle, CheckCircle, Info,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ALERTS } from '@/lib/mock-data'
import type { Alert, AlertSeverity } from '@/lib/types'

function SeverityIcon({ severity }: { severity: AlertSeverity }) {
  const config = {
    danger:  { icon: AlertTriangle, color: 'text-rose-400',    bg: 'bg-rose-500/15' },
    warning: { icon: AlertTriangle, color: 'text-amber-400',   bg: 'bg-amber-500/15' },
    success: { icon: CheckCircle,   color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
    info:    { icon: Info,          color: 'text-blue-400',    bg: 'bg-blue-500/15' },
  }[severity]
  const Icon = config.icon
  return (
    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', config.bg)}>
      <Icon className={cn('w-5 h-5', config.color)} />
    </div>
  )
}

function TypeIcon({ type }: { type: string }) {
  const icons: Record<string, React.ReactNode> = {
    bill_due:       <CreditCard className="w-4 h-4" />,
    consorcio:      <TrendingUp className="w-4 h-4" />,
    goal:           <Target className="w-4 h-4" />,
    gabriel:        <Users className="w-4 h-4" />,
    subscription:   <Repeat className="w-4 h-4" />,
    insight:        <Lightbulb className="w-4 h-4" />,
    unusual_spend:  <AlertTriangle className="w-4 h-4" />,
  }
  return icons[type] || <Bell className="w-4 h-4" />
}

const SEVERITY_BORDER: Record<AlertSeverity, string> = {
  danger:  'border-rose-500/25',
  warning: 'border-amber-500/25',
  success: 'border-emerald-500/25',
  info:    'border-blue-500/25',
}
const SEVERITY_BG: Record<AlertSeverity, string> = {
  danger:  'bg-rose-500/5',
  warning: 'bg-amber-500/5',
  success: 'bg-emerald-500/5',
  info:    'bg-blue-500/5',
}
const SEVERITY_DOT: Record<AlertSeverity, string> = {
  danger:  'bg-rose-400',
  warning: 'bg-amber-400',
  success: 'bg-emerald-400',
  info:    'bg-blue-400',
}

type Filter = 'all' | 'unread' | AlertSeverity

export default function AlertasPage() {
  const [alerts, setAlerts] = useState<Alert[]>(ALERTS)
  const [filter, setFilter] = useState<Filter>('all')

  const filtered = alerts.filter(a => {
    if (filter === 'all') return true
    if (filter === 'unread') return !a.isRead
    return a.severity === filter
  })

  const unread = alerts.filter(a => !a.isRead)

  const markRead = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, isRead: true } : a))
  }

  const markAllRead = () => {
    setAlerts(prev => prev.map(a => ({ ...a, isRead: true })))
  }

  const timeAgo = (dateStr: string): string => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(hours / 24)
    if (days > 0) return `há ${days}d`
    if (hours > 0) return `há ${hours}h`
    return 'agora'
  }

  const FILTERS: { value: Filter; label: string }[] = [
    { value: 'all',     label: `Todos (${alerts.length})` },
    { value: 'unread',  label: `Não lidos (${unread.length})` },
    { value: 'danger',  label: 'Urgente' },
    { value: 'warning', label: 'Atenção' },
    { value: 'success', label: 'Positivos' },
    { value: 'info',    label: 'Informativos' },
  ]

  return (
    <div className="p-6 space-y-6 max-w-[900px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Central de Alertas</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {unread.length > 0
              ? `${unread.length} alerta${unread.length > 1 ? 's' : ''} não lido${unread.length > 1 ? 's' : ''}`
              : 'Tudo em dia!'
            }
          </p>
        </div>
        {unread.length > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-slate-400 hover:text-slate-200 transition-all"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Marcar todos como lidos
          </button>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { severity: 'danger' as const,  label: 'Urgentes',      color: '#f43f5e', count: alerts.filter(a => a.severity === 'danger').length },
          { severity: 'warning' as const, label: 'Atenção',       color: '#f59e0b', count: alerts.filter(a => a.severity === 'warning').length },
          { severity: 'success' as const, label: 'Positivos',     color: '#10b981', count: alerts.filter(a => a.severity === 'success').length },
          { severity: 'info' as const,    label: 'Informativos',  color: '#3b82f6', count: alerts.filter(a => a.severity === 'info').length },
        ].map(({ label, color, count, severity }) => (
          <button
            key={severity}
            onClick={() => setFilter(severity)}
            className={cn(
              'rounded-2xl p-4 border text-left transition-all',
              filter === severity ? SEVERITY_BORDER[severity] : 'border-white/[0.06]',
              filter === severity ? SEVERITY_BG[severity] : 'bg-[#16161E]'
            )}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full" style={{ background: color }} />
              <span className="text-xs text-slate-500">{label}</span>
            </div>
            <p className="text-2xl font-bold" style={{ color }}>{count}</p>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {FILTERS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={cn(
              'px-3 py-1.5 rounded-xl text-xs font-medium transition-all',
              filter === value
                ? 'bg-primary-500/20 border border-primary-500/30 text-primary-300'
                : 'bg-white/[0.04] border border-white/[0.06] text-slate-400 hover:text-slate-200'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Alert list */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
            <p className="text-base font-semibold text-white mb-1">Tudo em dia!</p>
            <p className="text-sm text-slate-500">Nenhum alerta nesta categoria</p>
          </div>
        ) : filtered.map(alert => (
          <div
            key={alert.id}
            className={cn(
              'flex items-start gap-4 p-5 rounded-2xl border transition-all duration-200',
              alert.isRead
                ? 'bg-[#16161E] border-white/[0.06] opacity-70'
                : cn('border', SEVERITY_BORDER[alert.severity], SEVERITY_BG[alert.severity])
            )}
          >
            <SeverityIcon severity={alert.severity} />

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {!alert.isRead && (
                      <div className={cn('w-2 h-2 rounded-full flex-shrink-0', SEVERITY_DOT[alert.severity])} />
                    )}
                    <h3 className={cn('text-sm font-semibold', alert.isRead ? 'text-slate-400' : 'text-white')}>
                      {alert.title}
                    </h3>
                    <div className="flex items-center gap-1 text-slate-600">
                      <TypeIcon type={alert.type} />
                    </div>
                  </div>
                  <p className="text-sm text-slate-400 leading-relaxed">{alert.body}</p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-slate-600">{timeAgo(alert.createdAt)}</span>
                  {!alert.isRead && (
                    <button
                      onClick={() => markRead(alert.id)}
                      className="w-7 h-7 rounded-lg hover:bg-white/[0.08] flex items-center justify-center text-slate-500 hover:text-slate-300 transition-all"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {alert.actionLabel && alert.actionUrl && (
                <Link
                  href={alert.actionUrl}
                  className={cn(
                    'inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-xl text-xs font-medium transition-all',
                    alert.severity === 'danger' ? 'bg-rose-500/15 text-rose-400 hover:bg-rose-500/25' :
                    alert.severity === 'warning' ? 'bg-amber-500/15 text-amber-400 hover:bg-amber-500/25' :
                    alert.severity === 'success' ? 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25' :
                    'bg-blue-500/15 text-blue-400 hover:bg-blue-500/25'
                  )}
                  onClick={() => markRead(alert.id)}
                >
                  {alert.actionLabel} →
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
