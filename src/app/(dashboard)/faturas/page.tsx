'use client'

import { useState } from 'react'
import { useUserStorage } from '@/hooks/useUserStorage'
import { useAuth } from '@/contexts/AuthContext'
import { CreditCard, AlertCircle, Plus, Pencil, Trash2, Check, X, Landmark } from 'lucide-react'
import { cn, formatCurrency, formatDate, daysUntil } from '@/lib/utils'
import type { Account, Transaction } from '@/lib/types'

const CATS = ['Alimentação','Transporte','Mercado','Saúde','Lazer','Moradia','Compras','Assinaturas','Utilidades','Outros']

type InvoiceTx = Transaction & { _fake?: boolean }

export default function FaturasPage() {
  const { user } = useAuth()

  // Live accounts from user storage
  const [accounts] = useUserStorage<Account[]>('finai_accounts', [])

  // Accounts with credit card invoices — show all if none have invoiceAmount
  const bankInvoices = accounts.filter(a => a.invoiceAmount)
  const displayAccounts = bankInvoices.length > 0 ? bankInvoices : accounts

  const totalFaturas = bankInvoices.reduce((s, a) => s + (a.invoiceAmount || 0), 0)

  const [activeBank, setActiveBank] = useState<string>('')
  const effectiveBank = activeBank || displayAccounts[0]?.id || ''
  const activeAcc = accounts.find(a => a.id === effectiveBank)

  // Per-user invoice transaction map and paid status
  const [paidBillsArr, setPaidBillsArr] = useUserStorage<string[]>('finai_paid_bills', [])
  const paidBills = new Set(paidBillsArr)
  const [txMap, setTxMap] = useUserStorage<Record<string, InvoiceTx[]>>('finai_fatura_map', {})

  const [showAdd, setShowAdd] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState({ description: '', amount: '', category: 'Alimentação', date: new Date().toISOString().slice(0,10) })
  const [editForm, setEditForm] = useState<Omit<Partial<InvoiceTx>, 'amount'> & { amount: string }>({ amount: '' })

  const activeTxs = txMap[effectiveBank] || []

  const togglePaid = (id: string) => setPaidBillsArr(prev => {
    const s = new Set(prev)
    s.has(id) ? s.delete(id) : s.add(id)
    return Array.from(s)
  })

  const addTx = () => {
    if (!form.description || !form.amount || !activeAcc) return
    const newTx: InvoiceTx = {
      id: `fi${Date.now()}`,
      accountId: effectiveBank,
      description: form.description,
      amount: -Math.abs(parseFloat(form.amount)),
      type: 'debit',
      category: form.category,
      categoryIcon: '📝',
      categoryColor: '#6366f1',
      date: form.date,
      _fake: true,
    }
    setTxMap(prev => ({ ...prev, [effectiveBank]: [newTx, ...(prev[effectiveBank] || [])] }))
    setForm({ description: '', amount: '', category: 'Alimentação', date: new Date().toISOString().slice(0,10) })
    setShowAdd(false)
  }

  const startEdit = (tx: InvoiceTx) => { setEditId(tx.id); setEditForm({ ...tx, amount: String(Math.abs(tx.amount)) }) }

  const saveEdit = () => {
    setTxMap(prev => ({
      ...prev,
      [effectiveBank]: (prev[effectiveBank] || []).map(t => {
        if (t.id !== editId) return t
        return { ...t, description: editForm.description || t.description, amount: -Math.abs(parseFloat(editForm.amount || '0')), category: editForm.category || t.category, date: editForm.date || t.date }
      })
    }))
    setEditId(null)
  }

  const deleteTx = (id: string) => {
    setTxMap(prev => ({ ...prev, [effectiveBank]: (prev[effectiveBank] || []).filter(t => t.id !== id) }))
    setDeleteId(null)
  }

  // Empty state — no accounts at all
  if (accounts.length === 0) {
    return (
      <div className="p-4 sm:p-6 max-w-[1200px]">
        <h1 className="text-2xl font-bold text-white mb-2">Faturas</h1>
        <div className="rounded-2xl bg-[#16161E] border border-white/[0.06] p-10 flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-white/[0.04] flex items-center justify-center">
            <Landmark className="w-6 h-6 text-slate-600" />
          </div>
          <p className="text-sm text-slate-400 font-medium">Nenhuma conta cadastrada</p>
          <p className="text-xs text-slate-600">Adicione suas contas em <span className="text-primary-400">Contas</span> para começar a usar as faturas.</p>
        </div>
      </div>
    )
  }

  // Guard — can happen on first render before localStorage hydrates
  if (!activeAcc) return null

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-[1200px]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Faturas</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Cartões de crédito •{' '}
            {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
          </p>
        </div>
        {totalFaturas > 0 && (
          <div className="px-4 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
            <p className="text-xs text-slate-500">Total em aberto</p>
            <p className="text-lg font-bold text-rose-400 tabular-nums">{formatCurrency(totalFaturas)}</p>
          </div>
        )}
      </div>

      {/* Invoice overview cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {displayAccounts.map(account => {
          const days = account.invoiceDue ? daysUntil(account.invoiceDue) : null
          const isPaid = paidBills.has(account.id)
          const isActive = effectiveBank === account.id
          return (
            <button key={account.id} onClick={() => setActiveBank(account.id)}
              className={cn('text-left rounded-2xl p-4 border transition-all duration-200', isActive ? 'border-primary-500/40 shadow-glow-sm' : 'border-white/[0.06] hover:border-white/[0.12]', 'bg-[#16161E]')}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold" style={{ background: `linear-gradient(135deg, ${account.color}, ${account.color}99)` }}>{account.logo}</div>
                <div>
                  <p className="text-xs font-medium text-slate-200">{account.name}</p>
                  <p className="text-[10px] text-slate-500">{account.invoiceAmount ? 'Cartão' : 'Conta'}</p>
                </div>
              </div>
              {account.invoiceAmount ? (
                <>
                  <p className={cn('text-xl font-bold tabular-nums', isPaid ? 'text-emerald-400 line-through opacity-60' : 'text-white')}>{formatCurrency(account.invoiceAmount)}</p>
                  {days !== null && !isPaid && (
                    <div className={cn('mt-2 flex items-center gap-1.5 text-xs', days <= 3 ? 'text-rose-400' : days <= 7 ? 'text-amber-400' : 'text-slate-500')}>
                      {days <= 3 && <AlertCircle className="w-3 h-3" />}
                      {days <= 0 ? 'Vencida!' : `Vence em ${days}d`}
                    </div>
                  )}
                  {account.invoiceDue && <p className="text-[10px] text-slate-600 mt-0.5">{formatDate(account.invoiceDue, 'medium')}</p>}
                  <button onClick={e => { e.stopPropagation(); togglePaid(account.id) }}
                    className={cn('mt-3 w-full py-1.5 rounded-lg text-xs font-medium transition-all', isPaid ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-white/[0.04] text-slate-400 hover:text-slate-200')}>
                    {isPaid ? '✓ Pago' : 'Marcar como pago'}
                  </button>
                </>
              ) : (
                <p className="text-xl font-bold tabular-nums text-slate-400">
                  {formatCurrency(activeTxs.filter(t => t.accountId === account.id).reduce((s, t) => s + Math.abs(t.amount), 0))}
                </p>
              )}
            </button>
          )
        })}
      </div>

      {/* Add expense form */}
      {showAdd && (
        <div className="rounded-2xl bg-[#16161E] border border-primary-500/20 p-5 shadow-glow-sm animate-slide-up">
          <h3 className="text-sm font-semibold text-white mb-4">Adicionar lançamento em {activeAcc.name}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="col-span-2">
              <label className="text-xs text-slate-500 mb-1.5 block">Descrição</label>
              <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Ex: Uber Eats" className="finai-input w-full px-3 py-2.5 text-sm text-white" />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1.5 block">Valor (R$)</label>
              <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0,00" className="finai-input w-full px-3 py-2.5 text-sm text-white" />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1.5 block">Data</label>
              <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="finai-input w-full px-3 py-2.5 text-sm text-white" />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1.5 block">Categoria</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="finai-input w-full px-3 py-2.5 text-sm text-white">
                {CATS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-xl bg-white/[0.04] text-sm text-slate-400 hover:text-slate-200 transition-all">Cancelar</button>
            <button onClick={addTx} disabled={!form.description || !form.amount} className="px-4 py-2 rounded-xl btn-primary text-sm">Adicionar</button>
          </div>
        </div>
      )}

      {/* Detail */}
      <div className="rounded-2xl bg-[#16161E] border border-white/[0.06] shadow-card overflow-hidden">
        <div className="p-5 border-b border-white/[0.06] flex items-center justify-between" style={{ background: `linear-gradient(135deg, ${activeAcc.color}15, transparent)` }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold" style={{ background: `linear-gradient(135deg, ${activeAcc.color}, ${activeAcc.color}99)` }}>{activeAcc.logo}</div>
            <div>
              <h3 className="text-base font-semibold text-white">{activeAcc.name} — Lançamentos</h3>
              <p className="text-xs text-slate-500">{activeTxs.length} lançamentos · {activeAcc.invoiceDue ? `Vencimento: ${formatDate(activeAcc.invoiceDue, 'long')}` : 'Sem vencimento definido'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs text-slate-500">Total</p>
              <p className="text-2xl font-bold text-white tabular-nums">
                {formatCurrency(activeAcc.invoiceAmount || activeTxs.reduce((s, t) => s + Math.abs(t.amount), 0))}
              </p>
            </div>
            <button onClick={() => setShowAdd(v => !v)} className="flex items-center gap-2 px-4 py-2 rounded-xl btn-primary text-sm">
              <Plus className="w-3.5 h-3.5" />Adicionar
            </button>
          </div>
        </div>

        <div className="divide-y divide-white/[0.04]">
          {activeTxs.length === 0
            ? <p className="text-sm text-slate-500 text-center py-12">Nenhum lançamento. Adicione um acima.</p>
            : activeTxs.map(tx => {
              const isEdit = editId === tx.id
              const isDel = deleteId === tx.id
              return (
                <div key={tx.id} className={cn('group flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.02] transition-colors', isEdit && 'edit-row', isDel && 'delete-row')}>
                  {isEdit ? (
                    <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3 items-center">
                      <input value={editForm.description || ''} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} className="finai-input px-3 py-2 text-sm text-white col-span-2 sm:col-span-1" />
                      <div className="flex items-center gap-1"><span className="text-slate-500 text-xs">R$</span><input type="number" value={editForm.amount} onChange={e => setEditForm(f => ({ ...f, amount: e.target.value }))} className="finai-input px-2 py-2 text-sm text-white w-full" /></div>
                      <select value={editForm.category || ''} onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))} className="finai-input px-2 py-2 text-xs text-white">{CATS.map(c => <option key={c}>{c}</option>)}</select>
                      <input type="date" value={editForm.date || ''} onChange={e => setEditForm(f => ({ ...f, date: e.target.value }))} className="finai-input px-2 py-2 text-xs text-white" />
                    </div>
                  ) : (
                    <>
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0" style={{ background: `${tx.categoryColor}15` }}>{tx.categoryIcon}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-200 truncate">{tx.description}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-slate-500">{formatDate(tx.date, 'short')}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: `${tx.categoryColor}15`, color: tx.categoryColor }}>{tx.category}</span>
                          {tx.isRecurring && <span className="text-[10px] text-slate-600">↺</span>}
                          {tx.installmentInfo && <span className="text-[10px] text-slate-500">{tx.installmentInfo}</span>}
                          {tx.splitWith && <span className="text-[10px] text-emerald-400">÷ {tx.splitWith}</span>}
                        </div>
                      </div>
                      <p className="text-sm font-semibold text-slate-200 tabular-nums flex-shrink-0">{formatCurrency(Math.abs(tx.amount))}</p>
                    </>
                  )}
                  {/* Actions */}
                  <div className={cn('flex items-center gap-1 row-actions flex-shrink-0', isEdit ? 'opacity-100' : '')}>
                    {isEdit ? (
                      <>
                        <button onClick={saveEdit} className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 hover:bg-emerald-500/30"><Check className="w-3.5 h-3.5" /></button>
                        <button onClick={() => setEditId(null)} className="w-7 h-7 rounded-lg bg-rose-500/20 flex items-center justify-center text-rose-400 hover:bg-rose-500/30"><X className="w-3.5 h-3.5" /></button>
                      </>
                    ) : isDel ? (
                      <>
                        <span className="text-xs text-rose-400 mr-1">Excluir?</span>
                        <button onClick={() => deleteTx(tx.id)} className="w-7 h-7 rounded-lg bg-rose-500/20 flex items-center justify-center text-rose-400 hover:bg-rose-500/30"><Check className="w-3.5 h-3.5" /></button>
                        <button onClick={() => setDeleteId(null)} className="w-7 h-7 rounded-lg bg-white/[0.06] flex items-center justify-center text-slate-400"><X className="w-3.5 h-3.5" /></button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => startEdit(tx)} className="w-7 h-7 rounded-lg hover:bg-primary-500/15 flex items-center justify-center text-slate-500 hover:text-primary-400 transition-all"><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={() => setDeleteId(tx.id)} className="w-7 h-7 rounded-lg hover:bg-rose-500/15 flex items-center justify-center text-slate-500 hover:text-rose-400 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
        </div>

        <div className="px-5 py-4 border-t border-white/[0.06] flex items-center justify-between" style={{ background: `linear-gradient(135deg, ${activeAcc.color}08, transparent)` }}>
          <span className="text-sm font-semibold text-white">Total dos lançamentos</span>
          <span className="text-lg font-bold text-white tabular-nums">{formatCurrency(activeTxs.reduce((s, t) => s + Math.abs(t.amount), 0))}</span>
        </div>
      </div>
    </div>
  )
}
