'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { useAuth } from '@/contexts/AuthContext'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadialBarChart, RadialBar,
} from 'recharts'
import { TrendingUp, Calendar, DollarSign, AlertCircle, Calculator, ChevronDown, ChevronUp, Pencil, Check, X } from 'lucide-react'
import { cn, formatCurrency, percentage } from '@/lib/utils'
import { CONSORCIO } from '@/lib/mock-data'

function buildAmortization(startPaid: number, totalMonths: number, monthlyValue: number, currentValue: number) {
  const rows = []
  for (let i = startPaid + 1; i <= Math.min(startPaid + 12, totalMonths); i++) {
    rows.push({
      parcela: i,
      valor: monthlyValue,
      acumulado: i * monthlyValue,
      restante: Math.max(0, currentValue - (i * monthlyValue)),
      data: new Date(2026, 4 + (i - startPaid - 1), 27).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
    })
  }
  return rows
}

function buildBalanceChart(startPaid: number, total: number, monthly: number, currentValue: number) {
  return Array.from({ length: total - startPaid }, (_, i) => ({
    month: i + startPaid + 1,
    pago: (startPaid + i + 1) * monthly,
    restante: Math.max(0, currentValue - ((startPaid + i + 1) * monthly)),
    label: `Parcela ${startPaid + i + 1}`,
  })).filter((_, i) => i % 6 === 0 || i === 0)
}

const SICREDI_COLOR = '#006b3f'

