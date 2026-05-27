'use client'

import { useState } from 'react'
import { useUserStorage } from '@/hooks/useUserStorage'
import { useAuth } from '@/contexts/AuthContext'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import {
  RefreshCw, Plus, Eye, EyeOff, CreditCard, Pencil, Trash2,
  Check, X, ArrowUpRight, ArrowDownRight, Search,
} from 'lucide-react'
import { cn, formatCurrency, formatDate, daysUntil } from '@/lib/utils'
import { ACCOUNTS, TRANSACTIONS } from '@/lib/mock-data'
import { GABRIEL_INITIAL_ACCOUNTS, GABRIEL_INITIAL_TRANSACTIONS } from '@/lib/users'
import type { Transaction } from '@/lib/types'

const CATS = ['Alimentação','Transporte','Mercado','Saúde','Lazer','Moradia','Compras','Assinaturas','Salário','Transferência','Outros','Utilidades','Rendimentos']

export default function ContasPage() {
  const { user } = useAuth()
  const initialAccounts = user?.id === 'gabriel' ? GABRIEL_INITIAL_ACCOUNTS : ACCOUNTS.map(a => ({ ...a }))
  const initialTransactions = user?.id === 'gabriel' ? GABRIEL_INITIAL_TRANSACTIONS : TRANSACTIONS.map(t => ({ ...t }))

  const [hideValues, setHideValues] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState(initialAccounts[0]?.id ?? '')
  const [transactions, setTransactions] = useUserStorage<Transaction[]>('finai_transactions', initialTransactions)
  const [accounts, setAccounts] = useUserStorage('finai_accounts', initialAccounts)
  const [showAdd, setShowAdd] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [editBalances, setEditBalances] = useState<Record<string, string>>({})
  const [editingBalance, setEditingBalance] = useState<string | null>(null)

  const [form, setForm] = useState({ description: '', amount: '', type: 'debit' as 'debit'|'credit', category: 'Alimentação', date: new Date().toISOString().slice(0,10), notes: '' })
  const [editForm, setEditForm] = useState<Omit<Partial<Transaction>, 'amount'> & { amount: string }>({ amount: '' })

  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0)
  const selected = accounts.find(a => a.id === selectedAccount) || accounts[0]
  const pieData = accounts.map(a => ({ name: a.name, value: a.balance, color: a.color }))

  const accountTx = transactions
    .filter(t => selected && t.accountId === selected.id && (
      !search || t.description.toLowerCase().includes(search.toLowerCase()) || t.category.toLowerCase().includes(search.toLowerCase())
    ))

  const mask = (v: number) => hideValues ? '•••••' : formatCurrency(v)

  const addTransaction = () => {
    if (!form.description || !form.amount || !selected) return
    const amt = parseFloat(form.amount)
    const newTx: Transaction = {
      id: `t${Date.now()}`,
      accountId: selected.id,
      description: form.description,
      amount: form.type === 'debit' ? -Math.abs(amt) : Math.abs(amt),
      type: form.type,
      category: form.category,
      categoryIcon: '📝',
      categoryColor: '#6366f1',
      date: form.date,
    }
    setTransactions(prev => [newTx, ...prev])
    setAccounts(prev => prev.map(a => a.id === selected.id ? { ...a, balance: a.balance + newTx.amount } : a))
    setForm({ description: '', amount: '', type: 'debit', category: 'Alimentação', date: new Date().toISOString().slice(0,10), notes: '' })
    setShowAdd(false)
  }

  const startEdit = (tx: Transaction) => {
    setEditId(tx.id)
    setEditForm({ ...tx, amount: String(Math.abs(tx.amount)) })
  }

  const saveEdit = () => {
    if (!editId) return
    setTransactions(prev => prev.map(t => {
      if (t.id !== editId) return t
      const newAmt = parseFloat(editForm.amount || '0')
      const signed = editForm.type === 'debit' ? -Math.abs(newAmt) : Math.abs(newAmt)
      const diff = signed - t.amount
      setAccounts(acc => acc.map(a => a.id === t.accountId ? { ...a, balance: a.balance + diff } : a))
      return { ...t, ...editForm, amount: signed }
    }))
    setEditId(null)
  }

  const deleteTransaction = (id: string) => {
    const tx = transactions.find(t => t.id === id)
    if (tx) {
      setAccounts(prev => prev.map(a => a.id === tx.accountId ? { ...a, balance: a.balance - tx.amount } : a))
    }
    setTransactions(prev => prev.filter(t => t.id !== id))
    setDeleteId(null)
  }

  const saveBalance = (accountId: string) => {
    const v = parseFloat(editBalances[accountId] || '0')
    if (!isNaN(v)) setAccounts(prev => prev.map(a => a.id === accountId ? { ...a, balance: v } : a))
    setEditingBalance(null)
  }

  if (!selected) return null

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-[1400px]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Minhas Contas</h1>
          <p className="text-sm text-slate-500 mt-0.5">{accounts.length} instituições conectadas</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => setHideValues(v => !v)} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-slate-400 hover:text-slate-200 transition-all">
            {hideValues ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            {hideValues ? 'Mostrar' : 'Ocultar'}
          </button>
          <button className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-slate-400 hover:text-slate-200 transition-all">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setShowAdd(v => !v)} className="flex items-center gap-2 px-4 py-2 rounded-xl btn-primary text-sm">
            <Plus className="w-3.5 h-3.5" />
            Lançamento
          </button>
        </div>
      </div>

      {/* Account cards + Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 grid grid-cols-2 gap-4">
          {accounts.map(account => {
            const days = account.invoiceDue ? daysUntil(account.invoiceDue) : null
            const isSelected = selectedAccount === account.id
            const isEditingBal = editingBalance === account.id
            return (
              <button key={account.id} onClick={() => !isEditingBal && setSelectedAccount(account.id)}
                className={cn('text-left rounded-2xl p-4 sm:p-5 border transition-all duration-200 shadow-card group',
                  isSelected ? 'border-primary-500/40 shadow-glow-sm' : 'border-white/[0.06] hover:border-white/[0.12]'
                )}
                style={{ background: isSelected ? `linear-gradient(135deg, ${account.color}20 0%, ${account.color}05 100%)` : '#16161E' }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold" style={{ background: `linear-gradient(135deg, ${account.color} 0%, ${account.color}99 100%)` }}>
                    {account.logo}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-xs text-slate-500 capitalize">{account.type === 'checking' ? 'C. Corrente' : 'Poupança'}</span>
                    <button
                      onClick={e => { e.stopPropagation(); setEditingBalance(account.id); setEditBalances(b => ({ ...b, [account.id]: String(account.balance) })) }}
                      className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-[10px] text-primary-400 hover:text-primary-300 transition-all"
                    >
                      <Pencil className="w-2.5 h-2.5" /> editar saldo
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-500 font-medium">{account.name}</p>
                {isEditingBal ? (
                  <div className="mt-1 flex items-center gap-2" onClick={e => e.stopPropagation()}>
                    <span className="text-slate-500 text-sm">R$</span>
                    <input
                      autoFocus
                      type="number"
                      value={editBalances[account.id] || ''}
                      onChange={e => setEditBalances(b => ({ ...b, [account.id]: e.target.value }))}
                      onKeyDown={e => { if (e.key === 'Enter') saveBalance(account.id); if (e.key === 'Escape') setEditingBalance(null) }}
                      className="finai-input flex-1 px-2 py-1 text-lg font-bold text-white w-full"
                    />
                    <button onClick={e => { e.stopPropagation(); saveBalance(account.id) }} className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400"><Check className="w-3 h-3" /></button>
                    <button onClick={e => { e.stopPropagation(); setEditingBalance(null) }} className="w-6 h-6 rounded-lg bg-rose-500/20 flex items-center justify-center text-rose-400"><X className="w-3 h-3" /></button>
                  </div>
                ) : (
                  <p className="text-xl font-bold text-white mt-1 tabular-nums financial-number">{mask(account.balance)}</p>
                )}

                {account.invoiceAmount && (
                  <div className={cn('mt-3 flex items-center justify-between px-3 py-2 rounded-xl', days !== null && days <= 3 ? 'bg-rose-500/10 border border-rose-500/20' : 'bg-white/[0.04]')}>
                    <div className="flex items-center gap-1.5">
                      <CreditCard className="w-3 h-3 text-slate-500" />
                      <span className="text-[10px] text-slate-500">Fatura</span>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold text-white tabular-nums">{mask(account.invoiceAmount)}</p>
                      {days !== null && <p className={cn('text-[10px]', days <= 3 ? 'text-rose-400' : days <= 7 ? 'text-amber-400' : 'text-slate-500')}>{days <= 0 ? 'Vencida' : `${days}d`}</p>}
                    </div>
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Distribution */}
        <div className="rounded-2xl bg-[#16161E] border border-white/[0.06] p-5 shadow-card">
          <h3 className="text-sm font-semibold text-white mb-1">Distribuição</h3>
          <p className="text-xs text-slate-500 mb-1">Total consolidado</p>
          <p className="text-2xl font-bold text-white tabular-nums mb-4">{mask(totalBalance)}</p>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" strokeWidth={2} stroke="#09090F">
                {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                return <div className="bg-[#16161E] border border-primary-500/20 rounded-xl p-3 text-xs"><p className="text-white font-medium">{payload[0].name}</p><p className="text-slate-400">{formatCurrency(payload[0].value as number)}</p></div>
              }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2.5 mt-3">
            {accounts.map(acc => (
              <div key={acc.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: acc.color }} />
                  <span className="text-xs text-slate-400">{acc.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-medium text-white tabular-nums">{mask(acc.balance)}</span>
                  <span className="text-[10px] text-slate-600 ml-2">{totalBalance > 0 ? Math.round((acc.balance / totalBalance) * 100) : 0}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add transaction form */}
      {showAdd && (
        <div className="rounded-2xl bg-[#16161E] border border-primary-500/20 p-5 shadow-glow-sm animate-slide-up">
          <h3 className="text-sm font-semibold text-white mb-4">Novo lançamento em {selected.name}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="text-xs text-slate-500 mb-1.5 block">Tipo</label>
              <div className="flex gap-2">
                {(['debit','credit'] as const).map(t => (
                  <button key={t} onClick={() => setForm(f => ({ ...f, type: t }))}
                    className={cn('flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium transition-all',
                      form.type === t ? (t === 'debit' ? 'bg-rose-500/20 border border-rose-500/30 text-rose-300' : 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-300') : 'bg-white/[0.04] border border-white/[0.06] text-slate-400'
                    )}>
                    {t === 'debit' ? <ArrowDownRight className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                    {t === 'debit' ? 'Despesa' : 'Receita'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1.5 block">Valor (R$)</label>
              <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0,00" className="finai-input w-full px-3 py-2.5 text-sm text-white" />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1.5 block">Data</label>
              <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="finai-input w-full px-3 py-2.5 text-sm text-white" />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-slate-500 mb-1.5 block">Descrição</label>
              <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Ex: iFood - Jantar" className="finai-input w-full px-3 py-2.5 text-sm text-white" onKeyDown={e => e.key === 'Enter' && addTransaction()} />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1.5 block">Categoria</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="finai-input w-full px-3 py-2.5 text-sm text-white">
                {CATS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-xl bg-white/[0.04] text-sm text-slate-400 hover:text-slate-200 transition-all">Cancelar</button>
            <button onClick={addTransaction} disabled={!form.description || !form.amount} className="px-4 py-2 rounded-xl btn-primary text-sm">Registrar</button>
          </div>
        </div>
      )}

      {/* Transaction list */}
      <div className="rounded-2xl bg-[#16161E] border border-white/[0.06] shadow-card overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06]" style={{ background: `linear-gradient(135deg, ${selected.color}12, transparent)` }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ background: `linear-gradient(135deg, ${selected.color}, ${selected.color}99)` }}>{selected.logo}</div>
            <div>
              <h3 className="text-sm font-semibold text-white">{selected.name} — Movimentações</h3>
              <p className="text-xs text-slate-500">{accountTx.length} transações</p>
            </div>
          </div>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..." className="finai-input pl-8 pr-3 py-2 text-xs w-48" />
          </div>
        </div>

        <div className="divide-y divide-white/[0.04]">
          {accountTx.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-12">Nenhuma transação encontrada</p>
          ) : accountTx.map(tx => (
            <div key={tx.id} className={cn('group flex items-center gap-3 px-5 py-3.5 hover:bg-white/[0.02] transition-colors', deleteId === tx.id && 'delete-row', editId === tx.id && 'edit-row')}>
              {editId === tx.id ? (
                /* Inline edit row */
                <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3 items-center">
                  <input value={editForm.description || ''} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} className="finai-input px-3 py-2 text-sm text-white col-span-2 sm:col-span-1" />
                  <div className="flex items-center gap-1">
                    <span className="text-slate-500 text-xs">R$</span>
                    <input type="number" value={editForm.amount} onChange={e => setEditForm(f => ({ ...f, amount: e.target.value }))} className="finai-input px-2 py-2 text-sm text-white w-full" />
                  </div>
                  <select value={editForm.category || ''} onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))} className="finai-input px-2 py-2 text-xs text-white">
                    {CATS.map(c => <option key={c}>{c}</option>)}
                  </select>
                  <input type="date" value={editForm.date || ''} onChange={e => setEditForm(f => ({ ...f, date: e.target.value }))} className="finai-input px-2 py-2 text-xs text-white" />
                </div>
              ) : (
                <>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0" style={{ background: `${tx.categoryColor}15` }}>
                    {tx.categoryIcon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-200 font-medium truncate">{tx.description}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-slate-500">{formatDate(tx.date, 'short')}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: `${tx.categoryColor}15`, color: tx.categoryColor }}>{tx.category}</span>
                    </div>
                  </div>
                  <p className={cn('text-sm font-semibold tabular-nums flex-shrink-0', tx.type === 'credit' ? 'text-emerald-400' : 'text-slate-200')}>
                    {tx.type === 'credit' ? '+' : ''}{hideValues ? '•••' : formatCurrency(Math.abs(tx.amount))}
                  </p>
                </>
              )}

              {/* Row actions */}
              <div className={cn('flex items-center gap-1 row-actions flex-shrink-0', editId === tx.id ? 'opacity-100' : '')}>
                {editId === tx.id ? (
                  <>
                    <button onClick={saveEdit} className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 hover:bg-emerald-500/30"><Check className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setEditId(null)} className="w-7 h-7 rounded-lg bg-rose-500/20 flex items-center justify-center text-rose-400 hover:bg-rose-500/30"><X className="w-3.5 h-3.5" /></button>
                  </>
                ) : deleteId === tx.id ? (
                  <>
                    <span className="text-xs text-rose-400 mr-1">Confirmar?</span>
                    <button onClick={() => deleteTransaction(tx.id)} className="w-7 h-7 rounded-lg bg-rose-500/20 flex items-center justify-center text-rose-400 hover:bg-rose-500/30"><Check className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setDeleteId(null)} className="w-7 h-7 rounded-lg bg-white/[0.06] flex items-center justify-center text-slate-400 hover:bg-white/[0.10]"><X className="w-3.5 h-3.5" /></button>
                  </>
                ) : (
                  <>
                    <button onClick={() => startEdit(tx)} className="w-7 h-7 rounded-lg hover:bg-primary-500/15 flex items-center justify-center text-slate-500 hover:text-primary-400 transition-all"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setDeleteId(tx.id)} className="w-7 h-7 rounded-lg hover:bg-rose-500/15 flex items-center justify-center text-slate-500 hover:text-rose-400 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
