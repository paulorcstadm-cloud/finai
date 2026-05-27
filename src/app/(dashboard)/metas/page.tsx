'use client'

import { useState } from 'react'
import { useUserStorage } from '@/hooks/useUserStorage'
import { useAuth } from '@/contexts/AuthContext'
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts'
import { Target, Plus, Calendar, TrendingUp, Pencil, Trash2, Check, X, PlusCircle } from 'lucide-react'
import { cn, formatCurrency, formatDate, percentage } from '@/lib/utils'
import { GOALS } from '@/lib/mock-data'
import { GABRIEL_INITIAL_GOALS } from '@/lib/users'
import type { Goal } from '@/lib/types'

function buildProjection(goal: Goal) {
  const months = []
  let current = goal.currentAmount
  const today = new Date()
  for (let i = 0; i <= 30; i++) {
    const date = new Date(today)
    date.setMonth(date.getMonth() + i)
    months.push({
      month: date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
      valor: parseFloat(Math.min(current + (goal.monthlyContribution || 0) * i, goal.targetAmount).toFixed(2)),
      meta: goal.targetAmount,
    })
    if (current + (goal.monthlyContribution || 0) * i >= goal.targetAmount) break
  }
  return months
}

const ICONS = ['🎯','✈️','🏠','💻','🚗','💍','🎓','🛡️','📈','🏋️','🎸','🐾']
const COLORS = ['#8b5cf6','#10b981','#3b82f6','#f59e0b','#ec7000','#f43f5e','#6366f1','#06b6d4','#e11d48','#a3e635']

function monthsToGoal(goal: Goal): number {
  if (!goal.monthlyContribution || goal.monthlyContribution <= 0) return Infinity
  return Math.ceil((goal.targetAmount - goal.currentAmount) / goal.monthlyContribution)
}