export default function ConsorcioPage() {
  const { user } = useAuth()
  const router = useRouter()

  // Paulo-only guard
  useEffect(() => {
    if (user && user.id !== 'paulo') {
      router.replace('/dashboard')
    }
  }, [user, router])

  const [extraPayment, setExtraPayment] = useState(0)
  const [showTable, setShowTable] = useState(false)

  // Persistent editable fields
  const [currentValue, setCurrentValue] = useLocalStorage('finai_consorcio_value', CONSORCIO.currentValue)
  const [monthlyPayment, setMonthlyPayment] = useLocalStorage('finai_consorcio_payment', CONSORCIO.monthlyPayment)
  const [paidInstallments, setPaidInstallments] = useLocalStorage('finai_consorcio_paid', CONSORCIO.paidInstallments)
  const [totalInstallments, setTotalInstallments] = useLocalStorage('finai_consorcio_total', CONSORCIO.totalInstallments)
  const [institution, setInstitution] = useLocalStorage('finai_consorcio_name', CONSORCIO.institution)

  // Installments paid before user took ownership
  const [priorInstallments, setPriorInstallments] = useLocalStorage('finai_consorcio_prior', 0)

  // Edit states (UI only)
  const [editingValue, setEditingValue] = useState(false)
  const [editingPayment, setEditingPayment] = useState(false)
  const [editingPaid, setEditingPaid] = useState(false)
  const [editingTotal, setEditingTotal] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [editingPrior, setEditingPrior] = useState(false)

  const [tempValue, setTempValue] = useState('')
  const [tempPayment, setTempPayment] = useState('')
  const [tempPaid, setTempPaid] = useState('')
  const [tempTotal, setTempTotal] = useState('')
  const [tempName, setTempName] = useState('')
  const [tempPrior, setTempPrior] = useState('')

  // Don't render content for Gabriel while redirect fires
  if (!user || user.id !== 'paulo') return null

  const totalPaid = paidInstallments * monthlyPayment
  const remaining = currentValue - totalPaid
  const remainingInstallments = totalInstallments - paidInstallments

  // User-perspective: only installments the user personally paid
  const myPaid = Math.max(0, paidInstallments - priorInstallments)
  const myTotal = Math.max(1, totalInstallments - priorInstallments)
  const myPct = percentage(myPaid, myTotal)

  // Overall pct still used for balance chart / amortization
  const pct = percentage(paidInstallments, totalInstallments)

  const endDate = new Date(2023, 6, 1)
  endDate.setMonth(endDate.getMonth() + totalInstallments)

  const savedMonths = extraPayment > 0 ? Math.floor(extraPayment / monthlyPayment) : 0
  const newEndDate = new Date(endDate)
  newEndDate.setMonth(newEndDate.getMonth() - savedMonths)
  const totalSavings = savedMonths * monthlyPayment
  const percentReduction = remainingInstallments > 0 ? Math.round((savedMonths / remainingInstallments) * 100) : 0

  const amortRows = buildAmortization(paidInstallments, totalInstallments, monthlyPayment, currentValue)
  const chartData = buildBalanceChart(paidInstallments, totalInstallments, monthlyPayment, currentValue)
  const radialData = [{ name: 'Progresso', value: pct, fill: SICREDI_COLOR }]

  const saveField = (setter: (v: number) => void, temp: string, onClose: () => void) => {
    const v = parseFloat(temp)
    if (!isNaN(v) && v >= 0) setter(v)
    onClose()
  }

  const saveInt = (setter: (v: number) => void, temp: string, onClose: () => void) => {
    const v = parseInt(temp)
    if (!isNaN(v) && v > 0) setter(v)
    onClose()
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-[1400px]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Consórcio Sicredi</h1>
          <p className="text-sm text-slate-500 mt-0.5">Bens Móveis · Índice IPCA · Grupo {CONSORCIO.group} · Cota {CONSORCIO.quota}</p>
        </div>
        {/* Editable institution badge */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl border group" style={{ background: `${SICREDI_COLOR}15`, borderColor: `${SICREDI_COLOR}30` }}>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ background: `linear-gradient(135deg, ${SICREDI_COLOR}, ${SICREDI_COLOR}99)` }}>SR</div>
          {editingName ? (
            <div className="flex items-center gap-2">
              <input
                autoFocus
                value={tempName}
                onChange={e => setTempName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { if (tempName.trim()) setInstitution(tempName.trim()); setEditingName(false) } if (e.key === 'Escape') setEditingName(false) }}
                className="finai-input px-2 py-1 text-sm font-semibold w-48"
                style={{ color: SICREDI_COLOR }}
              />
              <button onClick={() => { if (tempName.trim()) setInstitution(tempName.trim()); setEditingName(false) }} className="w-5 h-5 rounded bg-emerald-500/20 flex items-center justify-center text-emerald-400"><Check className="w-3 h-3" /></button>
              <button onClick={() => setEditingName(false)} className="w-5 h-5 rounded bg-rose-500/20 flex items-center justify-center text-rose-400"><X className="w-3 h-3" /></button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold" style={{ color: SICREDI_COLOR }}>{institution}</span>
              <button onClick={() => { setTempName(institution); setEditingName(true) }} className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded hover:bg-white/10 flex items-center justify-center text-slate-500 hover:text-slate-300 transition-all">
                <Pencil className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* KPIs — all 4 editable */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Carta Atual — editable */}
        <div className="rounded-2xl border p-5 group" style={{ background: `linear-gradient(135deg, ${SICREDI_COLOR}18, transparent)`, borderColor: `${SICREDI_COLOR}25` }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" style={{ color: SICREDI_COLOR }} />
              <span className="text-xs text-slate-500 uppercase tracking-wider">Carta Atual</span>
            </div>
            {!editingValue ? (
              <button onClick={() => { setTempValue(String(currentValue)); setEditingValue(true) }} className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-lg hover:bg-white/10 flex items-center justify-center text-slate-500 hover:text-slate-300 transition-all">
                <Pencil className="w-3 h-3" />
              </button>
            ) : (
              <div className="flex gap-1">
                <button onClick={() => saveField(setCurrentValue, tempValue, () => setEditingValue(false))} className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400"><Check className="w-3 h-3" /></button>
                <button onClick={() => setEditingValue(false)} className="w-6 h-6 rounded-lg bg-rose-500/20 flex items-center justify-center text-rose-400"><X className="w-3 h-3" /></button>
              </div>
            )}
          </div>
          {editingValue ? (
            <div className="flex items-center gap-1">
              <span className="text-slate-500 text-sm">R$</span>
              <input autoFocus type="number" value={tempValue} onChange={e => setTempValue(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') saveField(setCurrentValue, tempValue, () => setEditingValue(false)) }} className="finai-input w-full px-2 py-1 text-xl font-bold text-white" />
            </div>
          ) : (
            <p className="text-2xl font-bold text-white tabular-nums financial-number">{formatCurrency(currentValue)}</p>
          )}
          <p className="text-xs text-slate-500 mt-1">Original: {formatCurrency(CONSORCIO.originalValue)} · <span style={{ color: SICREDI_COLOR }}>IPCA +{(((currentValue - CONSORCIO.originalValue) / CONSORCIO.originalValue) * 100).toFixed(1)}%</span></p>
        </div>

        {/* Parcela Mensal — editable */}
        <div className="rounded-2xl bg-[#16161E] border border-white/[0.06] p-5 group">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary-400" />
              <span className="text-xs text-slate-500 uppercase tracking-wider">Parcela Mensal</span>
            </div>
            {!editingPayment ? (
              <button onClick={() => { setTempPayment(String(monthlyPayment)); setEditingPayment(true) }} className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-lg hover:bg-white/10 flex items-center justify-center text-slate-500 hover:text-slate-300 transition-all">
                <Pencil className="w-3 h-3" />
              </button>
            ) : (
              <div className="flex gap-1">
                <button onClick={() => saveField(setMonthlyPayment, tempPayment, () => setEditingPayment(false))} className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400"><Check className="w-3 h-3" /></button>
                <button onClick={() => setEditingPayment(false)} className="w-6 h-6 rounded-lg bg-rose-500/20 flex items-center justify-center text-rose-400"><X className="w-3 h-3" /></button>
              </div>
            )}
          </div>
          {editingPayment ? (
            <div className="flex items-center gap-1">
              <span className="text-slate-500 text-sm">R$</span>
              <input autoFocus type="number" value={tempPayment} onChange={e => setTempPayment(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') saveField(setMonthlyPayment, tempPayment, () => setEditingPayment(false)) }} className="finai-input w-full px-2 py-1 text-xl font-bold text-white" />
            </div>
          ) : (
            <p className="text-2xl font-bold text-white tabular-nums financial-number">{formatCurrency(monthlyPayment)}</p>
          )}
          <p className="text-xs text-slate-500 mt-1">Próx. débito: 27/mai/2026</p>
        </div>

        {/* Parcelas Pagas — editable count */}
        <div className="rounded-2xl bg-[#16161E] border border-white/[0.06] p-5 group">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-slate-500 uppercase tracking-wider">Já Pago</span>
            </div>
            {!editingPaid ? (
              <button onClick={() => { setTempPaid(String(paidInstallments)); setEditingPaid(true) }} className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-lg hover:bg-white/10 flex items-center justify-center text-slate-500 hover:text-slate-300 transition-all" title="Editar parcelas pagas">
                <Pencil className="w-3 h-3" />
              </button>
            ) : (
              <div className="flex gap-1">
                <button onClick={() => saveInt(setPaidInstallments, tempPaid, () => setEditingPaid(false))} className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400"><Check className="w-3 h-3" /></button>
                <button onClick={() => setEditingPaid(false)} className="w-6 h-6 rounded-lg bg-rose-500/20 flex items-center justify-center text-rose-400"><X className="w-3 h-3" /></button>
              </div>
            )}
          </div>
          <p className="text-2xl font-bold text-white tabular-nums financial-number">{formatCurrency(totalPaid)}</p>
          {editingPaid ? (
            <div className="flex items-center gap-1 mt-1">
              <input autoFocus type="number" value={tempPaid} onChange={e => setTempPaid(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') saveInt(setPaidInstallments, tempPaid, () => setEditingPaid(false)) }} className="finai-input w-20 px-2 py-1 text-xs text-white" placeholder="total pagas" />
              <span className="text-xs text-slate-500">total</span>
            </div>
          ) : (
            <div className="mt-1">
              <p className="text-xs text-emerald-400">{myPaid} minhas · {priorInstallments > 0 ? `${priorInstallments} anteriores` : 'nenhuma anterior'}</p>
            </div>
          )}
        </div>

        {/* Total de Parcelas — editable */}
        <div className="rounded-2xl bg-[#16161E] border border-white/[0.06] p-5 group">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              <span className="text-xs text-slate-500 uppercase tracking-wider">A Pagar</span>
            </div>
            {!editingTotal ? (
              <button onClick={() => { setTempTotal(String(totalInstallments)); setEditingTotal(true) }} className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-lg hover:bg-white/10 flex items-center justify-center text-slate-500 hover:text-slate-300 transition-all" title="Editar total de parcelas">
                <Pencil className="w-3 h-3" />
              </button>
            ) : (
              <div className="flex gap-1">
                <button onClick={() => saveInt(setTotalInstallments, tempTotal, () => setEditingTotal(false))} className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400"><Check className="w-3 h-3" /></button>
                <button onClick={() => setEditingTotal(false)} className="w-6 h-6 rounded-lg bg-rose-500/20 flex items-center justify-center text-rose-400"><X className="w-3 h-3" /></button>
              </div>
            )}
          </div>
          <p className="text-2xl font-bold text-white tabular-nums financial-number">{formatCurrency(Math.max(0, remaining))}</p>
          {editingTotal ? (
            <div className="flex items-center gap-1 mt-1">
              <input autoFocus type="number" value={tempTotal} onChange={e => setTempTotal(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') saveInt(setTotalInstallments, tempTotal, () => setEditingTotal(false)) }} className="finai-input w-20 px-2 py-1 text-xs text-white" placeholder="total" />
              <span className="text-xs text-slate-500">total</span>
            </div>
          ) : (
            <p className="text-xs text-slate-500 mt-1">{remainingInstallments} parcelas restantes</p>
          )}
        </div>
      </div>

      {/* Progress + Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Radial */}
        <div className="rounded-2xl bg-[#16161E] border border-white/[0.06] p-6 shadow-card flex flex-col items-center justify-center">
          <div className="relative">
            <ResponsiveContainer width={180} height={180}>
              <RadialBarChart cx="50%" cy="50%" innerRadius={55} outerRadius={80} barSize={14} data={[{ name: 'Meu progresso', value: myPct, fill: SICREDI_COLOR }]} startAngle={90} endAngle={-270}>
                <RadialBar background={{ fill: 'rgba(255,255,255,0.04)' }} dataKey="value" cornerRadius={8} fill={SICREDI_COLOR} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-white">{myPct}%</span>
              <span className="text-xs text-slate-500">meu avanço</span>
            </div>
          </div>
          <div className="mt-4 text-center">
            <p className="text-sm font-semibold text-white">Início: jul/2023</p>
            <p className="text-sm text-slate-500">Término: <span style={{ color: SICREDI_COLOR }}>{endDate.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}</span></p>
          </div>
          {/* User-perspective installment counters */}
          <div className="mt-3 grid grid-cols-2 gap-3 w-full">
            <div className="text-center p-3 rounded-xl bg-white/[0.04]">
              <p className="text-lg font-bold text-white">{myPaid}<span className="text-sm text-slate-500">/{myTotal}</span></p>
              <p className="text-[10px] text-slate-500">Minhas parcelas</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-white/[0.04]">
              <p className="text-lg font-bold text-white">{myTotal - myPaid}</p>
              <p className="text-[10px] text-slate-500">Ainda devo</p>
            </div>
          </div>
          {/* Editable "prior installments" field */}
          <div className="mt-3 w-full group">
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.10] transition-colors">
              <div>
                <p className="text-[10px] text-slate-600 uppercase tracking-wider">Pagas antes de mim</p>
                {editingPrior ? (
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      autoFocus
                      type="number"
                      min="0"
                      value={tempPrior}
                      onChange={e => setTempPrior(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { const v = parseInt(tempPrior); if (!isNaN(v) && v >= 0) setPriorInstallments(v); setEditingPrior(false) } if (e.key === 'Escape') setEditingPrior(false) }}
                      className="finai-input w-16 px-2 py-0.5 text-sm text-white"
                    />
                    <button onClick={() => { const v = parseInt(tempPrior); if (!isNaN(v) && v >= 0) setPriorInstallments(v); setEditingPrior(false) }} className="w-5 h-5 rounded bg-emerald-500/20 flex items-center justify-center text-emerald-400"><Check className="w-3 h-3" /></button>
                    <button onClick={() => setEditingPrior(false)} className="w-5 h-5 rounded bg-rose-500/20 flex items-center justify-center text-rose-400"><X className="w-3 h-3" /></button>
                  </div>
                ) : (
                  <p className="text-sm font-semibold text-slate-400 mt-0.5">{priorInstallments} parcela{priorInstallments !== 1 ? 's' : ''}</p>
                )}
              </div>
              {!editingPrior && (
                <button onClick={() => { setTempPrior(String(priorInstallments)); setEditingPrior(true) }} className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-lg hover:bg-white/10 flex items-center justify-center text-slate-500 hover:text-slate-300 transition-all" title="Editar parcelas anteriores">
                  <Pencil className="w-3 h-3" />
                </button>
              )}
            </div>
            <p className="text-[10px] text-slate-600 mt-1.5 px-1">Total geral: {paidInstallments}/{totalInstallments} parcelas ({pct}%)</p>
          </div>
        </div>

        {/* Balance chart */}
        <div className="lg:col-span-2 rounded-2xl bg-[#16161E] border border-white/[0.06] p-5 shadow-card">
          <h3 className="text-sm font-semibold text-white mb-1">Evolução do Saldo Devedor</h3>
          <p className="text-xs text-slate-500 mb-4">Projeção das próximas parcelas</p>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData} margin={{ top: 5, right: 0, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="cRestante" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={SICREDI_COLOR} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={SICREDI_COLOR} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="cPago" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `P.${v}`} />
              <YAxis tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null
                return <div className="bg-[#16161E] border border-white/10 rounded-xl p-3 shadow-xl text-xs"><p className="text-slate-400 mb-2">Parcela {label}</p>{payload.map((p: any) => <div key={p.name} className="flex items-center gap-2"><div className="w-2 h-2 rounded-full" style={{ background: p.color }} /><span className="text-slate-400">{p.name === 'pago' ? 'Pago' : 'Restante'}:</span><span className="text-white font-medium">{formatCurrency(p.value)}</span></div>)}</div>
              }} />
              <Area type="monotone" dataKey="pago" stroke="#10b981" strokeWidth={2} fill="url(#cPago)" dot={false} />
              <Area type="monotone" dataKey="restante" stroke={SICREDI_COLOR} strokeWidth={2} fill="url(#cRestante)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Simulator */}
      <div className="rounded-2xl bg-[#16161E] border border-white/[0.06] p-6 shadow-card">
        <div className="flex items-center gap-2 mb-5">
          <Calculator className="w-5 h-5 text-primary-400" />
          <h3 className="text-base font-semibold text-white">Simulador de Antecipação</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="text-sm text-slate-400 mb-2 block">Valor a antecipar (R$)</label>
            <input type="number" value={extraPayment || ''} onChange={e => setExtraPayment(Number(e.target.value))} placeholder="Ex: 5000" className="finai-input w-full px-4 py-3 text-white text-lg font-bold" />
            <div className="flex gap-2 mt-2">
              {[1000,3000,5000,10000].map(v => (
                <button key={v} onClick={() => setExtraPayment(v)} className={cn('flex-1 py-1.5 rounded-lg text-xs font-medium transition-all', extraPayment === v ? 'text-white' : 'bg-white/[0.04] text-slate-400 hover:text-slate-200')} style={extraPayment === v ? { background: SICREDI_COLOR } : {}}>
                  {v >= 1000 ? `${v/1000}k` : v}
                </button>
              ))}
            </div>
          </div>
          {extraPayment > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-emerald-500/8 border border-emerald-500/20">
                <p className="text-xs text-slate-500 mb-1">Parcelas economizadas</p>
                <p className="text-2xl font-bold text-emerald-400">{savedMonths}</p>
                <p className="text-xs text-slate-500 mt-1">{percentReduction}% do restante</p>
              </div>
              <div className="p-4 rounded-xl border" style={{ background: `${SICREDI_COLOR}12`, borderColor: `${SICREDI_COLOR}30` }}>
                <p className="text-xs text-slate-500 mb-1">Novo término</p>
                <p className="text-sm font-bold leading-tight" style={{ color: SICREDI_COLOR }}>{newEndDate.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}</p>
                <p className="text-xs text-slate-500 mt-1">Era {endDate.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}</p>
              </div>
              <div className="col-span-2 p-4 rounded-xl bg-primary-500/8 border border-primary-500/20">
                <p className="text-xs text-slate-500 mb-1">Economia total (juros evitados)</p>
                <p className="text-xl font-bold text-primary-400 tabular-nums">{formatCurrency(totalSavings)}</p>
                <p className="text-xs text-slate-500 mt-1">Retorno: {((totalSavings / extraPayment - 1) * 100).toFixed(1)}% sobre o valor antecipado</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <p className="text-sm text-slate-600">Digite um valor para simular</p>
            </div>
          )}
        </div>
      </div>

      {/* Amortization table */}
      <div className="rounded-2xl bg-[#16161E] border border-white/[0.06] shadow-card overflow-hidden">
        <button onClick={() => setShowTable(v => !v)} className="w-full flex items-center justify-between p-5 hover:bg-white/[0.02] transition-colors">
          <h3 className="text-sm font-semibold text-white">Próximas 12 Parcelas</h3>
          {showTable ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
        </button>
        {showTable && (
          <div className="border-t border-white/[0.06] overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {['Parcela','Data','Valor','Total Pago','Saldo Restante'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {amortRows.map((row, i) => (
                  <tr key={row.parcela} className={cn('border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors', i === 0 && 'bg-[#006b3f]/5')}>
                    <td className="px-5 py-3 text-sm text-white font-medium">{row.parcela}/{totalInstallments}{i === 0 && <span className="ml-2 text-[10px] font-medium" style={{ color: SICREDI_COLOR }}>→ próxima</span>}</td>
                    <td className="px-5 py-3 text-sm text-slate-400">{row.data}</td>
                    <td className="px-5 py-3 text-sm text-white tabular-nums">{formatCurrency(row.valor)}</td>
                    <td className="px-5 py-3 text-sm text-emerald-400 tabular-nums">{formatCurrency(row.acumulado)}</td>
                    <td className="px-5 py-3 text-sm text-slate-400 tabular-nums">{formatCurrency(row.restante)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
