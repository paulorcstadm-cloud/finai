'use client'

import { useState } from 'react'
import { useUserStorage } from '@/hooks/useUserStorage'
import { useAuth } from '@/contexts/AuthContext'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import {
  Plus, Eye, EyeOff, CreditCard, Pencil, Trash2,
  Check, X, ArrowUpRight, ArrowDownRight, Search, Landmark,
  Settings, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { cn, formatCurrency, formatDate, daysUntil } from '@/lib/utils'
import type { Account, Transaction, Bill } from '@/lib/types'

// ─── Category mapping: transaction → contas a pagar ──────────────────────────
const TX_TO_BILL: Record<string, { id: string; icon: string; color: string }> = {
  'Alimentação':  { id: 'alimentacao', icon: '🍽️', color: '#4ADE80' },
  'Mercado':      { id: 'alimentacao', icon: '🍽️', color: '#4ADE80' },
  'Transporte':   { id: 'transporte',  icon: '🚗',  color: '#FB923C' },
  'Saúde':        { id: 'saude',       icon: '🏥',  color: '#F87171' },
  'Moradia':      { id: 'moradia',     icon: '🏠',  color: '#60A5FA' },
  'Compras':      { id: 'compras',     icon: '🛒',  color: '#F472B6' },
  'Utilidades':   { id: 'energia',     icon: '⚡',  color: '#FBBF24' },
  'Assinaturas':  { id: 'emprestimo',  icon: '💳',  color: '#818CF8' },
  'Educação':     { id: 'educacao',    icon: '🎓',  color: '#A78BFA' },
}
const defaultBillCat = { id: 'outros', icon: '📦', color: '#94A3B8' }

// ─── Bank preset library ──────────────────────────────────────────────────────

const BANK_PRESETS = [
  { id: 'nubank',      name: 'Nubank',          logo: 'NU',  color: '#8a05be', type: 'checking'    as const },
  { id: 'itau',        name: 'Itaú',            logo: 'IT',  color: '#ec7000', type: 'checking'    as const },
  { id: 'bradesco',    name: 'Bradesco',        logo: 'BD',  color: '#cc092f', type: 'checking'    as const },
  { id: 'santander',   name: 'Santander',       logo: 'SAN', color: '#ec0000', type: 'checking'    as const },
  { id: 'caixa',       name: 'Caixa',           logo: 'CEF', color: '#005ca9', type: 'checking'    as const },
  { id: 'bb',          name: 'Banco do Brasil', logo: 'BB',  color: '#f9c000', type: 'checking'    as const },
  { id: 'sicoob',      name: 'Sicoob',          logo: 'SC',  color: '#1a5f3a', type: 'checking'    as const },
  { id: 'sicredi',     name: 'Sicredi',         logo: 'SR',  color: '#006b3f', type: 'savings'     as const },
  { id: 'inter',       name: 'Inter',           logo: 'IN',  color: '#ff6600', type: 'checking'    as const },
  { id: 'c6',          name: 'C6 Bank',         logo: 'C6',  color: '#535353', type: 'checking'    as const },
  { id: 'xp',          name: 'XP',              logo: 'XP',  color: '#1a1a2e', type: 'investment'  as const },
  { id: 'btg',         name: 'BTG Pactual',     logo: 'BTG', color: '#003087', type: 'investment'  as const },
  { id: 'next',        name: 'Next',            logo: 'NX',  color: '#00c7b1', type: 'checking'    as const },
  { id: 'picpay',      name: 'PicPay',          logo: 'PP',  color: '#21c25e', type: 'checking'    as const },
  { id: 'neon',        name: 'Neon',            logo: 'NE',  color: '#23e8cb', type: 'checking'    as const },
  { id: 'mercadopago', name: 'Mercado Pago',    logo: 'MP',  color: '#009ee3', type: 'checking'    as const },
  { id: 'pagbank',     name: 'PagBank',         logo: 'PB',  color: '#f4a900', type: 'checking'    as const },
  { id: 'original',    name: 'Original',        logo: 'OR',  color: '#00984a', type: 'checking'    as const },
  { id: 'safra',       name: 'Safra',           logo: 'SF',  color: '#004990', type: 'checking'    as const },
  { id: 'bv',          name: 'BV',              logo: 'BV',  color: '#6b4f9e', type: 'checking'    as const },
  { id: 'will',        name: 'Will Bank',       logo: 'WB',  color: '#00d4e8', type: 'checking'    as const },
  { id: 'iti',         name: 'iti Itaú',        logo: 'ITI', color: '#f77f00', type: 'checking'    as const },
  { id: 'daycoval',    name: 'Daycoval',        logo: 'DC',  color: '#1c3e6e', type: 'checking'    as const },
  { id: 'custom',      name: 'Personalizado',   logo: '+',   color: '#6366f1', type: 'checking'    as const },
]

const COLOR_PALETTE = [
  '#6366f1','#8a05be','#ec7000','#cc092f','#ec0000',
  '#005ca9','#f9c000','#1a5f3a','#006b3f','#ff6600',
  '#535353','#003087','#00c7b1','#21c25e','#23e8cb',
  '#009ee3','#f4a900','#00984a','#004990','#6b4f9e',
]

const ACCOUNT_TYPE_LABELS: Record<Account['type'], string> = {
  checking:   'Conta Corrente',
  savings:    'Poupança',
  investment: 'Investimento',
  credit:     'Cartão de Crédito',
}

const CATS = ['Alimentação','Transporte','Mercado','Saúde','Lazer','Moradia','Compras','Assinaturas','Salário','Transferência','Outros','Utilidades','Rendimentos']

const emptyBankForm = () => ({
  presetId: '' as string,
  name: '',
  logo: '',
  color: '#6366f1',
  type: 'checking' as Account['type'],
  balance: '',
})

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ContasPage() {
  const { user: _user } = useAuth()

  const [accounts, setAccounts] = useUserStorage<Account[]>('finai_accounts', [])
  const [transactions, setTransactions] = useUserStorage<Transaction[]>('finai_transactions', [])
  const [, setBills] = useUserStorage<Bill[]>('finai_bills', [])

  const [hideValues, setHideValues]       = useState(false)
  const [selectedAccount, setSelectedAccount] = useState<string>('')
  const [showAddTx, setShowAddTx]         = useState(false)
  const [editTxId, setEditTxId]           = useState<string | null>(null)
  const [deleteTxId, setDeleteTxId]       = useState<string | null>(null)
  const [search, setSearch]               = useState('')
  const [editBalances, setEditBalances]   = useState<Record<string, string>>({})
  const [editingBalance, setEditingBalance] = useState<string | null>(null)

  // Bank modal
  const [showBankModal, setShowBankModal] = useState(false)
  const [bankMode, setBankMode]           = useState<'add' | 'edit'>('add')
  const [editingBankId, setEditingBankId] = useState<string | null>(null)
  const [bankForm, setBankForm]           = useState(emptyBankForm())
  const [deleteBankId, setDeleteBankId]   = useState<string | null>(null)
  const [bankSearch, setBankSearch]       = useState('')

  const [txForm, setTxForm] = useState({
    description: '', amount: '', type: 'debit' as 'debit' | 'credit',
    category: 'Alimentação', date: new Date().toISOString().slice(0, 10),
  })
  const [editTxForm, setEditTxForm] = useState<Omit<Partial<Transaction>, 'amount'> & { amount: string }>({ amount: '' })

  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0)
  const selected     = accounts.find(a => a.id === selectedAccount) ?? accounts[0]
  const pieData      = accounts.map(a => ({ name: a.name, value: Math.max(a.balance, 0), color: a.color }))

  const accountTx = transactions.filter(t =>
    selected && t.accountId === selected.id &&
    (!search || t.description.toLowerCase().includes(search.toLowerCase()) ||
      t.category.toLowerCase().includes(search.toLowerCase()))
  )

  const mask = (v: number) => hideValues ? '•••••' : formatCurrency(v)

  // ── Bank CRUD ──────────────────────────────────────────────────────────────

  const openAddBank = () => {
    setBankForm(emptyBankForm())
    setBankMode('add')
    setEditingBankId(null)
    setBankSearch('')
    setShowBankModal(true)
  }

  const openEditBank = (acc: Account) => {
    setBankForm({ presetId: '', name: acc.name, logo: acc.logo, color: acc.color, type: acc.type, balance: '' })
    setBankMode('edit')
    setEditingBankId(acc.id)
    setBankSearch('')
    setShowBankModal(true)
  }

  const selectPreset = (p: typeof BANK_PRESETS[0]) => {
    setBankForm(f => ({
      ...f,
      presetId: p.id,
      name: p.id === 'custom' ? f.name : p.name,
      logo: p.id === 'custom' ? f.logo : p.logo,
      color: p.color,
      type: p.type,
    }))
  }

  const handleSaveBank = () => {
    if (!bankForm.name.trim() || !bankForm.logo.trim()) return
    const logoClean = bankForm.logo.trim().toUpperCase().slice(0, 3)
    if (bankMode === 'add') {
      const acc: Account = {
        id: `acc-${Date.now()}`,
        name: bankForm.name.trim(),
        institution: bankForm.name.trim(),
        type: bankForm.type,
        balance: parseFloat(bankForm.balance) || 0,
        color: bankForm.color,
        gradient: `from-[${bankForm.color}] to-[${bankForm.color}99]`,
        logo: logoClean,
        lastSync: new Date().toISOString(),
      }
      setAccounts(prev => [...prev, acc])
      setSelectedAccount(acc.id)
    } else if (editingBankId) {
      setAccounts(prev => prev.map(a => a.id !== editingBankId ? a : {
        ...a, name: bankForm.name.trim(), institution: bankForm.name.trim(),
        type: bankForm.type, color: bankForm.color,
        gradient: `from-[${bankForm.color}] to-[${bankForm.color}99]`, logo: logoClean,
      }))
    }
    setShowBankModal(false)
    setBankForm(emptyBankForm())
  }

  const handleDeleteBank = (id: string) => {
    const remaining = accounts.filter(a => a.id !== id)
    setAccounts(remaining)
    setTransactions(prev => prev.filter(t => t.accountId !== id))
    if (selectedAccount === id) setSelectedAccount(remaining[0]?.id ?? '')
    setDeleteBankId(null)
  }

  // ── Transaction CRUD ───────────────────────────────────────────────────────

  const addTransaction = () => {
    if (!txForm.description || !txForm.amount || !selected) return
    const amt = parseFloat(txForm.amount)
    const newTx: Transaction = {
      id: `t${Date.now()}`, accountId: selected.id, description: txForm.description,
      amount: txForm.type === 'debit' ? -Math.abs(amt) : Math.abs(amt),
      type: txForm.type, category: txForm.category,
      categoryIcon: '📝', categoryColor: '#6366f1', date: txForm.date,
    }
    setTransactions(prev => [newTx, ...prev])
    setAccounts(prev => prev.map(a => a.id === selected.id ? { ...a, balance: a.balance + newTx.amount } : a))

    // Auto-create a pending bill in Contas a Pagar for every debit
    if (txForm.type === 'debit') {
      const cat = TX_TO_BILL[txForm.category] ?? defaultBillCat
      const newBill: Bill = {
        id: `bill-auto-${Date.now()}`,
        name: txForm.description,
        amount: Math.abs(amt),
        paidAmount: 0,
        dueDate: txForm.date,
        category: cat.id,
        categoryIcon: cat.icon,
        categoryColor: cat.color,
        status: 'pending',
        recurrent: false,
        createdAt: new Date().toISOString(),
      }
      setBills(prev => [newBill, ...prev])
    }

    setTxForm({ description: '', amount: '', type: 'debit', category: 'Alimentação', date: new Date().toISOString().slice(0, 10) })
    setShowAddTx(false)
  }

  const startEditTx = (tx: Transaction) => {
    setEditTxId(tx.id)
    setEditTxForm({ ...tx, amount: String(Math.abs(tx.amount)) })
  }

  const saveEditTx = () => {
    if (!editTxId) return
    setTransactions(prev => prev.map(t => {
      if (t.id !== editTxId) return t
      const newAmt = parseFloat(editTxForm.amount || '0')
      const signed = editTxForm.type === 'debit' ? -Math.abs(newAmt) : Math.abs(newAmt)
      const diff = signed - t.amount
      setAccounts(acc => acc.map(a => a.id === t.accountId ? { ...a, balance: a.balance + diff } : a))
      return { ...t, ...editTxForm, amount: signed }
    }))
    setEditTxId(null)
  }

  const deleteTx = (id: string) => {
    const tx = transactions.find(t => t.id === id)
    if (tx) setAccounts(prev => prev.map(a => a.id === tx.accountId ? { ...a, balance: a.balance - tx.amount } : a))
    setTransactions(prev => prev.filter(t => t.id !== id))
    setDeleteTxId(null)
  }

  const saveBalance = (accountId: string) => {
    const v = parseFloat(editBalances[accountId] || '0')
    if (!isNaN(v)) setAccounts(prev => prev.map(a => a.id === accountId ? { ...a, balance: v } : a))
    setEditingBalance(null)
  }

  // ── Preset search ──────────────────────────────────────────────────────────
  const filteredPresets = bankSearch
    ? BANK_PRESETS.filter(p => p.name.toLowerCase().includes(bankSearch.toLowerCase()))
    : BANK_PRESETS
  const isCustom = bankForm.presetId === 'custom' || (!bankForm.presetId && bankMode === 'edit')

  // ──────────────────────────────────────────────────────────────────────────

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-[1400px]">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Minhas Contas</h1>
          <p className="text-sm text-slate-500 mt-0.5">{accounts.length} instituição{accounts.length !== 1 ? 'ões' : ''} conectada{accounts.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => setHideValues(v => !v)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-slate-400 hover:text-slate-200 transition-all">
            {hideValues ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            {hideValues ? 'Mostrar' : 'Ocultar'}
          </button>
          <button onClick={openAddBank}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-slate-400 hover:text-white hover:border-primary-500/30 transition-all">
            <Plus className="w-3.5 h-3.5" />
            Adicionar conta
          </button>
          {accounts.length > 0 && selected && (
            <button onClick={() => setShowAddTx(v => !v)} className="flex items-center gap-2 px-4 py-2 rounded-xl btn-primary text-sm">
              <Plus className="w-3.5 h-3.5" />
              Lançamento
            </button>
          )}
        </div>
      </div>

      {/* ── Empty state ────────────────────────────────────────────────────── */}
      {accounts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mb-5">
            <Landmark className="w-8 h-8 text-slate-600" />
          </div>
          <h3 className="text-base font-semibold text-white mb-2">Nenhuma conta cadastrada</h3>
          <p className="text-sm text-slate-500 mb-6 max-w-xs">
            Adicione suas contas bancárias para controlar seu patrimônio, lançamentos e faturas.
          </p>
          <button onClick={openAddBank} className="flex items-center gap-2 px-5 py-2.5 rounded-xl btn-primary text-sm">
            <Plus className="w-4 h-4" />
            Adicionar minha primeira conta
          </button>
        </div>
      ) : (
        <>
          {/* ── Account cards + Pie ──────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 grid grid-cols-2 gap-4">
              {accounts.map(account => {
                const days = account.invoiceDue ? daysUntil(account.invoiceDue) : null
                const isSelected = selectedAccount === account.id
                const isEditingBal = editingBalance === account.id
                return (
                  <button key={account.id}
                    onClick={() => !isEditingBal && setSelectedAccount(account.id)}
                    className={cn(
                      'text-left rounded-2xl p-4 sm:p-5 border transition-all duration-200 shadow-card group relative',
                      isSelected ? 'border-primary-500/40 shadow-glow-sm' : 'border-white/[0.06] hover:border-white/[0.12]'
                    )}
                    style={{ background: isSelected ? `linear-gradient(135deg, ${account.color}20 0%, ${account.color}05 100%)` : '#16161E' }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      {/* Logo badge */}
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                        style={{ background: `linear-gradient(135deg, ${account.color}, ${account.color}99)` }}>
                        {account.logo}
                      </div>

                      {/* Type + hover actions */}
                      <div className="flex flex-col items-end gap-1.5">
                        <span className="text-xs text-slate-500">{ACCOUNT_TYPE_LABELS[account.type]}</span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={e => { e.stopPropagation(); setEditingBalance(account.id); setEditBalances(b => ({ ...b, [account.id]: String(account.balance) })) }}
                            className="flex items-center gap-1 text-[10px] text-primary-400 hover:text-primary-300 px-1.5 py-0.5 rounded-md hover:bg-primary-500/10 transition-all">
                            <Pencil className="w-2.5 h-2.5" /> saldo
                          </button>
                          <button
                            onClick={e => { e.stopPropagation(); openEditBank(account) }}
                            className="w-5 h-5 rounded-md flex items-center justify-center text-slate-500 hover:text-slate-200 hover:bg-white/[0.10] transition-all"
                            title="Editar banco">
                            <Settings className="w-3 h-3" />
                          </button>
                          <button
                            onClick={e => { e.stopPropagation(); setDeleteBankId(account.id) }}
                            className="w-5 h-5 rounded-md flex items-center justify-center text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                            title="Remover conta">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 font-medium mb-1">{account.name}</p>

                    {isEditingBal ? (
                      <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                        <span className="text-slate-500 text-sm">R$</span>
                        <input autoFocus type="number"
                          value={editBalances[account.id] || ''}
                          onChange={e => setEditBalances(b => ({ ...b, [account.id]: e.target.value }))}
                          onKeyDown={e => { if (e.key === 'Enter') saveBalance(account.id); if (e.key === 'Escape') setEditingBalance(null) }}
                          className="finai-input flex-1 px-2 py-1 text-lg font-bold text-white min-w-0" />
                        <button onClick={e => { e.stopPropagation(); saveBalance(account.id) }}
                          className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
                          <Check className="w-3 h-3" />
                        </button>
                        <button onClick={e => { e.stopPropagation(); setEditingBalance(null) }}
                          className="w-6 h-6 rounded-lg bg-rose-500/20 flex items-center justify-center text-rose-400 flex-shrink-0">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <p className="text-xl font-bold text-white tabular-nums financial-number">{mask(account.balance)}</p>
                    )}

                    {account.invoiceAmount && (
                      <div className={cn('mt-3 flex items-center justify-between px-3 py-2 rounded-xl',
                        days !== null && days <= 3 ? 'bg-rose-500/10 border border-rose-500/20' : 'bg-white/[0.04]')}>
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

              {/* Quick add tile */}
              <button onClick={openAddBank}
                className="rounded-2xl border-2 border-dashed border-white/[0.08] hover:border-primary-500/30 hover:bg-primary-500/[0.04] transition-all flex flex-col items-center justify-center gap-2 p-5 min-h-[130px]">
                <div className="w-10 h-10 rounded-xl bg-white/[0.04] flex items-center justify-center">
                  <Plus className="w-5 h-5 text-slate-500" />
                </div>
                <span className="text-xs text-slate-500">Adicionar conta</span>
              </button>
            </div>

            {/* Distribution chart */}
            <div className="rounded-2xl bg-[#16161E] border border-white/[0.06] p-5 shadow-card">
              <h3 className="text-sm font-semibold text-white mb-1">Distribuição</h3>
              <p className="text-xs text-slate-500 mb-1">Total consolidado</p>
              <p className="text-2xl font-bold text-white tabular-nums mb-4">{mask(totalBalance)}</p>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={pieData.filter(p => p.value > 0)} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" strokeWidth={2} stroke="#09090F">
                    {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    return (
                      <div className="bg-[#16161E] border border-primary-500/20 rounded-xl p-3 text-xs">
                        <p className="text-white font-medium">{payload[0].name}</p>
                        <p className="text-slate-400">{formatCurrency(payload[0].value as number)}</p>
                      </div>
                    )
                  }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2.5 mt-3">
                {accounts.map(acc => (
                  <div key={acc.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: acc.color }} />
                      <span className="text-xs text-slate-400 truncate max-w-[100px]">{acc.name}</span>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="text-xs font-medium text-white tabular-nums">{mask(acc.balance)}</span>
                      <span className="text-[10px] text-slate-600 ml-2">{totalBalance > 0 ? Math.round((acc.balance / totalBalance) * 100) : 0}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Add transaction form ──────────────────────────────────────── */}
          {showAddTx && selected && (
            <div className="rounded-2xl bg-[#16161E] border border-primary-500/20 p-5 shadow-glow-sm animate-slide-up">
              <h3 className="text-sm font-semibold text-white mb-4">Novo lançamento em {selected.name}</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="text-xs text-slate-500 mb-1.5 block">Tipo</label>
                  <div className="flex gap-2">
                    {(['debit', 'credit'] as const).map(t => (
                      <button key={t} onClick={() => setTxForm(f => ({ ...f, type: t }))}
                        className={cn('flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium transition-all',
                          txForm.type === t
                            ? (t === 'debit' ? 'bg-rose-500/20 border border-rose-500/30 text-rose-300' : 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-300')
                            : 'bg-white/[0.04] border border-white/[0.06] text-slate-400')}>
                        {t === 'debit' ? <ArrowDownRight className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                        {t === 'debit' ? 'Despesa' : 'Receita'}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1.5 block">Valor (R$)</label>
                  <input type="number" value={txForm.amount} onChange={e => setTxForm(f => ({ ...f, amount: e.target.value }))} placeholder="0,00" className="finai-input w-full px-3 py-2.5 text-sm text-white" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1.5 block">Data</label>
                  <input type="date" value={txForm.date} onChange={e => setTxForm(f => ({ ...f, date: e.target.value }))} className="finai-input w-full px-3 py-2.5 text-sm text-white" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-slate-500 mb-1.5 block">Descrição</label>
                  <input value={txForm.description} onChange={e => setTxForm(f => ({ ...f, description: e.target.value }))} placeholder="Ex: iFood - Jantar" className="finai-input w-full px-3 py-2.5 text-sm text-white" onKeyDown={e => e.key === 'Enter' && addTransaction()} />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1.5 block">Categoria</label>
                  <select value={txForm.category} onChange={e => setTxForm(f => ({ ...f, category: e.target.value }))} className="finai-input w-full px-3 py-2.5 text-sm text-white">
                    {CATS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <button onClick={() => setShowAddTx(false)} className="px-4 py-2 rounded-xl bg-white/[0.04] text-sm text-slate-400 hover:text-slate-200 transition-all">Cancelar</button>
                <button onClick={addTransaction} disabled={!txForm.description || !txForm.amount} className="px-4 py-2 rounded-xl btn-primary text-sm disabled:opacity-40">Registrar</button>
              </div>
            </div>
          )}

          {/* ── Transaction list ──────────────────────────────────────────── */}
          {selected && (
            <div className="rounded-2xl bg-[#16161E] border border-white/[0.06] shadow-card overflow-hidden">
              <div className="flex items-center justify-between p-5 border-b border-white/[0.06]"
                style={{ background: `linear-gradient(135deg, ${selected.color}12, transparent)` }}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                    style={{ background: `linear-gradient(135deg, ${selected.color}, ${selected.color}99)` }}>
                    {selected.logo}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">{selected.name} — Movimentações</h3>
                    <p className="text-xs text-slate-500">{accountTx.length} transação{accountTx.length !== 1 ? 'ões' : ''}</p>
                  </div>
                </div>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..." className="finai-input pl-8 pr-3 py-2 text-xs w-40 sm:w-48" />
                </div>
              </div>

              <div className="divide-y divide-white/[0.04]">
                {accountTx.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-12">Nenhuma transação encontrada</p>
                ) : accountTx.map(tx => (
                  <div key={tx.id} className="group flex items-center gap-3 px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
                    {editTxId === tx.id ? (
                      <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3 items-center">
                        <input value={editTxForm.description || ''} onChange={e => setEditTxForm(f => ({ ...f, description: e.target.value }))} className="finai-input px-3 py-2 text-sm text-white col-span-2 sm:col-span-1" />
                        <div className="flex items-center gap-1">
                          <span className="text-slate-500 text-xs">R$</span>
                          <input type="number" value={editTxForm.amount} onChange={e => setEditTxForm(f => ({ ...f, amount: e.target.value }))} className="finai-input px-2 py-2 text-sm text-white w-full" />
                        </div>
                        <select value={editTxForm.category || ''} onChange={e => setEditTxForm(f => ({ ...f, category: e.target.value }))} className="finai-input px-2 py-2 text-xs text-white">
                          {CATS.map(c => <option key={c}>{c}</option>)}
                        </select>
                        <input type="date" value={editTxForm.date || ''} onChange={e => setEditTxForm(f => ({ ...f, date: e.target.value }))} className="finai-input px-2 py-2 text-xs text-white" />
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

                    <div className={cn('flex items-center gap-1 flex-shrink-0', editTxId === tx.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 transition-opacity')}>
                      {editTxId === tx.id ? (
                        <>
                          <button onClick={saveEditTx} className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 hover:bg-emerald-500/30"><Check className="w-3.5 h-3.5" /></button>
                          <button onClick={() => setEditTxId(null)} className="w-7 h-7 rounded-lg bg-rose-500/20 flex items-center justify-center text-rose-400 hover:bg-rose-500/30"><X className="w-3.5 h-3.5" /></button>
                        </>
                      ) : deleteTxId === tx.id ? (
                        <>
                          <span className="text-xs text-rose-400 mr-1">Confirmar?</span>
                          <button onClick={() => deleteTx(tx.id)} className="w-7 h-7 rounded-lg bg-rose-500/20 flex items-center justify-center text-rose-400 hover:bg-rose-500/30"><Check className="w-3.5 h-3.5" /></button>
                          <button onClick={() => setDeleteTxId(null)} className="w-7 h-7 rounded-lg bg-white/[0.06] flex items-center justify-center text-slate-400"><X className="w-3.5 h-3.5" /></button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => startEditTx(tx)} className="w-7 h-7 rounded-lg hover:bg-primary-500/15 flex items-center justify-center text-slate-500 hover:text-primary-400 transition-all"><Pencil className="w-3.5 h-3.5" /></button>
                          <button onClick={() => setDeleteTxId(tx.id)} className="w-7 h-7 rounded-lg hover:bg-rose-500/15 flex items-center justify-center text-slate-500 hover:text-rose-400 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Add / Edit Bank Modal ────────────────────────────────────────── */}
      {showBankModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowBankModal(false)} />
          <div className="relative w-full max-w-lg bg-[#16161E] border border-white/[0.10] rounded-2xl shadow-2xl max-h-[92vh] flex flex-col">

            {/* Modal header */}
            <div className="flex items-center justify-between p-5 pb-4 border-b border-white/[0.06] flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-primary-500/15 flex items-center justify-center">
                  <Landmark className="w-4 h-4 text-primary-400" />
                </div>
                <h3 className="text-sm font-semibold text-white">
                  {bankMode === 'add' ? 'Adicionar conta bancária' : 'Editar conta bancária'}
                </h3>
              </div>
              <button onClick={() => setShowBankModal(false)} className="w-7 h-7 rounded-lg hover:bg-white/[0.08] flex items-center justify-center text-slate-500 hover:text-slate-300">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-5 space-y-5">
              {/* Bank picker */}
              {bankMode === 'add' && (
                <div>
                  <label className="text-xs text-slate-500 mb-2 block">Escolha o banco</label>
                  {/* Search */}
                  <div className="relative mb-3">
                    <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      value={bankSearch}
                      onChange={e => setBankSearch(e.target.value)}
                      placeholder="Buscar banco..."
                      className="finai-input w-full pl-8 pr-3 py-2 text-sm text-white"
                    />
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {filteredPresets.map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => selectPreset(p)}
                        className={cn(
                          'flex flex-col items-center gap-1.5 p-2.5 rounded-xl border transition-all',
                          bankForm.presetId === p.id
                            ? 'border-primary-500/50 bg-primary-500/15'
                            : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.14] hover:bg-white/[0.04]'
                        )}
                      >
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                          style={{ background: `linear-gradient(135deg, ${p.color}, ${p.color}99)` }}>
                          {p.logo}
                        </div>
                        <span className={cn('text-[10px] text-center leading-tight truncate w-full',
                          bankForm.presetId === p.id ? 'text-primary-300' : 'text-slate-500')}>
                          {p.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Bank name + logo */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="text-xs text-slate-500 mb-1.5 block">Nome do banco *</label>
                  <input
                    value={bankForm.name}
                    onChange={e => setBankForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Ex: Nubank, C6 Bank..."
                    className="finai-input w-full px-3 py-2.5 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1.5 block">Sigla (2-3 letras)</label>
                  <input
                    value={bankForm.logo}
                    onChange={e => setBankForm(f => ({ ...f, logo: e.target.value.toUpperCase().slice(0, 3) }))}
                    placeholder="NU"
                    maxLength={3}
                    className="finai-input w-full px-3 py-2.5 text-sm text-white text-center font-bold tracking-widest"
                  />
                </div>
              </div>

              {/* Color picker */}
              <div>
                <label className="text-xs text-slate-500 mb-2 block">Cor do banco</label>
                <div className="flex items-center gap-3 flex-wrap">
                  {/* Preview */}
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                    style={{ background: `linear-gradient(135deg, ${bankForm.color}, ${bankForm.color}99)` }}>
                    {bankForm.logo || '?'}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {COLOR_PALETTE.map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setBankForm(f => ({ ...f, color: c }))}
                        className={cn(
                          'w-6 h-6 rounded-lg transition-all',
                          bankForm.color === c ? 'ring-2 ring-white ring-offset-1 ring-offset-[#16161E] scale-110' : 'hover:scale-110'
                        )}
                        style={{ background: c }}
                      />
                    ))}
                    {/* Custom hex */}
                    <label className="w-6 h-6 rounded-lg border border-white/[0.15] flex items-center justify-center cursor-pointer hover:border-white/30 overflow-hidden" title="Cor personalizada">
                      <span className="text-[8px] text-slate-400">#</span>
                      <input type="color" value={bankForm.color} onChange={e => setBankForm(f => ({ ...f, color: e.target.value }))} className="absolute opacity-0 w-0 h-0" />
                    </label>
                  </div>
                </div>
              </div>

              {/* Account type */}
              <div>
                <label className="text-xs text-slate-500 mb-2 block">Tipo de conta</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['checking', 'savings', 'investment', 'credit'] as const).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setBankForm(f => ({ ...f, type: t }))}
                      className={cn(
                        'py-2 px-3 rounded-xl border text-xs font-medium transition-all text-left',
                        bankForm.type === t
                          ? 'border-primary-500/50 bg-primary-500/15 text-primary-300'
                          : 'border-white/[0.06] bg-white/[0.02] text-slate-500 hover:text-slate-300 hover:border-white/[0.12]'
                      )}>
                      {ACCOUNT_TYPE_LABELS[t]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Initial balance (add only) */}
              {bankMode === 'add' && (
                <div>
                  <label className="text-xs text-slate-500 mb-1.5 block">Saldo atual (opcional)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">R$</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={bankForm.balance}
                      onChange={e => setBankForm(f => ({ ...f, balance: e.target.value }))}
                      placeholder="0,00"
                      className="finai-input w-full pl-9 pr-3 py-2.5 text-sm text-white"
                    />
                  </div>
                  <p className="text-[10px] text-slate-600 mt-1">Você pode editar o saldo depois na tela de contas</p>
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div className="flex gap-3 p-5 pt-4 border-t border-white/[0.06] flex-shrink-0">
              <button onClick={() => setShowBankModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-white/[0.04] text-sm text-slate-400 hover:text-slate-200 transition-all">
                Cancelar
              </button>
              <button
                onClick={handleSaveBank}
                disabled={!bankForm.name.trim() || !bankForm.logo.trim()}
                className="flex-1 py-2.5 rounded-xl btn-primary text-sm disabled:opacity-40">
                {bankMode === 'add' ? 'Adicionar conta' : 'Salvar alterações'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete bank confirm ──────────────────────────────────────────── */}
      {deleteBankId && (() => {
        const acc = accounts.find(a => a.id === deleteBankId)
        const txCount = transactions.filter(t => t.accountId === deleteBankId).length
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setDeleteBankId(null)} />
            <div className="relative w-full max-w-xs bg-[#16161E] border border-rose-500/20 rounded-2xl p-5 shadow-2xl text-center">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3"
                style={{ background: `${acc?.color ?? '#6366f1'}20` }}>
                <span className="text-sm font-bold text-white">{acc?.logo ?? '?'}</span>
              </div>
              <p className="text-sm font-medium text-white mb-1">Remover {acc?.name}?</p>
              {txCount > 0 ? (
                <p className="text-xs text-amber-400 mb-4">
                  ⚠ {txCount} transação{txCount !== 1 ? 'ões' : ''} vinculada{txCount !== 1 ? 's' : ''} também será{txCount !== 1 ? 'ão' : ''} removida{txCount !== 1 ? 's' : ''}.
                </p>
              ) : (
                <p className="text-xs text-slate-500 mb-4">Esta ação não pode ser desfeita.</p>
              )}
              <div className="flex gap-3">
                <button onClick={() => setDeleteBankId(null)}
                  className="flex-1 py-2 rounded-xl bg-white/[0.04] text-sm text-slate-400 hover:text-slate-200 transition-all">
                  Cancelar
                </button>
                <button onClick={() => handleDeleteBank(deleteBankId)}
                  className="flex-1 py-2 rounded-xl bg-rose-500/20 border border-rose-500/30 text-sm text-rose-300 hover:bg-rose-500/30 font-medium transition-all">
                  Remover
                </button>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