export default function MetasPage() {
  const { user } = useAuth()
  const initialGoals = user?.id === 'gabriel' ? GABRIEL_INITIAL_GOALS : GOALS

  const [goals, setGoals] = useUserStorage<Goal[]>('finai_goals', initialGoals)
  const [selectedGoal, setSelectedGoal] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [aportarId, setAportarId] = useState<string | null>(null)
  const [aportarVal, setAportarVal] = useState('')

  const [form, setForm] = useState({ name: '', icon: '🎯', targetAmount: '', currentAmount: '', monthlyContribution: '', deadline: '', color: '#8b5cf6' })
  const [editForm, setEditForm] = useState<Omit<Partial<Goal>, 'targetAmount'|'currentAmount'|'monthlyContribution'> & { targetAmount: string; currentAmount: string; monthlyContribution: string }>({ targetAmount: '', currentAmount: '', monthlyContribution: '' })

  const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0)
  const totalCurrent = goals.reduce((s, g) => s + g.currentAmount, 0)
  const overallPct = percentage(totalCurrent, totalTarget)

  // Guard: empty state
  if (goals.length === 0) {
    return (
      <div className="p-4 sm:p-6 space-y-6 max-w-[1200px]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white">Metas Financeiras</h1>
            <p className="text-sm text-slate-500 mt-0.5">Nenhuma meta cadastrada</p>
          </div>
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl btn-primary text-sm">
            <Plus className="w-3.5 h-3.5" />Nova meta
          </button>
        </div>

        {showAdd && (
          <div className="rounded-2xl bg-[#16161E] border border-primary-500/20 p-5 shadow-glow-sm animate-slide-up">
            <h3 className="text-sm font-semibold text-white mb-4">Nova meta financeira</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div><label className="text-xs text-slate-500 mb-1.5 block">Nome da meta *</label><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Viagem Europa" className="finai-input w-full px-3 py-2.5 text-sm text-white" /></div>
              <div><label className="text-xs text-slate-500 mb-1.5 block">Valor alvo (R$) *</label><input type="number" value={form.targetAmount} onChange={e => setForm(f => ({ ...f, targetAmount: e.target.value }))} placeholder="25000" className="finai-input w-full px-3 py-2.5 text-sm text-white" /></div>
              <div><label className="text-xs text-slate-500 mb-1.5 block">Valor atual (R$)</label><input type="number" value={form.currentAmount} onChange={e => setForm(f => ({ ...f, currentAmount: e.target.value }))} placeholder="0" className="finai-input w-full px-3 py-2.5 text-sm text-white" /></div>
              <div><label className="text-xs text-slate-500 mb-1.5 block">Aporte mensal (R$)</label><input type="number" value={form.monthlyContribution} onChange={e => setForm(f => ({ ...f, monthlyContribution: e.target.value }))} placeholder="500" className="finai-input w-full px-3 py-2.5 text-sm text-white" /></div>
              <div><label className="text-xs text-slate-500 mb-1.5 block">Prazo</label><input type="date" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} className="finai-input w-full px-3 py-2.5 text-sm text-white" /></div>
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-xl bg-white/[0.04] text-sm text-slate-400 hover:text-slate-200 transition-all">Cancelar</button>
              <button onClick={() => {
                if (!form.name || !form.targetAmount) return
                const g: Goal = { id: `g${Date.now()}`, name: form.name, icon: form.icon, targetAmount: parseFloat(form.targetAmount), currentAmount: form.currentAmount ? parseFloat(form.currentAmount) : 0, deadline: form.deadline || '2028-12-31', color: form.color, monthlyContribution: form.monthlyContribution ? parseFloat(form.monthlyContribution) : undefined, status: 'active' }
                setGoals([g])
                setSelectedGoal(g.id)
                setShowAdd(false)
                setForm({ name: '', icon: '🎯', targetAmount: '', currentAmount: '', monthlyContribution: '', deadline: '', color: '#8b5cf6' })
              }} disabled={!form.name || !form.targetAmount} className="px-4 py-2 rounded-xl btn-primary text-sm">Criar meta</button>
            </div>
          </div>
        )}

        {!showAdd && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary-500/10 flex items-center justify-center mb-4">
              <Target className="w-8 h-8 text-primary-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Nenhuma meta ainda</h3>
            <p className="text-sm text-slate-500 max-w-xs mb-6">Crie sua primeira meta financeira e acompanhe seu progresso em tempo real.</p>
            <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl btn-primary text-sm">
              <Plus className="w-4 h-4" />Criar primeira meta
            </button>
          </div>
        )}
      </div>
    )
  }

  const selected = goals.find(g => g.id === selectedGoal) || goals[0]
  const projection = buildProjection(selected)

  const addGoal = () => {
    if (!form.name || !form.targetAmount) return
    const g: Goal = {
      id: `g${Date.now()}`,
      name: form.name,
      icon: form.icon,
      targetAmount: parseFloat(form.targetAmount),
      currentAmount: form.currentAmount ? parseFloat(form.currentAmount) : 0,
      deadline: form.deadline || '2028-12-31',
      color: form.color,
      monthlyContribution: form.monthlyContribution ? parseFloat(form.monthlyContribution) : undefined,
      status: 'active',
    }
    setGoals(prev => [...prev, g])
    setSelectedGoal(g.id)
    setShowAdd(false)
    setForm({ name: '', icon: '🎯', targetAmount: '', currentAmount: '', monthlyContribution: '', deadline: '', color: '#8b5cf6' })
  }

  const startEdit = (g: Goal) => {
    setEditId(g.id)
    setEditForm({ ...g, targetAmount: String(g.targetAmount), currentAmount: String(g.currentAmount), monthlyContribution: String(g.monthlyContribution || '') })
  }

  const saveEdit = () => {
    setGoals(prev => prev.map(g => {
      if (g.id !== editId) return g
      return { ...g, ...editForm, targetAmount: parseFloat(editForm.targetAmount), currentAmount: parseFloat(editForm.currentAmount), monthlyContribution: editForm.monthlyContribution ? parseFloat(editForm.monthlyContribution) : g.monthlyContribution }
    }))
    setEditId(null)
  }

  const deleteGoal = (id: string) => {
    const remaining = goals.filter(g => g.id !== id)
    setGoals(remaining)
    if (selectedGoal === id && remaining.length > 0) setSelectedGoal(remaining[0].id)
    setDeleteId(null)
  }

  const aportar = (id: string) => {
    const v = parseFloat(aportarVal)
    if (isNaN(v) || v <= 0) return
    setGoals(prev => prev.map(g => g.id === id ? { ...g, currentAmount: Math.min(g.currentAmount + v, g.targetAmount) } : g))
    setAportarId(null)
    setAportarVal('')
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-[1200px]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Metas Financeiras</h1>
          <p className="text-sm text-slate-500 mt-0.5">{goals.filter(g => g.status === 'active').length} metas ativas</p>
        </div>
        <button onClick={() => setShowAdd(v => !v)} className="flex items-center gap-2 px-4 py-2 rounded-xl btn-primary text-sm">
          <Plus className="w-3.5 h-3.5" />Nova meta
        </button>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-gradient-to-br from-primary-500/15 to-transparent border border-primary-500/20 p-5">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Progresso Geral</p>
          <div className="flex items-end gap-3">
            <p className="text-4xl font-bold gradient-text">{overallPct}%</p>
            <p className="text-sm text-slate-500 mb-1">das metas</p>
          </div>
          <div className="mt-3 w-full h-2 rounded-full bg-white/5">
            <div className="h-2 rounded-full" style={{ width: `${overallPct}%`, background: 'linear-gradient(90deg,#6366f1,#818cf8)', boxShadow: '0 0 10px rgba(99,102,241,0.4)' }} />
          </div>
          <p className="text-xs text-slate-600 mt-2">{formatCurrency(totalCurrent)} / {formatCurrency(totalTarget)}</p>
        </div>
        <div className="rounded-2xl bg-[#16161E] border border-white/[0.06] p-5">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Total acumulado</p>
          <p className="text-3xl font-bold text-white tabular-nums">{formatCurrency(totalCurrent)}</p>
          <p className="text-xs text-emerald-400 mt-2">Crescimento mensal ativo</p>
        </div>
        <div className="rounded-2xl bg-[#16161E] border border-white/[0.06] p-5">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Aportes mensais</p>
          <p className="text-3xl font-bold text-white tabular-nums">{formatCurrency(goals.reduce((s, g) => s + (g.monthlyContribution || 0), 0))}</p>
          <p className="text-xs text-slate-500 mt-2">{goals.filter(g => g.monthlyContribution).length} metas com aporte</p>
        </div>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="rounded-2xl bg-[#16161E] border border-primary-500/20 p-5 shadow-glow-sm animate-slide-up">
          <h3 className="text-sm font-semibold text-white mb-4">Nova meta financeira</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-slate-500 mb-1.5 block">Nome da meta *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Viagem Europa" className="finai-input w-full px-3 py-2.5 text-sm text-white" />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1.5 block">Valor alvo (R$) *</label>
              <input type="number" value={form.targetAmount} onChange={e => setForm(f => ({ ...f, targetAmount: e.target.value }))} placeholder="25000" className="finai-input w-full px-3 py-2.5 text-sm text-white" />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1.5 block">Valor atual (R$)</label>
              <input type="number" value={form.currentAmount} onChange={e => setForm(f => ({ ...f, currentAmount: e.target.value }))} placeholder="0" className="finai-input w-full px-3 py-2.5 text-sm text-white" />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1.5 block">Aporte mensal (R$)</label>
              <input type="number" value={form.monthlyContribution} onChange={e => setForm(f => ({ ...f, monthlyContribution: e.target.value }))} placeholder="500" className="finai-input w-full px-3 py-2.5 text-sm text-white" />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1.5 block">Prazo</label>
              <input type="date" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} className="finai-input w-full px-3 py-2.5 text-sm text-white" />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1.5 block">Ícone</label>
              <div className="flex flex-wrap gap-1.5">
                {ICONS.map(icon => (
                  <button key={icon} onClick={() => setForm(f => ({ ...f, icon }))} className={cn('w-9 h-9 rounded-lg text-lg transition-all', form.icon === icon ? 'bg-primary-500/25 border border-primary-500/40' : 'bg-white/[0.04] border border-transparent hover:bg-white/[0.08]')}>{icon}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1.5 block">Cor</label>
              <div className="flex flex-wrap gap-2">
                {COLORS.map(color => (
                  <button key={color} onClick={() => setForm(f => ({ ...f, color }))} className={cn('w-7 h-7 rounded-lg transition-all', form.color === color ? 'scale-110 ring-2 ring-white/40' : 'opacity-70 hover:opacity-100')} style={{ background: color }} />
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-xl bg-white/[0.04] text-sm text-slate-400 hover:text-slate-200 transition-all">Cancelar</button>
            <button onClick={addGoal} disabled={!form.name || !form.targetAmount} className="px-4 py-2 rounded-xl btn-primary text-sm">Criar meta</button>
          </div>
        </div>
      )}

      {/* Goals list + Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Goal cards */}
        <div className="space-y-3">
          {goals.map(goal => {
            const pct = percentage(goal.currentAmount, goal.targetAmount)
            const months = monthsToGoal(goal)
            const isSelected = (selectedGoal === goal.id) || (!selectedGoal && goals[0]?.id === goal.id)
            const isEdit = editId === goal.id
            const isDel = deleteId === goal.id

            return (
              <div key={goal.id} className={cn('rounded-2xl p-4 border transition-all duration-200 group', isSelected ? 'border-primary-500/40 shadow-glow-sm' : 'border-white/[0.06] hover:border-white/[0.12]', isDel && 'border-rose-500/30', 'bg-[#16161E]')}>
                {isEdit ? (
                  <div className="space-y-2">
                    <input value={editForm.name || ''} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} className="finai-input w-full px-3 py-2 text-sm text-white" placeholder="Nome" />
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="text-[10px] text-slate-500">Meta</label>
                        <input type="number" value={editForm.targetAmount} onChange={e => setEditForm(f => ({ ...f, targetAmount: e.target.value }))} className="finai-input w-full px-2 py-2 text-sm text-white" />
                      </div>
                      <div className="flex-1">
                        <label className="text-[10px] text-slate-500">Atual</label>
                        <input type="number" value={editForm.currentAmount} onChange={e => setEditForm(f => ({ ...f, currentAmount: e.target.value }))} className="finai-input w-full px-2 py-2 text-sm text-white" />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500">Aporte/mês</label>
                      <input type="number" value={editForm.monthlyContribution} onChange={e => setEditForm(f => ({ ...f, monthlyContribution: e.target.value }))} className="finai-input w-full px-2 py-2 text-sm text-white" />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={saveEdit} className="flex-1 py-2 rounded-xl bg-emerald-500/20 text-emerald-400 text-sm flex items-center justify-center gap-1"><Check className="w-3.5 h-3.5" />Salvar</button>
                      <button onClick={() => setEditId(null)} className="flex-1 py-2 rounded-xl bg-rose-500/20 text-rose-400 text-sm flex items-center justify-center gap-1"><X className="w-3.5 h-3.5" />Cancelar</button>
                    </div>
                  </div>
                ) : isDel ? (
                  <div className="text-center space-y-3 py-2">
                    <p className="text-sm text-slate-300">Excluir &quot;{goal.name}&quot;?</p>
                    <div className="flex gap-2">
                      <button onClick={() => deleteGoal(goal.id)} className="flex-1 py-2 rounded-xl bg-rose-500/20 text-rose-400 text-sm">Excluir</button>
                      <button onClick={() => setDeleteId(null)} className="flex-1 py-2 rounded-xl bg-white/[0.06] text-slate-400 text-sm">Cancelar</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setSelectedGoal(goal.id)} className="w-full text-left">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl" style={{ background: `${goal.color}20` }}>{goal.icon}</div>
                        <div>
                          <p className="text-sm font-medium text-slate-200">{goal.name}</p>
                          {months < Infinity && <p className="text-[10px] text-slate-500">{months} meses</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-bold" style={{ color: goal.color }}>{pct}%</span>
                        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                          <button onClick={e => { e.stopPropagation(); startEdit(goal) }} className="w-6 h-6 rounded-lg hover:bg-primary-500/15 flex items-center justify-center text-slate-500 hover:text-primary-400"><Pencil className="w-3 h-3" /></button>
                          <button onClick={e => { e.stopPropagation(); setDeleteId(goal.id) }} className="w-6 h-6 rounded-lg hover:bg-rose-500/15 flex items-center justify-center text-slate-500 hover:text-rose-400"><Trash2 className="w-3 h-3" /></button>
                        </div>
                      </div>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-white/5 mb-2">
                      <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, background: goal.color, boxShadow: `0 0 8px ${goal.color}50` }} />
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400 tabular-nums">{formatCurrency(goal.currentAmount)}</span>
                      <span className="text-slate-600 tabular-nums">{formatCurrency(goal.targetAmount)}</span>
                    </div>
                    {goal.deadline && (
                      <div className="flex items-center gap-1 mt-2 text-[10px] text-slate-600">
                        <Calendar className="w-3 h-3" />{formatDate(goal.deadline, 'medium')}
                      </div>
                    )}
                    {/* Aportar button */}
                    {aportarId === goal.id ? (
                      <div className="mt-2 flex gap-2" onClick={e => e.stopPropagation()}>
                        <div className="flex-1 flex items-center gap-1">
                          <span className="text-slate-500 text-xs">R$</span>
                          <input autoFocus type="number" value={aportarVal} onChange={e => setAportarVal(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') aportar(goal.id); if (e.key === 'Escape') setAportarId(null) }} placeholder="0,00" className="finai-input flex-1 px-2 py-1.5 text-xs text-white" />
                        </div>
                        <button onClick={() => aportar(goal.id)} className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs hover:bg-emerald-500/30"><Check className="w-3.5 h-3.5" /></button>
                        <button onClick={() => setAportarId(null)} className="px-3 py-1.5 rounded-lg bg-white/[0.06] text-slate-400 text-xs"><X className="w-3.5 h-3.5" /></button>
                      </div>
                    ) : (
                      <button
                        onClick={e => { e.stopPropagation(); setAportarId(goal.id); setAportarVal('') }}
                        className="mt-2 w-full py-1.5 rounded-xl bg-white/[0.04] text-xs text-slate-500 hover:text-slate-300 hover:bg-white/[0.08] transition-all flex items-center justify-center gap-1"
                      >
                        <PlusCircle className="w-3 h-3" />Aportar
                      </button>
                    )}
                  </button>
                )}
              </div>
            )
          })}
        </div>

        {/* Detail + projection */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl border p-6" style={{ background: `linear-gradient(135deg, ${selected.color}12, rgba(22,22,30,0.9))`, borderColor: `${selected.color}25` }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl" style={{ background: `${selected.color}25` }}>{selected.icon}</div>
                <div>
                  <h3 className="text-lg font-bold text-white">{selected.name}</h3>
                  <p className="text-sm text-slate-400">{selected.deadline ? formatDate(selected.deadline, 'long') : 'Sem prazo'}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold" style={{ color: selected.color }}>{percentage(selected.currentAmount, selected.targetAmount)}%</p>
                <p className="text-xs text-slate-500">concluído</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[['Acumulado', selected.currentAmount],['Meta', selected.targetAmount],['Faltam', selected.targetAmount - selected.currentAmount]].map(([l, v]) => (
                <div key={String(l)} className="p-3 rounded-xl bg-black/20">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">{l}</p>
                  <p className="text-lg font-bold text-white tabular-nums">{formatCurrency(v as number)}</p>
                </div>
              ))}
            </div>
            {selected.monthlyContribution && (
              <div className="mt-4 p-3 rounded-xl bg-black/20 flex items-center justify-between">
                <div className="flex items-center gap-2"><TrendingUp className="w-4 h-4" style={{ color: selected.color }} /><span className="text-sm text-slate-400">Aporte mensal</span></div>
                <span className="text-sm font-bold text-white tabular-nums">{formatCurrency(selected.monthlyContribution)}</span>
              </div>
            )}
          </div>

          <div className="rounded-2xl bg-[#16161E] border border-white/[0.06] p-5 shadow-card">
            <h4 className="text-sm font-semibold text-white mb-1">Projeção de acúmulo</h4>
            <p className="text-xs text-slate-500 mb-4">Com aportes de {formatCurrency(selected.monthlyContribution || 0)}/mês</p>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={projection} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="month" tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                <Tooltip content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null
                  return <div className="bg-[#16161E] border border-white/10 rounded-xl p-3 text-xs"><p className="text-slate-400 mb-1">{label}</p><p className="text-white font-medium">{formatCurrency(payload[0].value as number)}</p></div>
                }} />
                <Line type="monotone" dataKey="meta" stroke="rgba(255,255,255,0.1)" strokeWidth={1} dot={false} strokeDasharray="4 4" />
                <Line type="monotone" dataKey="valor" stroke={selected.color} strokeWidth={2.5} dot={false} style={{ filter: `drop-shadow(0 0 4px ${selected.color}80)` }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
