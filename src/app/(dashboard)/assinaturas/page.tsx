'use client'

import { useState } from 'react'
import { useUserStorage } from '@/hooks/useUserStorage'
import { useAuth } from '@/contexts/AuthContext'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { Repeat, Plus, Power, PowerOff, AlertCircle, Calendar, Pencil, Trash2, Check, X } from 'lucide-react'
import { cn, formatCurrency, formatDate, daysUntil } from '@/lib/utils'
import { SUBSCRIPTIONS, INSTALLMENTS, ACCOUNTS } from '@/lib/mock-data'
import { GABRIEL_INITIAL_SUBS } from '@/lib/users'
import type { Subscription, Installment } from '@/lib/types'

const CAT_COLORS: Record<string, string> = { Entretenimento: '#e11d48', Música: '#1DB954', Produtividade: '#10a37f', Saúde: '#f59e0b', Internet: '#3b82f6', Armazenamento: '#6366f1', Design: '#ff0000' }
const CYCLES = ['monthly', 'yearly', 'weekly'] as const
const CATS = ['Entretenimento', 'Música', 'Produtividade', 'Saúde', 'Internet', 'Armazenamento', 'Design', 'Outros']

export default function AssinaturasPage() {
  const { user } = useAuth()
  const initialSubs = user?.id === 'gabriel' ? GABRIEL_INITIAL_SUBS : SUBSCRIPTIONS
  const initialInstallments = user?.id === 'gabriel' ? [] : INSTALLMENTS

  const [subs, setSubs] = useUserStorage<Subscription[]>('finai_subs', initialSubs)
  const [installments, setInstallments] = useUserStorage<Installment[]>('finai_installments', initialInstallments)
  const [tab, setTab] = useState<'assinaturas' | 'parcelamentos'>('assinaturas')
  const [showAdd, setShowAdd] = useState(false)
  const [showAddParc, setShowAddParc] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const [form, setForm] = useState({ name: '', amount: '', billingCycle: 'monthly' as typeof CYCLES[number], nextBilling: new Date().toISOString().slice(0,10), category: 'Entretenimento', icon: '📱', color: '#6366f1' })
  const [editForm, setEditForm] = useState<Omit<Partial<Subscription>, 'amount'> & { amount: string }>({ amount: '' })
  const [parcForm, setParcForm] = useState({ description: '', totalAmount: '', installmentValue: '', totalInstallments: '', startDate: new Date().toISOString().slice(0,10), accountId: ACCOUNTS[0]?.id ?? '', nextDue: new Date().toISOString().slice(0,10) })

  const active = subs.filter(s => s.isActive)
  const inactive = subs.filter(s => !s.isActive)
  const monthlyTotal = active.reduce((s, sub) => {
    if (sub.billingCycle === 'monthly') return s + sub.amount
    if (sub.billingCycle === 'yearly') return s + sub.amount / 12
    return s + sub.amount * 4.33
  }, 0)

  const pieData = Object.entries(
    active.reduce((acc, s) => {
      const m = s.billingCycle === 'monthly' ? s.amount : s.billingCycle === 'yearly' ? s.amount / 12 : s.amount * 4.33
      acc[s.category] = (acc[s.category] || 0) + m
      return acc
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value, color: CAT_COLORS[name] || '#8b5cf6' }))

  const totalInstallmentMonthly = installments.reduce((s, i) => s + i.installmentValue, 0)

  const toggleActive = (id: string) => setSubs(prev => prev.map(s => s.id === id ? { ...s, isActive: !s.isActive } : s))

  const addSub = () => {
    if (!form.name || !form.amount) return
    const newSub: Subscription = { id: `s${Date.now()}`, name: form.name, amount: parseFloat(form.amount), billingCycle: form.billingCycle, nextBilling: form.nextBilling, category: form.category, icon: form.icon, color: form.color, isActive: true }
    setSubs(prev => [...prev, newSub])
    setForm({ name: '', amount: '', billingCycle: 'monthly', nextBilling: new Date().toISOString().slice(0,10), category: 'Entretenimento', icon: '📱', color: '#6366f1' })
    setShowAdd(false)
  }

  const startEdit = (s: Subscription) => { setEditId(s.id); setEditForm({ ...s, amount: String(s.amount) }) }

  const saveEdit = () => {
    setSubs(prev => prev.map(s => s.id !== editId ? s : { ...s, ...editForm, amount: parseFloat(editForm.amount || '0') }))
    setEditId(null)
  }

  const deleteSub = (id: string) => { setSubs(prev => prev.filter(s => s.id !== id)); setDeleteId(null) }

  const addParc = () => {
    if (!parcForm.description || !parcForm.totalAmount || !parcForm.installmentValue || !parcForm.totalInstallments) return
    const newP: Installment = {
      id: `i${Date.now()}`, description: parcForm.description,
      totalAmount: parseFloat(parcForm.totalAmount), installmentValue: parseFloat(parcForm.installmentValue),
      totalInstallments: parseInt(parcForm.totalInstallments), paidInstallments: 0,
      startDate: parcForm.startDate, accountId: parcForm.accountId, nextDue: parcForm.nextDue,
    }
    setInstallments(prev => [...prev, newP])
    setParcForm({ description: '', totalAmount: '', installmentValue: '', totalInstallments: '', startDate: new Date().toISOString().slice(0,10), accountId: ACCOUNTS[0]?.id ?? '', nextDue: new Date().toISOString().slice(0,10) })
    setShowAddParc(false)
  }

  const deleteParc = (id: string) => setInstallments(prev => prev.filter(i => i.id !== id))

  const ICONS = ['📺','🎵','🤖','🏋️','📦','🎨','📡','☁️','📱','🎬','🛡️','📸']

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-[1200px]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Assinaturas & Parcelamentos</h1>
          <p className="text-sm text-slate-500 mt-0.5">Controle de gastos recorrentes</p>
        </div>
        <button onClick={() => tab === 'assinaturas' ? setShowAdd(v => !v) : setShowAddParc(v => !v)} className="flex items-center gap-2 px-4 py-2 rounded-xl btn-primary text-sm">
          <Plus className="w-3.5 h-3.5" />
          {tab === 'assinaturas' ? 'Nova assinatura' : 'Novo parcelamento'}
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-gradient-to-br from-rose-500/12 to-transparent border border-rose-500/20 p-5">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Gasto Mensal</p>
          <p className="text-2xl font-bold text-white tabular-nums">{formatCurrency(monthlyTotal)}</p>
          <p className="text-xs text-rose-400 mt-1">{active.length} ativas</p>
        </div>
        <div className="rounded-2xl bg-[#16161E] border border-white/[0.06] p-5">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Gasto Anual</p>
          <p className="text-2xl font-bold text-white tabular-nums">{formatCurrency(monthlyTotal * 12)}</p>
          <p className="text-xs text-slate-500 mt-1">projeção</p>
        </div>
        <div className="rounded-2xl bg-[#16161E] border border-white/[0.06] p-5">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Parcelamentos</p>
          <p className="text-2xl font-bold text-white tabular-nums">{formatCurrency(totalInstallmentMonthly)}</p>
          <p className="text-xs text-slate-500 mt-1">{installments.length} em andamento</p>
        </div>
        <div className="rounded-2xl bg-amber-500/8 border border-amber-500/20 p-5">
          <div className="flex items-center gap-2 mb-2"><AlertCircle className="w-3.5 h-3.5 text-amber-400" /><p className="text-xs text-slate-500 uppercase tracking-wider">Inativas</p></div>
          <p className="text-2xl font-bold text-amber-400">{inactive.length}</p>
          <p className="text-xs text-slate-500 mt-1">{formatCurrency(inactive.reduce((s, sub) => s + (sub.billingCycle === 'monthly' ? sub.amount : sub.amount / 12), 0))}/mês</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(['assinaturas','parcelamentos'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={cn('px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize', tab === t ? 'bg-primary-500/20 border border-primary-500/30 text-primary-300' : 'bg-white/[0.04] border border-white/[0.06] text-slate-400 hover:text-slate-200')}>
            {t === 'assinaturas' ? `Assinaturas (${subs.length})` : `Parcelamentos (${installments.length})`}
          </button>
        ))}
      </div>

      {tab === 'assinaturas' && (
        <>
          {/* Add subscription form */}
          {showAdd && (
            <div className="rounded-2xl bg-[#16161E] border border-primary-500/20 p-5 shadow-glow-sm animate-slide-up">
              <h3 className="text-sm font-semibold text-white mb-4">Nova assinatura</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div><label className="text-xs text-slate-500 mb-1.5 block">Nome</label><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Disney+" className="finai-input w-full px-3 py-2.5 text-sm text-white" /></div>
                <div><label className="text-xs text-slate-500 mb-1.5 block">Valor (R$)</label><input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0,00" className="finai-input w-full px-3 py-2.5 text-sm text-white" /></div>
                <div><label className="text-xs text-slate-500 mb-1.5 block">Ciclo</label>
                  <select value={form.billingCycle} onChange={e => setForm(f => ({ ...f, billingCycle: e.target.value as any }))} className="finai-input w-full px-3 py-2.5 text-sm text-white">
                    <option value="monthly">Mensal</option><option value="yearly">Anual</option><option value="weekly">Semanal</option>
                  </select>
                </div>
                <div><label className="text-xs text-slate-500 mb-1.5 block">Próx. cobrança</label><input type="date" value={form.nextBilling} onChange={e => setForm(f => ({ ...f, nextBilling: e.target.value }))} className="finai-input w-full px-3 py-2.5 text-sm text-white" /></div>
                <div><label className="text-xs text-slate-500 mb-1.5 block">Categoria</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="finai-input w-full px-3 py-2.5 text-sm text-white">
                    {CATS.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div><label className="text-xs text-slate-500 mb-1.5 block">Ícone</label>
                  <div className="flex flex-wrap gap-1.5">
                    {ICONS.map(icon => <button key={icon} onClick={() => setForm(f => ({ ...f, icon }))} className={cn('w-9 h-9 rounded-lg text-lg transition-all', form.icon === icon ? 'bg-primary-500/25 border border-primary-500/40' : 'bg-white/[0.04] border border-transparent hover:bg-white/[0.08]')}>{icon}</button>)}
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <button onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-xl bg-white/[0.04] text-sm text-slate-400 hover:text-slate-200 transition-all">Cancelar</button>
                <button onClick={addSub} disabled={!form.name || !form.amount} className="px-4 py-2 rounded-xl btn-primary text-sm">Adicionar</button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-3">
              {subs.map(sub => {
                const days = daysUntil(sub.nextBilling)
                const isEdit = editId === sub.id
                const isDel = deleteId === sub.id
                return (
                  <div key={sub.id} className={cn('flex items-center gap-4 p-4 rounded-2xl border transition-all group', sub.isActive ? 'bg-[#16161E] border-white/[0.06] hover:border-white/[0.12]' : 'bg-white/[0.02] border-white/[0.04] opacity-60', isDel && 'border-rose-500/30')}>
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl flex-shrink-0" style={{ background: `${sub.color}15` }}>{sub.icon}</div>
                    {isEdit ? (
                      <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <input value={editForm.name || ''} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} className="finai-input px-2 py-2 text-sm text-white" />
                        <div className="flex items-center gap-1"><span className="text-slate-500 text-xs">R$</span><input type="number" value={editForm.amount} onChange={e => setEditForm(f => ({ ...f, amount: e.target.value }))} className="finai-input px-2 py-2 text-sm text-white w-full" /></div>
                        <select value={editForm.billingCycle || 'monthly'} onChange={e => setEditForm(f => ({ ...f, billingCycle: e.target.value as any }))} className="finai-input px-2 py-2 text-xs text-white"><option value="monthly">Mensal</option><option value="yearly">Anual</option></select>
                        <input type="date" value={editForm.nextBilling || ''} onChange={e => setEditForm(f => ({ ...f, nextBilling: e.target.value }))} className="finai-input px-2 py-2 text-xs text-white" />
                      </div>
                    ) : (
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-slate-200">{sub.name}</p>
                          {!sub.isActive && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400">Inativa</span>}
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-xs text-slate-500">{sub.category}</span>
                          <span className="text-xs text-slate-600">·</span>
                          <span className={cn('text-xs', sub.billingCycle === 'yearly' ? 'text-amber-400' : 'text-slate-500')}>{sub.billingCycle === 'monthly' ? 'Mensal' : sub.billingCycle === 'yearly' ? 'Anual' : 'Semanal'}</span>
                          {sub.isActive && <><span className="text-xs text-slate-600">·</span><span className={cn('flex items-center gap-1 text-xs', days <= 3 ? 'text-rose-400' : days <= 7 ? 'text-amber-400' : 'text-slate-500')}><Calendar className="w-3 h-3" />{days <= 0 ? 'Venceu' : `${days}d`}</span></>}
                        </div>
                      </div>
                    )}
                    <div className="text-right flex-shrink-0">
                      <p className="text-base font-bold text-white tabular-nums">{formatCurrency(sub.amount)}</p>
                      <p className="text-xs text-slate-600">{sub.billingCycle === 'yearly' ? `${formatCurrency(sub.amount/12)}/mês` : sub.billingCycle}</p>
                    </div>
                    {/* Actions */}
                    <div className={cn('flex items-center gap-1 row-actions flex-shrink-0', isEdit ? 'opacity-100' : '')}>
                      {isEdit ? (
                        <><button onClick={saveEdit} className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 hover:bg-emerald-500/30"><Check className="w-3.5 h-3.5" /></button><button onClick={() => setEditId(null)} className="w-7 h-7 rounded-lg bg-rose-500/20 flex items-center justify-center text-rose-400 hover:bg-rose-500/30"><X className="w-3.5 h-3.5" /></button></>
                      ) : isDel ? (
                        <><span className="text-xs text-rose-400 mr-1">Excluir?</span><button onClick={() => deleteSub(sub.id)} className="w-7 h-7 rounded-lg bg-rose-500/20 flex items-center justify-center text-rose-400 hover:bg-rose-500/30"><Check className="w-3.5 h-3.5" /></button><button onClick={() => setDeleteId(null)} className="w-7 h-7 rounded-lg bg-white/[0.06] flex items-center justify-center text-slate-400"><X className="w-3.5 h-3.5" /></button></>
                      ) : (
                        <><button onClick={() => toggleActive(sub.id)} className={cn('w-9 h-9 rounded-xl flex items-center justify-center transition-all', sub.isActive ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20' : 'bg-white/[0.04] text-slate-600 hover:text-slate-400')}>{sub.isActive ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}</button><button onClick={() => startEdit(sub)} className="w-7 h-7 rounded-lg hover:bg-primary-500/15 flex items-center justify-center text-slate-500 hover:text-primary-400 transition-all"><Pencil className="w-3.5 h-3.5" /></button><button onClick={() => setDeleteId(sub.id)} className="w-7 h-7 rounded-lg hover:bg-rose-500/15 flex items-center justify-center text-slate-500 hover:text-rose-400 transition-all"><Trash2 className="w-3.5 h-3.5" /></button></>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Pie + insight */}
            <div className="space-y-4">
              <div className="rounded-2xl bg-[#16161E] border border-white/[0.06] p-5">
                <h3 className="text-sm font-semibold text-white mb-1">Por categoria</h3>
                <p className="text-xs text-slate-500 mb-2">{formatCurrency(monthlyTotal)}/mês</p>
                <ResponsiveContainer width="100%" height={150}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" strokeWidth={0}>
                      {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip content={({ active, payload }) => {
                      if (!active || !payload?.length) return null
                      return <div className="bg-[#16161E] border border-white/10 rounded-xl p-3 text-xs"><p className="text-white font-medium">{payload[0].name}</p><p className="text-slate-400">{formatCurrency(payload[0].value as number)}/mês</p></div>
                    }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-2">
                  {pieData.map(d => (
                    <div key={d.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full" style={{ background: d.color }} /><span className="text-xs text-slate-400">{d.name}</span></div>
                      <span className="text-xs font-medium text-white tabular-nums">{formatCurrency(d.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
              {inactive.length > 0 && (
                <div className="rounded-2xl bg-amber-500/8 border border-amber-500/20 p-4">
                  <div className="flex items-center gap-2 mb-2"><AlertCircle className="w-4 h-4 text-amber-400" /><span className="text-sm font-medium text-amber-400">Assinaturas inativas</span></div>
                  <p className="text-xs text-slate-400 mb-3">{inactive.length} assinatura(s) inativa(s). Cancele para economizar.</p>
                  {inactive.map(s => (
                    <div key={s.id} className="flex items-center justify-between py-1">
                      <span className="text-xs text-slate-400">{s.name}</span>
                      <span className="text-xs font-medium text-amber-400">{formatCurrency(s.amount)}/ano</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {tab === 'parcelamentos' && (
        <>
          {showAddParc && (
            <div className="rounded-2xl bg-[#16161E] border border-primary-500/20 p-5 shadow-glow-sm animate-slide-up">
              <h3 className="text-sm font-semibold text-white mb-4">Novo parcelamento</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="col-span-2 sm:col-span-1"><label className="text-xs text-slate-500 mb-1.5 block">Descrição</label><input value={parcForm.description} onChange={e => setParcForm(f => ({ ...f, description: e.target.value }))} placeholder="Ex: iPhone 16 Pro" className="finai-input w-full px-3 py-2.5 text-sm text-white" /></div>
                <div><label className="text-xs text-slate-500 mb-1.5 block">Valor total (R$)</label><input type="number" value={parcForm.totalAmount} onChange={e => setParcForm(f => ({ ...f, totalAmount: e.target.value }))} placeholder="2999" className="finai-input w-full px-3 py-2.5 text-sm text-white" /></div>
                <div><label className="text-xs text-slate-500 mb-1.5 block">Valor/parcela (R$)</label><input type="number" value={parcForm.installmentValue} onChange={e => setParcForm(f => ({ ...f, installmentValue: e.target.value }))} placeholder="249" className="finai-input w-full px-3 py-2.5 text-sm text-white" /></div>
                <div><label className="text-xs text-slate-500 mb-1.5 block">Nº parcelas</label><input type="number" value={parcForm.totalInstallments} onChange={e => setParcForm(f => ({ ...f, totalInstallments: e.target.value }))} placeholder="12" className="finai-input w-full px-3 py-2.5 text-sm text-white" /></div>
                <div><label className="text-xs text-slate-500 mb-1.5 block">Início</label><input type="date" value={parcForm.startDate} onChange={e => setParcForm(f => ({ ...f, startDate: e.target.value }))} className="finai-input w-full px-3 py-2.5 text-sm text-white" /></div>
                <div><label className="text-xs text-slate-500 mb-1.5 block">Próx. vencimento</label><input type="date" value={parcForm.nextDue} onChange={e => setParcForm(f => ({ ...f, nextDue: e.target.value }))} className="finai-input w-full px-3 py-2.5 text-sm text-white" /></div>
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <button onClick={() => setShowAddParc(false)} className="px-4 py-2 rounded-xl bg-white/[0.04] text-sm text-slate-400 hover:text-slate-200 transition-all">Cancelar</button>
                <button onClick={addParc} className="px-4 py-2 rounded-xl btn-primary text-sm">Adicionar</button>
              </div>
            </div>
          )}
          <div className="rounded-2xl bg-[#16161E] border border-white/[0.06] shadow-card overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {['Descrição','Progresso','Valor/parcela','Total','Próx. vencimento',''].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {installments.length === 0 ? (
                  <tr><td colSpan={6} className="px-5 py-12 text-center text-sm text-slate-500">Nenhum parcelamento em andamento</td></tr>
                ) : installments.map(inst => {
                  const pct = Math.round((inst.paidInstallments / inst.totalInstallments) * 100)
                  const remaining = inst.totalInstallments - inst.paidInstallments
                  return (
                    <tr key={inst.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors group">
                      <td className="px-5 py-4"><p className="text-sm font-medium text-slate-200">{inst.description}</p><p className="text-xs text-slate-500">{inst.paidInstallments}/{inst.totalInstallments}</p></td>
                      <td className="px-5 py-4 w-40"><div className="flex items-center gap-2"><div className="flex-1 h-1.5 rounded-full bg-white/5"><div className="h-1.5 rounded-full bg-primary-500" style={{ width: `${pct}%` }} /></div><span className="text-xs text-primary-400 font-medium w-8">{pct}%</span></div></td>
                      <td className="px-5 py-4 text-sm font-medium text-white tabular-nums">{formatCurrency(inst.installmentValue)}</td>
                      <td className="px-5 py-4"><p className="text-sm text-slate-300 tabular-nums">{formatCurrency(inst.totalAmount)}</p><p className="text-xs text-slate-500">{remaining} restantes = {formatCurrency(remaining * inst.installmentValue)}</p></td>
                      <td className="px-5 py-4 text-sm text-slate-400">{formatDate(inst.nextDue, 'medium')}</td>
                      <td className="px-5 py-4">
                        <button onClick={() => deleteParc(inst.id)} className="row-actions w-7 h-7 rounded-lg hover:bg-rose-500/15 flex items-center justify-center text-slate-500 hover:text-rose-400 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              {installments.length > 0 && (
                <tfoot>
                  <tr className="border-t border-white/[0.06]">
                    <td className="px-5 py-3 text-sm font-semibold text-white">Total mensal</td>
                    <td />
                    <td className="px-5 py-3 text-sm font-bold text-white tabular-nums">{formatCurrency(totalInstallmentMonthly)}</td>
                    <td colSpan={3} />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </>
      )}
    </div>
  )
}
