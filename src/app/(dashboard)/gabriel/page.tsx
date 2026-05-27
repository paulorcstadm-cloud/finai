'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { useAuth } from '@/contexts/AuthContext'
import { Users, Plus, CheckCircle, Clock, Check, ArrowUpRight, ArrowDownLeft, Pencil, Trash2, X, MessageCircle, Send } from 'lucide-react'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import { GABRIEL_EXPENSES } from '@/lib/mock-data'
import { GABRIEL_WHATSAPP } from '@/lib/users'
import type { SplitExpense } from '@/lib/types'

const CATEGORIES = ['Alimentação', 'Transporte', 'Lazer', 'Mercado', 'Saúde', 'Outros']
const CAT_ICONS: Record<string, string> = { Alimentação: '🍽️', Transporte: '🚗', Lazer: '🎉', Mercado: '🛒', Saúde: '💊', Outros: '📝' }

export default function GabrielPage() {
  const { user } = useAuth()
  const router = useRouter()

  // Paulo-only guard — Gabriel cannot access this page
  useEffect(() => {
    if (user && user.id !== 'paulo') {
      router.replace('/dashboard')
    }
  }, [user, router])

  const [expenses, setExpenses] = useLocalStorage<SplitExpense[]>('finai_gabriel', GABRIEL_EXPENSES)
  const [showAdd, setShowAdd] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [waStatus, setWaStatus] = useState<'idle' | 'sending' | 'sent'>('idle')
  const [filter, setFilter] = useState<'all' | 'pending' | 'settled'>('all')
  const [splitRatio, setSplitRatio] = useState(50) // my %

  const [form, setForm] = useState({ description: '', totalAmount: '', paidBy: 'me' as 'me'|'friend', category: 'Alimentação', date: new Date().toISOString().slice(0,10) })
  const [editForm, setEditForm] = useState<Omit<Partial<SplitExpense>, 'totalAmount'> & { totalAmount: string }>({ totalAmount: '' })

  const pending = expenses.filter(e => e.status === 'pending')
  const settled = expenses.filter(e => e.status === 'settled')
  const myCredit = pending.filter(e => e.paidBy === 'me').reduce((s, e) => s + e.friendShare, 0)
  const myDebt = pending.filter(e => e.paidBy === 'friend').reduce((s, e) => s + e.myShare, 0)
  const netBalance = myCredit - myDebt

  const displayed = expenses.filter(e => filter === 'all' ? true : e.status === filter)

  const addExpense = () => {
    if (!form.description || !form.totalAmount) return
    const total = parseFloat(form.totalAmount)
    const myPct = splitRatio / 100
    const newExp: SplitExpense = {
      id: `ge${Date.now()}`,
      description: form.description,
      totalAmount: total,
      myShare: parseFloat((total * myPct).toFixed(2)),
      friendShare: parseFloat((total * (1 - myPct)).toFixed(2)),
      paidBy: form.paidBy,
      date: form.date,
      category: form.category,
      status: 'pending',
    }
    setExpenses(prev => [newExp, ...prev])
    setForm({ description: '', totalAmount: '', paidBy: 'me', category: 'Alimentação', date: new Date().toISOString().slice(0,10) })
    setShowAdd(false)
  }

  const startEdit = (e: SplitExpense) => {
    setEditId(e.id)
    setEditForm({ ...e, totalAmount: String(e.totalAmount) })
  }

  const saveEdit = () => {
    setExpenses(prev => prev.map(e => {
      if (e.id !== editId) return e
      const total = parseFloat(editForm.totalAmount || '0')
      return {
        ...e,
        description: editForm.description || e.description,
        totalAmount: total,
        myShare: parseFloat((total * 0.5).toFixed(2)),
        friendShare: parseFloat((total * 0.5).toFixed(2)),
        category: editForm.category || e.category,
        date: editForm.date || e.date,
        paidBy: editForm.paidBy || e.paidBy,
      }
    }))
    setEditId(null)
  }

  const deleteExpense = (id: string) => { setExpenses(prev => prev.filter(e => e.id !== id)); setDeleteId(null) }

  const settleAll = () => setExpenses(prev => prev.map(e => e.status === 'pending' ? { ...e, status: 'settled', settled: new Date().toISOString().slice(0,10) } : e))
  const settleOne = (id: string) => setExpenses(prev => prev.map(e => e.id === id ? { ...e, status: 'settled', settled: new Date().toISOString().slice(0,10) } : e))

  const generateMessage = () => {
    const today = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    const theyOwe = pending.filter(e => e.paidBy === 'me')
    const iOwe = pending.filter(e => e.paidBy === 'friend')
    let msg = `Brow, segue o racha atualizado (${today})\n\n`
    if (theyOwe.length > 0) {
      msg += `*Voce me deve:*\n`
      theyOwe.forEach(e => {
        msg += `  - ${e.description} (${formatDate(e.date, 'short')}): R$ ${e.friendShare.toFixed(2).replace('.', ',')}\n`
      })
      msg += `\n`
    }
    if (iOwe.length > 0) {
      msg += `*Eu te devo:*\n`
      iOwe.forEach(e => {
        msg += `  - ${e.description} (${formatDate(e.date, 'short')}): R$ ${e.myShare.toFixed(2).replace('.', ',')}\n`
      })
      msg += `\n`
    }
    if (netBalance > 0) msg += `*Saldo final:* voce me deve R$ ${netBalance.toFixed(2).replace('.', ',')}\nPix: paulorcst.adm@gmail.com`
    else if (netBalance < 0) msg += `*Saldo final:* eu te devo R$ ${Math.abs(netBalance).toFixed(2).replace('.', ',')}`
    else msg += `*Estamos quites!*`

    // Copy to clipboard
    navigator.clipboard.writeText(msg).catch(() => {})

    // Open WhatsApp with the message
    setWaStatus('sending')
    const waUrl = `https://wa.me/${GABRIEL_WHATSAPP}?text=${encodeURIComponent(msg)}`
    window.open(waUrl, '_blank')
    setTimeout(() => setWaStatus('sent'), 800)
    setTimeout(() => setWaStatus('idle'), 3000)
  }

  // Don't render until user is confirmed as paulo
  if (!user || user.id !== 'paulo') return null

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-[1200px]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Divisão com Gabriel</h1>
          <p className="text-sm text-slate-500 mt-0.5">Gastos compartilhados com Gabriel Henrique</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={generateMessage} className={cn('flex items-center gap-2 px-4 py-2 rounded-xl text-sm border transition-all', waStatus === 'sent' ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' : waStatus === 'sending' ? 'bg-amber-500/15 border-amber-500/30 text-amber-300' : 'bg-white/[0.04] border-white/[0.06] text-slate-400 hover:text-slate-200')}>
            {waStatus === 'sent' ? <Check className="w-3.5 h-3.5" /> : waStatus === 'sending' ? <Send className="w-3.5 h-3.5 animate-pulse" /> : <MessageCircle className="w-3.5 h-3.5" />}
            {waStatus === 'sent' ? 'WhatsApp aberto!' : waStatus === 'sending' ? 'Abrindo...' : 'Gerar cobrança'}
          </button>
          <button onClick={() => setShowAdd(v => !v)} className="flex items-center gap-2 px-4 py-2 rounded-xl btn-primary text-sm">
            <Plus className="w-3.5 h-3.5" />
            Novo gasto
          </button>
        </div>
      </div>

      {/* Balance cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className={cn('rounded-2xl p-5 border', netBalance > 0 ? 'bg-emerald-500/8 border-emerald-500/25' : netBalance < 0 ? 'bg-rose-500/8 border-rose-500/25' : 'bg-white/[0.04] border-white/[0.08]')}>
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-slate-500 uppercase tracking-wider">Saldo Líquido</span>
          </div>
          <p className={cn('text-3xl font-bold tabular-nums financial-number', netBalance > 0 ? 'text-emerald-400' : netBalance < 0 ? 'text-rose-400' : 'text-white')}>
            {formatCurrency(Math.abs(netBalance))}
          </p>
          <p className="text-sm mt-1 text-slate-400">{netBalance > 0 ? '← Gabriel te deve' : netBalance < 0 ? '→ Você deve ao Gabriel' : 'Quitados!'}</p>
          {netBalance !== 0 && pending.length > 0 && (
            <button onClick={settleAll} className="mt-3 w-full py-2 rounded-xl bg-white/[0.06] text-sm text-slate-300 hover:bg-white/[0.10] transition-all">Quitar tudo</button>
          )}
        </div>
        <div className="rounded-2xl bg-[#16161E] border border-white/[0.06] p-5">
          <div className="flex items-center gap-2 mb-3"><ArrowUpRight className="w-4 h-4 text-emerald-400" /><span className="text-xs text-slate-500 uppercase tracking-wider">Gabriel te deve</span></div>
          <p className="text-3xl font-bold text-emerald-400 tabular-nums">{formatCurrency(myCredit)}</p>
          <p className="text-xs text-slate-500 mt-2">{pending.filter(e => e.paidBy === 'me').length} gastos pendentes</p>
        </div>
        <div className="rounded-2xl bg-[#16161E] border border-white/[0.06] p-5">
          <div className="flex items-center gap-2 mb-3"><ArrowDownLeft className="w-4 h-4 text-rose-400" /><span className="text-xs text-slate-500 uppercase tracking-wider">Você deve ao Gabriel</span></div>
          <p className="text-3xl font-bold text-rose-400 tabular-nums">{formatCurrency(myDebt)}</p>
          <p className="text-xs text-slate-500 mt-2">{pending.filter(e => e.paidBy === 'friend').length} gastos pendentes</p>
        </div>
      </div>

      {/* WhatsApp hint */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-500/8 border border-emerald-500/20">
        <MessageCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
        <p className="text-xs text-slate-400">
          Clique em <strong className="text-emerald-400">Gerar cobrança</strong> para copiar a mensagem e abrir o WhatsApp direto na conversa com Gabriel.
        </p>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="rounded-2xl bg-[#16161E] border border-primary-500/20 p-5 shadow-glow-sm animate-slide-up">
          <h3 className="text-sm font-semibold text-white mb-4">Novo gasto compartilhado</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="text-xs text-slate-500 mb-1.5 block">Descrição</label>
              <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Ex: Jantar na pizzaria" className="finai-input w-full px-3 py-2.5 text-sm text-white" />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1.5 block">Valor total (R$)</label>
              <input type="number" value={form.totalAmount} onChange={e => setForm(f => ({ ...f, totalAmount: e.target.value }))} placeholder="0,00" className="finai-input w-full px-3 py-2.5 text-sm text-white" />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1.5 block">Data</label>
              <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="finai-input w-full px-3 py-2.5 text-sm text-white" />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1.5 block">Quem pagou?</label>
              <div className="flex gap-2">
                {(['me','friend'] as const).map(v => (
                  <button key={v} onClick={() => setForm(f => ({ ...f, paidBy: v }))}
                    className={cn('flex-1 py-2.5 rounded-xl text-sm font-medium transition-all', form.paidBy === v ? 'bg-primary-500/20 border border-primary-500/40 text-primary-300' : 'bg-white/[0.04] border border-white/[0.06] text-slate-400')}>
                    {v === 'me' ? 'Eu' : 'Gabriel'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1.5 block">Categoria</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="finai-input w-full px-3 py-2.5 text-sm text-white">
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="text-xs text-slate-500 mb-1.5 block">Divisão — minha parte: {splitRatio}%</label>
              <div className="flex items-center gap-3">
                <input type="range" min={0} max={100} value={splitRatio} onChange={e => setSplitRatio(Number(e.target.value))} className="flex-1 accent-primary-500" />
                <span className="text-xs text-slate-400 w-20 text-right">Gabriel: {100-splitRatio}%</span>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-xl bg-white/[0.04] text-sm text-slate-400 hover:text-slate-200 transition-all">Cancelar</button>
            <button onClick={addExpense} disabled={!form.description || !form.totalAmount} className="px-4 py-2 rounded-xl btn-primary text-sm">Adicionar</button>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {(['all','pending','settled'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={cn('px-4 py-2 rounded-xl text-sm font-medium transition-all', filter === f ? 'bg-primary-500/20 border border-primary-500/30 text-primary-300' : 'bg-white/[0.04] border border-white/[0.06] text-slate-400 hover:text-slate-200')}>
            {f === 'all' ? `Todos (${expenses.length})` : f === 'pending' ? `Pendentes (${pending.length})` : `Quitados (${settled.length})`}
          </button>
        ))}
      </div>

      {/* Expenses table */}
      <div className="rounded-2xl bg-[#16161E] border border-white/[0.06] shadow-card overflow-x-auto">
        <table className="w-full min-w-[700px]">
          <thead>
            <tr className="border-b border-white/[0.06]">
              {['Descrição','Data','Total','Minha parte','Parte Gabriel','Status',''].map(h => (
                <th key={h} className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayed.map(exp => {
              const iOwed = exp.paidBy === 'friend'
              const theyOwe = exp.paidBy === 'me'
              const isEdit = editId === exp.id
              const isDel = deleteId === exp.id
              return (
                <tr key={exp.id} className={cn('border-b border-white/[0.04] transition-colors group', exp.status === 'settled' ? 'opacity-50' : 'hover:bg-white/[0.02]', isDel && 'delete-row', isEdit && 'edit-row')}>
                  <td className="px-5 py-4">
                    {isEdit ? (
                      <input value={editForm.description || ''} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} className="finai-input px-3 py-2 text-sm text-white w-full" />
                    ) : (
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{CAT_ICONS[exp.category] || '📝'}</span>
                        <div>
                          <p className="text-sm font-medium text-slate-200">{exp.description}</p>
                          <p className="text-xs text-slate-500">{exp.category}</p>
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    {isEdit ? <input type="date" value={editForm.date || ''} onChange={e => setEditForm(f => ({ ...f, date: e.target.value }))} className="finai-input px-2 py-2 text-xs text-white" /> : <span className="text-sm text-slate-400">{formatDate(exp.date, 'short')}</span>}
                  </td>
                  <td className="px-5 py-4">
                    {isEdit ? (
                      <div className="flex items-center gap-1"><span className="text-slate-500 text-xs">R$</span><input type="number" value={editForm.totalAmount} onChange={e => setEditForm(f => ({ ...f, totalAmount: e.target.value }))} className="finai-input px-2 py-2 text-sm text-white w-24" /></div>
                    ) : <span className="text-sm font-medium text-white tabular-nums">{formatCurrency(exp.totalAmount)}</span>}
                  </td>
                  <td className="px-5 py-4"><span className={cn('text-sm font-medium tabular-nums', iOwed ? 'text-rose-400' : 'text-slate-300')}>{iOwed ? '-' : ''}{formatCurrency(exp.myShare)}</span></td>
                  <td className="px-5 py-4"><span className={cn('text-sm font-medium tabular-nums', theyOwe ? 'text-emerald-400' : 'text-slate-300')}>{formatCurrency(exp.friendShare)}</span></td>
                  <td className="px-5 py-4">
                    {exp.status === 'pending'
                      ? <span className="flex items-center gap-1.5 text-xs text-amber-400"><Clock className="w-3 h-3" />Pendente</span>
                      : <span className="flex items-center gap-1.5 text-xs text-emerald-400"><CheckCircle className="w-3 h-3" />Quitado</span>}
                  </td>
                  <td className="px-5 py-4">
                    <div className={cn('flex items-center gap-1 row-actions', isEdit ? 'opacity-100' : '')}>
                      {isEdit ? (
                        <>
                          <button onClick={saveEdit} className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 hover:bg-emerald-500/30"><Check className="w-3.5 h-3.5" /></button>
                          <button onClick={() => setEditId(null)} className="w-7 h-7 rounded-lg bg-rose-500/20 flex items-center justify-center text-rose-400 hover:bg-rose-500/30"><X className="w-3.5 h-3.5" /></button>
                        </>
                      ) : isDel ? (
                        <>
                          <span className="text-xs text-rose-400 mr-1">Excluir?</span>
                          <button onClick={() => deleteExpense(exp.id)} className="w-7 h-7 rounded-lg bg-rose-500/20 flex items-center justify-center text-rose-400 hover:bg-rose-500/30"><Check className="w-3.5 h-3.5" /></button>
                          <button onClick={() => setDeleteId(null)} className="w-7 h-7 rounded-lg bg-white/[0.06] flex items-center justify-center text-slate-400"><X className="w-3.5 h-3.5" /></button>
                        </>
                      ) : (
                        <>
                          {exp.status === 'pending' && <button onClick={() => settleOne(exp.id)} className="text-xs text-primary-400 hover:text-primary-300 mr-1">Quitar</button>}
                          <button onClick={() => startEdit(exp)} className="w-7 h-7 rounded-lg hover:bg-primary-500/15 flex items-center justify-center text-slate-500 hover:text-primary-400 transition-all"><Pencil className="w-3.5 h-3.5" /></button>
                          <button onClick={() => setDeleteId(exp.id)} className="w-7 h-7 rounded-lg hover:bg-rose-500/15 flex items-center justify-center text-slate-500 hover:text-rose-400 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
