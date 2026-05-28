'use client'

import { useState, useMemo } from 'react'
import { useUserStorage } from '@/hooks/useUserStorage'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import {
  TrendingUp, ArrowDownRight, ArrowUpRight,
  Bell, Target, ChevronRight, Sparkles, RefreshCw,
  DollarSign, PiggyBank, Activity, Pencil, Check, X,
} from 'lucide-react'
import { cn, formatCurrency, formatRelativeDate, getScoreColor, getScoreLabel } from '@/lib/utils'
import type { Account, Transaction, Goal, Alert } from '@/lib/types'

const MONTH_NAMES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

const ChartTip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#16161E] border border-primary-500/20 rounded-xl p-3 shadow-xl text-xs">
      <p className="text-slate-400 mb-2 font-medium">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-slate-400">{p.name === 'gastos' ? 'Gastos' : p.name === 'receitas' ? 'Receitas' : 'Saldo'}:</span>
          <span className="text-white font-semibold">{formatCurrency(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

const PieTip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#16161E] border border-primary-500/20 rounded-xl p-3 shadow-xl text-xs">
      <p className="text-white font-medium">{payload[0].name}</p>
      <p className="text-slate-400">{formatCurrency(payload[0].value)}</p>
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()

  const [income, setIncome] = useUserStorage('finai_income', 5000)
  const [editIncome, setEditIncome] = useState(false)
  const [incomeInput, setIncomeInput] = useState(String(income))

  // Live data from localStorage
  const [accounts] = useUserStorage<Account[]>('finai_accounts', [])
  const [transactions] = useUserStorage<Transaction[]>('finai_transactions', [])
  const [goals] = useUserStorage<Goal[]>('finai_goals', [])
  const [alerts] = useUserStorage<Alert[]>('finai_alerts', [])

  const totalBalance = useMemo(() => accounts.reduce((s, a) => s + a.balance, 0), [accounts])

  const now = new Date()
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const monthExpenses = useMemo(() =>
    transactions
      .filter(t => t.type === 'debit' && t.date.startsWith(currentMonth))
      .reduce((s, t) => s + Math.abs(t.amount), 0)
  , [transactions, currentMonth])

  const recentTx = useMemo(() =>
    [...transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8)
  , [transactions])

  const unreadAlerts = useMemo(() => alerts.filter(a => !a.isRead), [alerts])
  const activeGoals = useMemo(() => goals.filter(g => g.status === 'active').slice(0, 3), [goals])

  // Monthly cash flow chart — computed from transactions
  const monthlySpend = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1)
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const monthTxs = transactions.filter(t => t.date.startsWith(monthKey))
      const gastos = monthTxs.filter(t => t.type === 'debit').reduce((s, t) => s + Math.abs(t.amount), 0)
      const receitas = monthTxs.filter(t => t.type === 'credit').reduce((s, t) => s + t.amount, 0)
      return { month: MONTH_NAMES[d.getMonth()], gastos, receitas, saldo: receitas - gastos }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions])

  // Category spend pie chart — current month debits
  const categorySpend = useMemo(() => {
    const catMap: Record<string, { value: number; icon: string; color: string }> = {}
    transactions
      .filter(t => t.type === 'debit' && t.date.startsWith(currentMonth))
      .forEach(t => {
        if (!catMap[t.category]) catMap[t.category] = { value: 0, icon: t.categoryIcon, color: t.categoryColor }
        catMap[t.category].value += Math.abs(t.amount)
      })
    return Object.entries(catMap)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.value - a.value)
  }, [transactions, currentMonth])

  const savings = income - monthExpenses
  const savingsRate = income > 0 ? Math.max(0, Math.round((savings / income) * 100)) : 0
  const score = user?.score ?? 742

  const saveIncome = () => {
    const v = parseFloat(incomeInput)
    if (!isNaN(v) && v > 0) setIncome(v)
    setEditIncome(false)
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Bom dia, {user?.name ?? 'Paulo'} 👋</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-slate-400 hover:text-slate-200 hover:border-primary-500/30 transition-all">
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sincronizar</span>
          </button>
          <Link href="/chat" className="flex items-center gap-2 px-4 py-2 rounded-xl btn-primary text-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Perguntar ao CFO</span>
            <span className="sm:hidden">CFO IA</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total balance */}
        <div className="rounded-2xl bg-gradient-to-br from-primary-500/20 via-primary-600/10 to-transparent border border-primary-500/20 p-4 sm:p-5 shadow-card">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-xl bg-primary-500/20 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-primary-400" />
            </div>
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> ao vivo
            </span>
          </div>
          <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Saldo Total</p>
          <p className="text-xl sm:text-2xl font-bold text-white mt-1 tabular-nums financial-number">
            {formatCurrency(totalBalance)}
          </p>
          <p className="text-xs text-slate-600 mt-1">{accounts.length} conta{accounts.length !== 1 ? 's' : ''}</p>
        </div>

        {/* Income — editable */}
        <div className="rounded-2xl bg-[#16161E] border border-white/[0.06] p-4 sm:p-5 shadow-card group">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4 text-emerald-400" />
            </div>
            {!editIncome ? (
              <button
                onClick={() => { setIncomeInput(String(income)); setEditIncome(true) }}
                className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-lg hover:bg-white/10 flex items-center justify-center text-slate-500 hover:text-slate-300 transition-all"
              >
                <Pencil className="w-3 h-3" />
              </button>
            ) : (
              <div className="flex gap-1">
                <button onClick={saveIncome} className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 hover:bg-emerald-500/30 transition-all">
                  <Check className="w-3 h-3" />
                </button>
                <button onClick={() => setEditIncome(false)} className="w-6 h-6 rounded-lg bg-rose-500/20 flex items-center justify-center text-rose-400 hover:bg-rose-500/30 transition-all">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
          <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Renda Mensal</p>
          {editIncome ? (
            <div className="mt-1 flex items-center gap-1">
              <span className="text-slate-500 text-sm">R$</span>
              <input
                autoFocus
                type="number"
                value={incomeInput}
                onChange={e => setIncomeInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') saveIncome(); if (e.key === 'Escape') setEditIncome(false) }}
                className="finai-input w-full px-2 py-1 text-xl font-bold text-white"
              />
            </div>
          ) : (
            <p className="text-xl sm:text-2xl font-bold text-white mt-1 tabular-nums financial-number">
              {formatCurrency(income)}
            </p>
          )}
          <p className="text-xs text-emerald-400 mt-1">↑ Clique no lápis para editar</p>
        </div>

        {/* Month expenses */}
        <div className="rounded-2xl bg-[#16161E] border border-white/[0.06] p-4 sm:p-5 shadow-card">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-xl bg-rose-500/15 flex items-center justify-center">
              <ArrowDownRight className="w-4 h-4 text-rose-400" />
            </div>
            <span className="text-xs text-slate-500 font-medium">{savingsRate}% poupado</span>
          </div>
          <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Gastos do Mês</p>
          <p className="text-xl sm:text-2xl font-bold text-white mt-1 tabular-nums financial-number">
            {formatCurrency(monthExpenses)}
          </p>
          <p className="text-xs text-slate-600 mt-1">
            {savings >= 0 ? `Economia: ${formatCurrency(savings)}` : `Déficit: ${formatCurrency(Math.abs(savings))}`}
          </p>
        </div>

        {/* Score */}
        <div className="rounded-2xl bg-[#16161E] border border-white/[0.06] p-4 sm:p-5 shadow-card">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center">
              <Activity className="w-4 h-4 text-amber-400" />
            </div>
            <span className="text-xs text-slate-500">/ 1000</span>
          </div>
          <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Score FinAI</p>
          <div className="flex items-end gap-2 mt-1">
            <p className="text-xl sm:text-2xl font-bold financial-number" style={{ color: getScoreColor(score) }}>{score}</p>
            <span className="text-sm font-medium mb-0.5" style={{ color: getScoreColor(score) }}>{getScoreLabel(score)}</span>
          </div>
          <div className="mt-2 w-full h-1.5 rounded-full bg-white/5">
            <div className="h-1.5 rounded-full" style={{ width: `${(score / 1000) * 100}%`, background: `linear-gradient(90deg, ${getScoreColor(score)}, ${getScoreColor(score)}aa)`, boxShadow: `0 0 8px ${getScoreColor(score)}50` }} />
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Cash flow chart */}
        <div className="lg:col-span-2 rounded-2xl bg-[#16161E] border border-white/[0.06] p-5 shadow-card">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-semibold text-white">Fluxo de Caixa</h2>
              <p className="text-xs text-slate-500">Últimos 6 meses</p>
            </div>
            <div className="hidden sm:flex items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-500" />Gastos</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" />Receitas</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-primary-400" />Saldo</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={monthlySpend} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gGastos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gReceitas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gSaldo" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v/1000}k`} />
              <Tooltip content={<ChartTip />} />
              <Area type="monotone" dataKey="receitas" stroke="#10b981" strokeWidth={2} fill="url(#gReceitas)" dot={false} />
              <Area type="monotone" dataKey="gastos" stroke="#f43f5e" strokeWidth={2} fill="url(#gGastos)" dot={false} />
              <Area type="monotone" dataKey="saldo" stroke="#6366f1" strokeWidth={2} fill="url(#gSaldo)" dot={false} strokeDasharray="4 2" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Category breakdown */}
        <div className="rounded-2xl bg-[#16161E] border border-white/[0.06] p-5 shadow-card">
          <h2 className="text-sm font-semibold text-white mb-1">Categorias</h2>
          <p className="text-xs text-slate-500 mb-4">
            {MONTH_NAMES[now.getMonth()]} {now.getFullYear()}
          </p>
          {categorySpend.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[160px] gap-2">
              <div className="w-10 h-10 rounded-full bg-white/[0.04] flex items-center justify-center">
                <PiggyBank className="w-5 h-5 text-slate-600" />
              </div>
              <p className="text-xs text-slate-600 text-center">Nenhuma despesa este mês</p>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={130}>
                <PieChart>
                  <Pie data={categorySpend.slice(0, 6)} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" strokeWidth={0}>
                    {categorySpend.slice(0, 6).map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip content={<PieTip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-3">
                {categorySpend.slice(0, 5).map(cat => (
                  <div key={cat.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cat.color }} />
                      <span className="text-xs text-slate-400">{cat.icon} {cat.name}</span>
                    </div>
                    <span className="text-xs font-medium text-white tabular-nums">{formatCurrency(cat.value)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Transactions */}
        <div className="lg:col-span-2 rounded-2xl bg-[#16161E] border border-white/[0.06] p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">Últimas Transações</h2>
            <Link href="/contas" className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1">
              Ver todas <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          {recentTx.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <div className="w-10 h-10 rounded-full bg-white/[0.04] flex items-center justify-center">
                <ArrowDownRight className="w-5 h-5 text-slate-600" />
              </div>
              <p className="text-xs text-slate-600">Nenhuma transação ainda</p>
              <Link href="/contas" className="text-xs text-primary-400 hover:text-primary-300 mt-1">
                Adicionar lançamento →
              </Link>
            </div>
          ) : (
            <div className="space-y-1">
              {recentTx.map(tx => (
                <div key={tx.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.03] transition-colors cursor-pointer">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0" style={{ background: `${tx.categoryColor}15` }}>
                    {tx.categoryIcon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-200 truncate font-medium">{tx.description}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-slate-500">{formatRelativeDate(tx.date)}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: `${tx.categoryColor}15`, color: tx.categoryColor }}>{tx.category}</span>
                      {tx.splitWith && <span className="text-[10px] text-emerald-400">÷ {tx.splitWith}</span>}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={cn('text-sm font-semibold tabular-nums', tx.type === 'credit' ? 'text-emerald-400' : 'text-slate-200')}>
                      {tx.type === 'credit' ? '+' : ''}{formatCurrency(Math.abs(tx.amount))}
                    </p>
                    <p className="text-[10px] text-slate-600 mt-0.5">{accounts.find(a => a.id === tx.accountId)?.name}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Alerts */}
          <div className="rounded-2xl bg-[#16161E] border border-white/[0.06] p-4 shadow-card">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <Bell className="w-4 h-4 text-rose-400" />Alertas
                {unreadAlerts.length > 0 && (
                  <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">{unreadAlerts.length}</span>
                )}
              </h2>
              <Link href="/alertas" className="text-xs text-primary-400 hover:text-primary-300">Ver todos</Link>
            </div>
            {unreadAlerts.length === 0 ? (
              <p className="text-xs text-slate-600 py-4 text-center">Nenhum alerta no momento</p>
            ) : (
              <div className="space-y-2">
                {unreadAlerts.slice(0, 3).map(alert => (
                  <div key={alert.id} className={cn('flex items-start gap-3 p-3 rounded-xl border',
                    alert.severity === 'danger' && 'bg-rose-500/8 border-rose-500/20',
                    alert.severity === 'warning' && 'bg-amber-500/8 border-amber-500/20',
                    alert.severity === 'info' && 'bg-blue-500/8 border-blue-500/20',
                    alert.severity === 'success' && 'bg-emerald-500/8 border-emerald-500/20',
                  )}>
                    <div className={cn('w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0',
                      alert.severity === 'danger' && 'bg-rose-400',
                      alert.severity === 'warning' && 'bg-amber-400',
                      alert.severity === 'info' && 'bg-blue-400',
                      alert.severity === 'success' && 'bg-emerald-400',
                    )} />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-slate-200 leading-tight">{alert.title}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{alert.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Goals */}
          <div className="rounded-2xl bg-[#16161E] border border-white/[0.06] p-4 shadow-card">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <Target className="w-4 h-4 text-amber-400" />Metas
              </h2>
              <Link href="/metas" className="text-xs text-primary-400 hover:text-primary-300">Ver todas</Link>
            </div>
            {activeGoals.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-4">
                <p className="text-xs text-slate-600 text-center">Nenhuma meta cadastrada</p>
                <Link href="/metas" className="text-xs text-primary-400 hover:text-primary-300">Criar meta →</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {activeGoals.map(goal => {
                  const pct = Math.round((goal.currentAmount / goal.targetAmount) * 100)
                  return (
                    <div key={goal.id}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{goal.icon}</span>
                          <span className="text-xs text-slate-300 font-medium">{goal.name}</span>
                        </div>
                        <span className="text-xs font-bold" style={{ color: goal.color }}>{pct}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-white/5">
                        <div className="h-1.5 rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: goal.color, boxShadow: `0 0 6px ${goal.color}50` }} />
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-[10px] text-slate-600">{formatCurrency(goal.currentAmount)}</span>
                        <span className="text-[10px] text-slate-600">{formatCurrency(goal.targetAmount)}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
