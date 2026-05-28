'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { useUserStorage } from '@/hooks/useUserStorage'
import { useAuth } from '@/contexts/AuthContext'
import {
  TrendingUp, TrendingDown, Shield, Target, CreditCard,
  Landmark, CheckCircle2, XCircle, ChevronRight, Activity,
  AlertCircle,
} from 'lucide-react'
import {
  cn, formatCurrency, getScoreColor, getScoreLabel, calculateFinancialScore,
} from '@/lib/utils'
import type { Account, Transaction, Goal, Bill } from '@/lib/types'

// ─── Score factor types ────────────────────────────────────────────────────────

interface ScoreFactor {
  label: string
  description: string
  points: number
  maxPoints: number
  status: 'good' | 'warning' | 'bad' | 'neutral'
  tip: string
  icon: React.ElementType
}

// ─── Gauge arc SVG component ──────────────────────────────────────────────────

function ScoreGauge({ score }: { score: number }) {
  const color = getScoreColor(score)
  const pct = score / 1000
  // Arc from 210° to -30° (240° sweep)
  const r = 70
  const cx = 90
  const cy = 90
  const startAngle = 210
  const sweepAngle = 240
  const endAngle = startAngle - sweepAngle * pct

  function polar(angle: number) {
    const rad = (angle * Math.PI) / 180
    return {
      x: cx + r * Math.cos(rad),
      y: cy - r * Math.sin(rad),
    }
  }

  const start = polar(startAngle)
  const end = polar(endAngle)
  const trackEnd = polar(startAngle - sweepAngle)
  const largeArc = sweepAngle * pct > 180 ? 1 : 0
  const trackLargeArc = sweepAngle > 180 ? 1 : 0

  return (
    <svg width="180" height="130" viewBox="0 0 180 130">
      {/* Track */}
      <path
        d={`M ${start.x} ${start.y} A ${r} ${r} 0 ${trackLargeArc} 0 ${trackEnd.x} ${trackEnd.y}`}
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth="12"
        strokeLinecap="round"
      />
      {/* Fill */}
      {pct > 0 && (
        <path
          d={`M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 6px ${color}80)` }}
        />
      )}
      {/* Score text */}
      <text x={cx} y={cy + 5} textAnchor="middle" fill="white" fontSize="28" fontWeight="700" fontFamily="inherit">
        {score}
      </text>
      <text x={cx} y={cy + 24} textAnchor="middle" fill={color} fontSize="11" fontWeight="600" fontFamily="inherit">
        {getScoreLabel(score).toUpperCase()}
      </text>
      {/* Labels */}
      <text x="14" y="118" fill="#475569" fontSize="9" fontFamily="inherit">0</text>
      <text x="152" y="118" fill="#475569" fontSize="9" fontFamily="inherit">1000</text>
    </svg>
  )
}

// ─── Factor card ──────────────────────────────────────────────────────────────

function FactorCard({ factor }: { factor: ScoreFactor }) {
  const Icon = factor.icon
  const barColor = factor.status === 'good' ? '#10b981' : factor.status === 'warning' ? '#f59e0b' : factor.status === 'bad' ? '#f43f5e' : '#6366f1'
  const barW = factor.maxPoints > 0 ? Math.max(0, Math.min(100, (factor.points / factor.maxPoints) * 100)) : 0

  return (
    <div className="rounded-2xl bg-[#16161E] border border-white/[0.06] p-4">
      <div className="flex items-start gap-3 mb-3">
        <div className={cn(
          'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0',
          factor.status === 'good' ? 'bg-emerald-500/15' :
          factor.status === 'warning' ? 'bg-amber-500/15' :
          factor.status === 'bad' ? 'bg-rose-500/15' : 'bg-primary-500/15'
        )}>
          <Icon className={cn(
            'w-4 h-4',
            factor.status === 'good' ? 'text-emerald-400' :
            factor.status === 'warning' ? 'text-amber-400' :
            factor.status === 'bad' ? 'text-rose-400' : 'text-primary-400'
          )} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-200">{factor.label}</p>
            <span className={cn(
              'text-xs font-bold tabular-nums',
              factor.status === 'good' ? 'text-emerald-400' :
              factor.status === 'warning' ? 'text-amber-400' :
              factor.status === 'bad' ? 'text-rose-400' : 'text-primary-400'
            )}>
              {factor.points > 0 ? '+' : ''}{factor.points}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 truncate">{factor.description}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 rounded-full bg-white/[0.05] mb-2">
        <div
          className="h-1.5 rounded-full transition-all duration-500"
          style={{ width: `${barW}%`, background: barColor, boxShadow: `0 0 6px ${barColor}60` }}
        />
      </div>

      {/* Tip */}
      <p className="text-[11px] text-slate-600 leading-relaxed">{factor.tip}</p>
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function ScorePage() {
  const { user } = useAuth()

  const [accounts] = useUserStorage<Account[]>('finai_accounts', [])
  const [transactions] = useUserStorage<Transaction[]>('finai_transactions', [])
  const [goals] = useUserStorage<Goal[]>('finai_goals', [])
  const [bills] = useUserStorage<Bill[]>('finai_bills', [])
  const [income] = useUserStorage<number>('finai_income', 0)

  const now = new Date()
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const totalBalance = useMemo(
    () => accounts.reduce((s, a) => s + a.balance, 0),
    [accounts]
  )

  const monthExpenses = useMemo(
    () => transactions
      .filter(t => t.type === 'debit' && t.date.startsWith(currentMonth))
      .reduce((s, t) => s + Math.abs(t.amount), 0),
    [transactions, currentMonth]
  )

  const hasData = accounts.length > 0 || goals.length > 0 || bills.length > 0

  const score = useMemo(
    () => calculateFinancialScore({ income, monthExpenses, totalBalance, accounts, goals, bills }) ?? (user?.score ?? 742),
    [income, monthExpenses, totalBalance, accounts, goals, bills, user?.score]
  )

  const today = now.toISOString().slice(0, 10)
  const overdueCount = bills.filter(b => b.status === 'pending' && b.dueDate < today).length
  const activeGoals = goals.filter(g => g.status === 'active')
  const avgGoalPct = activeGoals.length > 0
    ? Math.round(activeGoals.reduce((s, g) => s + (g.targetAmount > 0 ? g.currentAmount / g.targetAmount : 0), 0) / activeGoals.length * 100)
    : 0

  const savingsRate = income > 0 ? Math.max(0, Math.round(((income - monthExpenses) / income) * 100)) : 0
  const emergencyMonths = income > 0 ? +(totalBalance / income).toFixed(1) : 0

  // Build score factors with real data
  const factors = useMemo((): ScoreFactor[] => {
    let savingsPoints = 0
    let savingsStatus: ScoreFactor['status'] = 'bad'
    let savingsTip = ''
    if (income <= 0) {
      savingsPoints = 0
      savingsStatus = 'neutral'
      savingsTip = 'Cadastre sua renda mensal no Dashboard para cálculo preciso.'
    } else if (savingsRate >= 30) {
      savingsPoints = 200; savingsStatus = 'good'
      savingsTip = '🔥 Incrível! Poupança acima de 30% — você está no caminho certo.'
    } else if (savingsRate >= 20) {
      savingsPoints = 150; savingsStatus = 'good'
      savingsTip = '✅ Acima dos 20% recomendados. Tente chegar a 30% para o máximo.'
    } else if (savingsRate >= 10) {
      savingsPoints = 80; savingsStatus = 'warning'
      savingsTip = '⚠️ Tente reduzir despesas para chegar em 20% de poupança.'
    } else {
      savingsPoints = 20; savingsStatus = 'bad'
      savingsTip = '🔴 Poupança abaixo de 10%. Revise seus gastos urgentemente.'
    }

    let reservePoints = 0
    let reserveStatus: ScoreFactor['status'] = 'bad'
    let reserveTip = ''
    if (emergencyMonths >= 6) {
      reservePoints = 100; reserveStatus = 'good'
      reserveTip = '✅ Reserva excelente! 6+ meses cobertos.'
    } else if (emergencyMonths >= 3) {
      reservePoints = 60; reserveStatus = 'warning'
      reserveTip = `⚠️ Você tem ${emergencyMonths} meses cobertos. Meta: 6 meses (${formatCurrency(monthExpenses * 6)}).`
    } else if (emergencyMonths >= 1) {
      reservePoints = 20; reserveStatus = 'warning'
      reserveTip = `⚠️ Reserva de apenas ${emergencyMonths} mês. Priorize chegar a 3 meses (${formatCurrency(monthExpenses * 3)}).`
    } else {
      reservePoints = 0; reserveStatus = 'bad'
      reserveTip = `🔴 Sem reserva de emergência. Comece guardando ${formatCurrency(monthExpenses * 3)} (3 meses de gastos).`
    }

    let goalsPoints = 0
    let goalsStatus: ScoreFactor['status'] = 'neutral'
    let goalsTip = ''
    if (activeGoals.length === 0) {
      goalsPoints = 0; goalsStatus = 'neutral'
      goalsTip = 'Cadastre metas financeiras para ganhar pontos neste fator.'
    } else if (avgGoalPct >= 75) {
      goalsPoints = 100; goalsStatus = 'good'
      goalsTip = `✅ Excelente progresso! Média de ${avgGoalPct}% nas suas metas.`
    } else if (avgGoalPct >= 40) {
      goalsPoints = 60; goalsStatus = 'warning'
      goalsTip = `⚠️ Progresso médio de ${avgGoalPct}%. Continue aportando regularmente.`
    } else {
      goalsPoints = 20; goalsStatus = 'warning'
      goalsTip = `Metas com ${avgGoalPct}% de progresso médio. Aumente os aportes mensais.`
    }

    let billsPoints = -overdueCount * 40
    let billsStatus: ScoreFactor['status'] = overdueCount === 0 ? 'good' : 'bad'
    let billsTip = ''
    if (overdueCount === 0) {
      billsTip = bills.length > 0
        ? '✅ Todas as contas estão em dia!'
        : 'Sem contas a pagar cadastradas.'
    } else {
      billsTip = `🔴 Você tem ${overdueCount} conta(s) em atraso. Pague o mais rápido possível para evitar juros.`
    }

    return [
      {
        label: 'Taxa de Poupança',
        description: income > 0 ? `${savingsRate}% da renda — ${formatCurrency(Math.max(0, income - monthExpenses))}/mês` : 'Renda mensal não informada',
        points: savingsPoints,
        maxPoints: 200,
        status: savingsStatus,
        tip: savingsTip,
        icon: TrendingUp,
      },
      {
        label: 'Reserva de Emergência',
        description: income > 0 ? `${emergencyMonths} meses cobertos` : 'Configure sua renda no Dashboard',
        points: reservePoints,
        maxPoints: 100,
        status: reserveStatus,
        tip: reserveTip,
        icon: Shield,
      },
      {
        label: 'Progresso das Metas',
        description: activeGoals.length > 0 ? `${activeGoals.length} meta${activeGoals.length !== 1 ? 's' : ''} ativa${activeGoals.length !== 1 ? 's' : ''} — média ${avgGoalPct}%` : 'Nenhuma meta ativa',
        points: goalsPoints,
        maxPoints: 100,
        status: goalsStatus,
        tip: goalsTip,
        icon: Target,
      },
      {
        label: 'Contas em Dia',
        description: overdueCount === 0 ? `${bills.filter(b => b.status === 'pending').length} pendente(s), nenhuma em atraso` : `${overdueCount} em atraso`,
        points: billsPoints,
        maxPoints: 0,
        status: billsStatus,
        tip: billsTip,
        icon: CreditCard,
      },
    ]
  }, [savingsRate, emergencyMonths, avgGoalPct, activeGoals, overdueCount, income, monthExpenses, bills])

  const scoreColor = getScoreColor(score)
  const scoreLabel = getScoreLabel(score)

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Score FinAI</h1>
        <p className="text-sm text-slate-500 mt-0.5">Saúde financeira calculada com seus dados reais</p>
      </div>

      {/* Score gauge + summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Gauge card */}
        <div className="rounded-2xl bg-[#16161E] border border-white/[0.06] p-6 flex flex-col items-center">
          <ScoreGauge score={score} />
          <div className="mt-2 text-center">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Classificação</p>
            <span
              className="inline-block px-4 py-1.5 rounded-full text-sm font-bold"
              style={{ background: `${scoreColor}20`, color: scoreColor }}
            >
              {scoreLabel}
            </span>
          </div>
          {!hasData && (
            <p className="text-[11px] text-slate-600 text-center mt-3 leading-relaxed">
              Adicione contas e transações para um score preciso baseado nos seus dados reais.
            </p>
          )}
        </div>

        {/* Quick stats */}
        <div className="space-y-3">
          {[
            { label: 'Poupança Mensal', value: income > 0 ? `${savingsRate}%` : '—', sub: income > 0 ? formatCurrency(Math.max(0, income - monthExpenses)) + '/mês' : 'Configure a renda', ok: savingsRate >= 20, icon: TrendingUp },
            { label: 'Reserva de Emergência', value: income > 0 ? `${emergencyMonths}m` : '—', sub: income > 0 ? `de ${formatCurrency(monthExpenses * 6)} (ideal)` : 'Configure a renda', ok: emergencyMonths >= 3, icon: Shield },
            { label: 'Metas Ativas', value: String(activeGoals.length), sub: activeGoals.length > 0 ? `${avgGoalPct}% progresso médio` : 'Nenhuma meta criada', ok: activeGoals.length > 0, icon: Target },
            { label: 'Contas em Atraso', value: String(overdueCount), sub: overdueCount === 0 ? 'Tudo em dia ✅' : `Regularize para +${overdueCount * 40} pts`, ok: overdueCount === 0, icon: overdueCount === 0 ? CheckCircle2 : AlertCircle },
          ].map(item => {
            const Icon = item.icon
            return (
              <div key={item.label} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', item.ok ? 'bg-emerald-500/15' : 'bg-amber-500/15')}>
                  <Icon className={cn('w-4 h-4', item.ok ? 'text-emerald-400' : 'text-amber-400')} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-500">{item.label}</p>
                  <p className="text-sm font-semibold text-slate-200">{item.value}</p>
                </div>
                <p className="text-[10px] text-slate-600 text-right hidden sm:block max-w-[90px]">{item.sub}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Factors breakdown */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary-400" />
            Detalhamento do Score
          </h2>
          <span className="text-xs text-slate-500">Base: 550 pts + fatores</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {factors.map(f => <FactorCard key={f.label} factor={f} />)}
        </div>
      </div>

      {/* How to improve */}
      <div className="rounded-2xl bg-gradient-to-br from-primary-500/10 to-transparent border border-primary-500/15 p-5">
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary-400" />
          Como melhorar seu score
        </h3>
        <div className="space-y-2.5">
          {savingsRate < 20 && income > 0 && (
            <div className="flex items-start gap-2.5">
              <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-slate-200">Aumente a poupança para 20%+</p>
                <p className="text-[11px] text-slate-500">Reduza gastos variáveis (lazer, delivery) para chegar em {formatCurrency(income * 0.20)}/mês poupados.</p>
              </div>
            </div>
          )}
          {emergencyMonths < 3 && income > 0 && (
            <div className="flex items-start gap-2.5">
              <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-slate-200">Monte sua reserva de emergência</p>
                <p className="text-[11px] text-slate-500">Meta: {formatCurrency(monthExpenses * 3)} (3 meses de gastos). Aplique em CDB ou Tesouro Selic.</p>
              </div>
            </div>
          )}
          {activeGoals.length === 0 && (
            <div className="flex items-start gap-2.5">
              <XCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-slate-200">Cadastre metas financeiras</p>
                <p className="text-[11px] text-slate-500">Metas dão foco e estrutura ao seu planejamento, e adicionam pontos ao seu score.</p>
              </div>
            </div>
          )}
          {overdueCount > 0 && (
            <div className="flex items-start gap-2.5">
              <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-slate-200">Regularize {overdueCount} conta(s) em atraso</p>
                <p className="text-[11px] text-slate-500">Cada conta em atraso custa -{40} pontos. Pague o quanto antes para recuperar {overdueCount * 40} pts.</p>
              </div>
            </div>
          )}
          {savingsRate >= 20 && emergencyMonths >= 3 && activeGoals.length > 0 && overdueCount === 0 && (
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-emerald-300">Ótima situação financeira! 🎉</p>
                <p className="text-[11px] text-slate-500">Mantenha a disciplina e considere diversificar investimentos para crescer ainda mais.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick nav */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Ver Metas', href: '/metas', icon: Target, color: '#FCD34D' },
          { label: 'Contas a Pagar', href: '/contas-a-pagar', icon: CreditCard, color: '#FB923C' },
          { label: 'Minhas Contas', href: '/contas', icon: Landmark, color: '#60A5FA' },
          { label: 'CFO IA', href: '/chat', icon: TrendingDown, color: '#67E8F9' },
        ].map(({ label, href, icon: Icon, color }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-2.5 p-3 rounded-xl bg-[#16161E] border border-white/[0.06] hover:border-primary-500/20 hover:bg-white/[0.03] transition-all group"
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${color}15` }}>
              <Icon className="w-4 h-4" style={{ color }} />
            </div>
            <span className="text-xs font-medium text-slate-400 group-hover:text-slate-200 transition-colors">{label}</span>
            <ChevronRight className="w-3 h-3 text-slate-600 ml-auto flex-shrink-0 group-hover:text-slate-400 transition-colors" />
          </Link>
        ))}
      </div>
    </div>
  )
}
