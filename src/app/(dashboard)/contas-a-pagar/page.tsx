'use client'

import { useState, useMemo } from 'react'
import { useUserStorage } from '@/hooks/useUserStorage'
import type { Bill } from '@/lib/types'
import {
  Plus, Receipt, CheckCircle2, Clock, AlertTriangle, X,
  Pencil, Trash2, Banknote, CreditCard, Layers,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Constants ────────────────────────────────────────────────────────────────

type FilterTab = 'todas' | 'pendente' | 'parcial' | 'pago'

const CATEGORIES = [
  { id: 'moradia',    label: 'Moradia',         icon: '🏠', color: '#60A5FA' },
  { id: 'energia',    label: 'Energia/Água',    icon: '⚡', color: '#FBBF24' },
  { id: 'telefone',   label: 'Tel./Internet',   icon: '📱', color: '#34D399' },
  { id: 'saude',      label: 'Saúde',           icon: '🏥', color: '#F87171' },
  { id: 'educacao',   label: 'Educação',        icon: '🎓', color: '#A78BFA' },
  { id: 'transporte', label: 'Transporte',      icon: '🚗', color: '#FB923C' },
  { id: 'emprestimo', label: 'Empréstimo',      icon: '💳', color: '#818CF8' },
  { id: 'alimentacao',label: 'Alimentação',     icon: '🍽️', color: '#4ADE80' },
  { id: 'compras',    label: 'Compras',         icon: '🛒', color: '#F472B6' },
  { id: 'outros',     label: 'Outros',          icon: '📦', color: '#94A3B8' },
] as const

const STATUS_CONFIG = {
  pending: { label: 'Pendente', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  partial: { label: 'Parcial',  color: '#60A5FA', bg: 'rgba(96,165,250,0.12)'  },
  paid:    { label: 'Pago',     color: '#34D399', bg: 'rgba(52,211,153,0.12)'  },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(v: number) {
  return `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
}

function isOverdue(bill: Bill) {
  if (bill.status === 'paid') return false
  return new Date(bill.dueDate + 'T00:00:00') < new Date(new Date().toDateString())
}

function dueLabel(dateStr: string, overdue: boolean): { text: string; color: string } {
  const d = new Date(dateStr + 'T00:00:00')
  const today = new Date(new Date().toDateString())
  const days = Math.round((d.getTime() - today.getTime()) / 86400000)
  const formatted = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
  if (overdue) return { text: `Venceu ${formatted}`, color: '#F87171' }
  if (days === 0) return { text: 'Vence hoje', color: '#FBBF24' }
  if (days === 1) return { text: 'Vence amanhã', color: '#FBBF24' }
  if (days <= 7)  return { text: `${days} dias`, color: '#FB923C' }
  return { text: formatted, color: '#64748B' }
}

// ─── Installment helpers ──────────────────────────────────────────────────────

/** Splits a total into n installment amounts, distributing rounding to last */
function splitInstallments(total: number, n: number): number[] {
  const baseCents = Math.floor((total * 100) / n)
  const remainder = Math.round(total * 100) - baseCents * n
  const amounts = Array(n).fill(baseCents / 100) as number[]
  amounts[n - 1] = Math.round((baseCents + remainder)) / 100
  return amounts
}

const INSTALLMENT_OPTIONS = [2,3,4,5,6,7,8,9,10,11,12,15,18,21,24,30,36,48]

const emptyForm = () => ({
  name: '', amount: '', dueDate: '', category: 'outros', recurrent: false, notes: '',
  // Installment fields
  parcelado: false, totalValue: '', installments: '2',
})

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ContasAPagarPage() {
  const [bills, setBills] = useUserStorage<Bill[]>('finai_bills', [])
  const [filter, setFilter] = useState<FilterTab>('todas')

  // Add / edit modal
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingBill, setEditingBill] = useState<Bill | null>(null)
  const [form, setForm] = useState(emptyForm())

  // Baixa modal
  const [baixaModal, setBaixaModal] = useState<Bill | null>(null)
  const [baixaAmount, setBaixaAmount] = useState('')
  const [baixaDate, setBaixaDate] = useState(new Date().toISOString().split('T')[0])

  // Delete confirm
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const today = new Date().toISOString().split('T')[0]

  // ── Stats ────────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const overdue     = bills.filter(b => isOverdue(b))
    const partial     = bills.filter(b => b.status === 'partial')
    const unpaid      = bills.filter(b => b.status !== 'paid')
    const thisMonth   = new Date().getMonth()
    const thisYear    = new Date().getFullYear()
    const paidMonth   = bills.filter(b => {
      if (b.status !== 'paid' || !b.paidAt) return false
      const d = new Date(b.paidAt)
      return d.getMonth() === thisMonth && d.getFullYear() === thisYear
    })
    return {
      unpaidTotal:    unpaid.reduce((s, b) => s + (b.amount - b.paidAmount), 0),
      unpaidCount:    unpaid.length,
      overdueTotal:   overdue.reduce((s, b) => s + (b.amount - b.paidAmount), 0),
      overdueCount:   overdue.length,
      partialTotal:   partial.reduce((s, b) => s + (b.amount - b.paidAmount), 0),
      partialCount:   partial.length,
      paidMonthTotal: paidMonth.reduce((s, b) => s + b.amount, 0),
      paidMonthCount: paidMonth.length,
    }
  }, [bills])

  // ── Filtered list ─────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = [...bills]
    if (filter === 'pendente') list = list.filter(b => b.status === 'pending')
    else if (filter === 'parcial') list = list.filter(b => b.status === 'partial')
    else if (filter === 'pago') list = list.filter(b => b.status === 'paid')
    return list.sort((a, b) => {
      // Overdue first, then by due date, paid last
      if (a.status === 'paid' && b.status !== 'paid') return 1
      if (a.status !== 'paid' && b.status === 'paid') return -1
      const aOv = isOverdue(a), bOv = isOverdue(b)
      if (aOv && !bOv) return -1
      if (!aOv && bOv) return 1
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    })
  }, [bills, filter])

  // ── CRUD ──────────────────────────────────────────────────────────────────
  const closeAddModal = () => {
    setShowAddModal(false)
    setEditingBill(null)
    setForm(emptyForm())
  }

  const handleSave = () => {
    const cat = CATEGORIES.find(c => c.id === form.category) ?? CATEGORIES[CATEGORIES.length - 1]

    // ── Edit existing bill (always single) ────────────────────────────────────
    if (editingBill) {
      if (!form.name.trim() || !form.amount || !form.dueDate) return
      setBills(prev => prev.map(b => b.id !== editingBill.id ? b : {
        ...b,
        name: form.name.trim(),
        amount: parseFloat(form.amount),
        dueDate: form.dueDate,
        category: form.category,
        categoryIcon: cat.icon,
        categoryColor: cat.color,
        recurrent: form.recurrent,
        notes: form.notes,
      }))
      closeAddModal()
      return
    }

    // ── Create parcelado (installment) ────────────────────────────────────────
    if (form.parcelado) {
      const total = parseFloat(form.totalValue)
      const n     = parseInt(form.installments)
      if (!form.name.trim() || isNaN(total) || total <= 0 || isNaN(n) || n < 2 || !form.dueDate) return

      const amounts  = splitInstallments(total, n)
      const groupId  = `grp-${Date.now()}`
      const firstDue = new Date(form.dueDate + 'T12:00:00') // noon avoids DST shifts

      const newBills: Bill[] = amounts.map((amt, i) => {
        const due = new Date(firstDue)
        due.setMonth(due.getMonth() + i)
        return {
          id: `bill-${Date.now()}-${i}`,
          name: `${form.name.trim()} (${i + 1}/${n})`,
          amount: amt,
          paidAmount: 0,
          dueDate: due.toISOString().split('T')[0],
          category: form.category,
          categoryIcon: cat.icon,
          categoryColor: cat.color,
          status: 'pending' as const,
          recurrent: false,
          notes: form.notes || `Parcela ${i + 1} de ${n}`,
          createdAt: new Date().toISOString(),
          installmentOf: { current: i + 1, total: n, groupId, totalPurchaseAmount: total },
        }
      })

      setBills(prev => [...prev, ...newBills])
      closeAddModal()
      return
    }

    // ── Create single bill ────────────────────────────────────────────────────
    if (!form.name.trim() || !form.amount || !form.dueDate) return
    const bill: Bill = {
      id: `bill-${Date.now()}`,
      name: form.name.trim(),
      amount: parseFloat(form.amount),
      paidAmount: 0,
      dueDate: form.dueDate,
      category: form.category,
      categoryIcon: cat.icon,
      categoryColor: cat.color,
      status: 'pending',
      recurrent: form.recurrent,
      notes: form.notes,
      createdAt: new Date().toISOString(),
    }
    setBills(prev => [...prev, bill])
    closeAddModal()
  }

  const openEdit = (bill: Bill) => {
    setForm({
      name: bill.name,
      amount: String(bill.amount),
      dueDate: bill.dueDate,
      category: bill.category,
      parcelado: false,
      totalValue: '',
      installments: '2',
      recurrent: bill.recurrent,
      notes: bill.notes ?? '',
    })
    setEditingBill(bill)
    setShowAddModal(true)
  }

  const openBaixa = (bill: Bill) => {
    const remaining = bill.amount - bill.paidAmount
    setBaixaModal(bill)
    setBaixaAmount(remaining.toFixed(2))
    setBaixaDate(today)
  }

  const handleBaixa = () => {
    if (!baixaModal) return
    const paying = parseFloat(baixaAmount) || 0
    if (paying <= 0) return
    const newPaid = Math.min(baixaModal.paidAmount + paying, baixaModal.amount)
    const newStatus: Bill['status'] = newPaid >= baixaModal.amount ? 'paid' : 'partial'
    setBills(prev => prev.map(b => b.id !== baixaModal.id ? b : {
      ...b,
      paidAmount: newPaid,
      status: newStatus,
      paidAt: newStatus === 'paid' ? new Date().toISOString() : b.paidAt,
    }))
    setBaixaModal(null)
    setBaixaAmount('')
  }

  const handleDelete = (id: string) => {
    setBills(prev => prev.filter(b => b.id !== id))
    setDeleteConfirm(null)
  }

  // ── Tab counts ─────────────────────────────────────────────────────────────
  const tabCounts: Record<FilterTab, number> = {
    todas:    bills.length,
    pendente: bills.filter(b => b.status === 'pending').length,
    parcial:  bills.filter(b => b.status === 'partial').length,
    pago:     bills.filter(b => b.status === 'paid').length,
  }

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-4xl mx-auto">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FB923C]/15 flex items-center justify-center">
            <Receipt className="w-5 h-5 text-[#FB923C]" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-white">Contas a Pagar</h1>
            <p className="text-[11px] text-slate-500">Controle de pagamentos e baixas</p>
          </div>
        </div>
        <button
          onClick={() => { setForm(emptyForm()); setEditingBill(null); setShowAddModal(true) }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl btn-primary text-sm"
        >
          <Plus className="w-4 h-4" />
          Nova conta
        </button>
      </div>

      {/* ── Stats ──────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label="A Pagar"
          value={fmt(stats.unpaidTotal)}
          sub={`${stats.unpaidCount} conta${stats.unpaidCount !== 1 ? 's' : ''}`}
          color="#F59E0B"
          icon={<Clock className="w-4 h-4 text-amber-400" />}
        />
        <StatCard
          label="Vencidas"
          value={fmt(stats.overdueTotal)}
          sub={`${stats.overdueCount} conta${stats.overdueCount !== 1 ? 's' : ''}`}
          color="#F87171"
          icon={<AlertTriangle className="w-4 h-4 text-rose-400" />}
          warn={stats.overdueCount > 0}
        />
        <StatCard
          label="Pagas (mês)"
          value={fmt(stats.paidMonthTotal)}
          sub={`${stats.paidMonthCount} conta${stats.paidMonthCount !== 1 ? 's' : ''}`}
          color="#34D399"
          icon={<CheckCircle2 className="w-4 h-4 text-emerald-400" />}
        />
        <StatCard
          label="Parcial"
          value={fmt(stats.partialTotal)}
          sub={`${stats.partialCount} conta${stats.partialCount !== 1 ? 's' : ''}`}
          color="#60A5FA"
          icon={<Banknote className="w-4 h-4 text-blue-400" />}
        />
      </div>

      {/* ── Filter tabs ────────────────────────────────────────────────────── */}
      <div className="flex gap-1.5 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06] w-fit flex-wrap">
        {(['todas', 'pendente', 'parcial', 'pago'] as FilterTab[]).map(tab => {
          const labels: Record<FilterTab, string> = { todas: 'Todas', pendente: 'Pendentes', parcial: 'Parciais', pago: 'Pagas' }
          return (
            <button key={tab} onClick={() => setFilter(tab)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                filter === tab
                  ? 'bg-primary-500/20 text-primary-300 border border-primary-500/30'
                  : 'text-slate-500 hover:text-slate-300'
              )}>
              {labels[tab]}
              <span className={cn(
                'px-1.5 py-0.5 rounded-md text-[10px] font-bold',
                filter === tab ? 'bg-primary-500/30 text-primary-200' : 'bg-white/[0.05] text-slate-500'
              )}>
                {tabCounts[tab]}
              </span>
            </button>
          )
        })}
      </div>

      {/* ── Bill list ──────────────────────────────────────────────────────── */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-white/[0.04] flex items-center justify-center mb-4">
              <Receipt className="w-7 h-7 text-slate-600" />
            </div>
            <p className="text-sm text-slate-500">Nenhuma conta encontrada</p>
            <p className="text-xs text-slate-600 mt-1">
              {filter === 'todas' ? 'Clique em "Nova conta" para adicionar' : 'Sem contas neste filtro'}
            </p>
          </div>
        ) : (
          filtered.map(bill => {
            const cat  = CATEGORIES.find(c => c.id === bill.category) ?? CATEGORIES[CATEGORIES.length - 1]
            const over  = isOverdue(bill)
            const due   = dueLabel(bill.dueDate, over)
            const remaining = bill.amount - bill.paidAmount
            const pct = bill.amount > 0 ? (bill.paidAmount / bill.amount) * 100 : 0
            const sc  = STATUS_CONFIG[bill.status]

            return (
              <div key={bill.id} className={cn(
                'group relative flex items-center gap-3 md:gap-4 pl-5 pr-3 py-4 rounded-2xl border transition-all',
                'bg-[#0D0D15] hover:bg-[#12121A]',
                over ? 'border-rose-500/25' : 'border-white/[0.06]',
                bill.status === 'paid' && 'opacity-60'
              )}>
                {/* Color bar */}
                <div className="absolute left-0 top-3 bottom-3 w-1 rounded-full"
                  style={{ background: over ? '#F87171' : sc.color }} />

                {/* Category emoji */}
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{ background: `${cat.color}18` }}>
                  {cat.icon}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className={cn('text-sm font-medium truncate', bill.status === 'paid' ? 'text-slate-400' : 'text-white')}>
                      {bill.name}
                    </p>
                    {bill.installmentOf && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-violet-500/15 text-violet-400 border border-violet-500/20 flex-shrink-0 hidden sm:inline flex items-center gap-1">
                        <Layers className="w-2.5 h-2.5 inline" />
                        {' '}{bill.installmentOf.current}/{bill.installmentOf.total}
                      </span>
                    )}
                    {bill.recurrent && !bill.installmentOf && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-primary-500/15 text-primary-400 border border-primary-500/20 flex-shrink-0 hidden sm:inline">
                        RECORRENTE
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span style={{ color: due.color }}>{due.text}</span>
                    {bill.status === 'partial' && (
                      <span className="text-slate-600 hidden sm:inline">• Pago: {fmt(bill.paidAmount)}</span>
                    )}
                  </div>
                  {bill.status === 'partial' && (
                    <div className="mt-2 h-1 bg-white/[0.06] rounded-full w-full max-w-[140px]">
                      <div className="h-1 rounded-full bg-blue-400 transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  )}
                </div>

                {/* Amount + status */}
                <div className="text-right flex-shrink-0">
                  <p className={cn('text-sm font-bold tabular-nums', bill.status === 'paid' ? 'text-slate-400' : 'text-white')}>
                    {fmt(bill.amount)}
                  </p>
                  {bill.status === 'partial' && (
                    <p className="text-xs text-blue-400 tabular-nums">falta {fmt(remaining)}</p>
                  )}
                  <span className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ color: over ? '#F87171' : sc.color, background: over ? 'rgba(248,113,113,0.12)' : sc.bg }}>
                    {over ? '⚠ VENCIDA' : sc.label.toUpperCase()}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-1">
                  {bill.status !== 'paid' && (
                    <button
                      onClick={() => openBaixa(bill)}
                      className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 text-xs font-medium hover:bg-emerald-500/25 transition-all whitespace-nowrap"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Baixa</span>
                    </button>
                  )}
                  <button onClick={() => openEdit(bill)}
                    className="w-7 h-7 rounded-lg bg-white/[0.04] flex items-center justify-center text-slate-500 hover:text-slate-300 hover:bg-white/[0.08]">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setDeleteConfirm(bill.id)}
                    className="w-7 h-7 rounded-lg bg-white/[0.04] flex items-center justify-center text-slate-500 hover:text-rose-400 hover:bg-rose-500/10">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* ── Add / Edit Modal ────────────────────────────────────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={closeAddModal} />
          <div className="relative w-full max-w-md bg-[#16161E] border border-white/[0.10] rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-semibold text-white">
                {editingBill ? 'Editar conta' : 'Nova conta a pagar'}
              </h3>
              <button onClick={closeAddModal} className="w-7 h-7 rounded-lg hover:bg-white/[0.08] flex items-center justify-center text-slate-500 hover:text-slate-300">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-500 mb-1.5 block">Nome da conta *</label>
                <input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Ex: Aluguel, Conta de luz, Carnê..."
                  className="finai-input w-full px-3 py-2.5 text-sm text-white"
                />
              </div>

              {/* ── Parcelado toggle (only when creating) ──────────────────────── */}
              {!editingBill && (
                <div className="flex rounded-xl overflow-hidden border border-white/[0.08]">
                  <button type="button"
                    onClick={() => setForm(f => ({ ...f, parcelado: false }))}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-medium transition-all',
                      !form.parcelado
                        ? 'bg-primary-500/20 text-primary-300 border-r border-primary-500/30'
                        : 'bg-white/[0.02] text-slate-500 hover:text-slate-300 border-r border-white/[0.08]'
                    )}>
                    <Receipt className="w-3.5 h-3.5" />
                    Conta simples
                  </button>
                  <button type="button"
                    onClick={() => setForm(f => ({ ...f, parcelado: true }))}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-medium transition-all',
                      form.parcelado
                        ? 'bg-violet-500/20 text-violet-300'
                        : 'bg-white/[0.02] text-slate-500 hover:text-slate-300'
                    )}>
                    <CreditCard className="w-3.5 h-3.5" />
                    Parcelado
                  </button>
                </div>
              )}

              {form.parcelado && !editingBill ? (
                /* ── PARCELADO mode ──────────────────────────────────────────── */
                <>
                  {/* Total + installment count */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-500 mb-1.5 block">Valor total da compra *</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs pointer-events-none">R$</span>
                        <input
                          type="number" min="0.01" step="0.01"
                          value={form.totalValue}
                          onChange={e => setForm(f => ({ ...f, totalValue: e.target.value }))}
                          placeholder="0,00"
                          className="finai-input w-full pl-8 pr-3 py-2.5 text-sm text-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 mb-1.5 block">Número de parcelas *</label>
                      <select
                        value={form.installments}
                        onChange={e => setForm(f => ({ ...f, installments: e.target.value }))}
                        className="finai-input w-full px-3 py-2.5 text-sm text-white appearance-none"
                      >
                        {INSTALLMENT_OPTIONS.map(n => (
                          <option key={n} value={n}>{n}x</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Live preview */}
                  {form.totalValue && parseFloat(form.totalValue) > 0 && (() => {
                    const total = parseFloat(form.totalValue)
                    const n     = parseInt(form.installments)
                    const each  = splitInstallments(total, n)
                    return (
                      <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-violet-500/10 border border-violet-500/20">
                        <div className="flex items-center gap-2">
                          <Layers className="w-4 h-4 text-violet-400" />
                          <span className="text-xs text-violet-300 font-semibold">
                            {n}x de {fmt(each[0])}
                            {each[n - 1] !== each[0] && (
                              <span className="text-violet-400/70 font-normal"> (última: {fmt(each[n - 1])})</span>
                            )}
                          </span>
                        </div>
                        <span className="text-xs text-slate-500">= {fmt(total)}</span>
                      </div>
                    )
                  })()}

                  {/* First due date */}
                  <div>
                    <label className="text-xs text-slate-500 mb-1.5 block">Data do 1º vencimento *</label>
                    <input
                      type="date"
                      value={form.dueDate}
                      onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                      className="finai-input w-full px-3 py-2.5 text-sm text-white"
                    />
                    {form.dueDate && parseInt(form.installments) > 1 && (
                      <p className="text-[10px] text-slate-600 mt-1">
                        Os próximos vencimentos serão gerados mensalmente a partir desta data.
                      </p>
                    )}
                  </div>
                </>
              ) : (
                /* ── SIMPLES mode (default) ──────────────────────────────────── */
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-500 mb-1.5 block">Valor total *</label>
                    <input
                      type="number" min="0" step="0.01"
                      value={form.amount}
                      onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                      placeholder="0,00"
                      className="finai-input w-full px-3 py-2.5 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1.5 block">Vencimento *</label>
                    <input
                      type="date"
                      value={form.dueDate}
                      onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                      className="finai-input w-full px-3 py-2.5 text-sm text-white"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs text-slate-500 mb-1.5 block">Categoria</label>
                <div className="grid grid-cols-5 gap-1.5">
                  {CATEGORIES.map(cat => (
                    <button key={cat.id} type="button"
                      onClick={() => setForm(f => ({ ...f, category: cat.id }))}
                      className={cn(
                        'flex flex-col items-center gap-1 p-2 rounded-xl border text-xs transition-all',
                        form.category === cat.id
                          ? 'border-primary-500/50 bg-primary-500/15 text-white'
                          : 'border-white/[0.06] bg-white/[0.02] text-slate-500 hover:border-white/[0.12] hover:text-slate-300'
                      )}>
                      <span className="text-lg leading-none">{cat.icon}</span>
                      <span className="text-[9px] text-center leading-tight">{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-500 mb-1.5 block">Observação</label>
                <input
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Opcional..."
                  className="finai-input w-full px-3 py-2.5 text-sm text-white"
                />
              </div>

              {!form.parcelado && (
                <label className="flex items-center gap-3 p-3 rounded-xl border border-white/[0.06] bg-white/[0.02] cursor-pointer hover:border-white/[0.12] transition-all">
                  <input
                    type="checkbox"
                    checked={form.recurrent}
                    onChange={e => setForm(f => ({ ...f, recurrent: e.target.checked }))}
                    className="w-4 h-4 rounded accent-indigo-500"
                  />
                  <div>
                    <p className="text-xs font-medium text-slate-300">Conta recorrente</p>
                    <p className="text-[10px] text-slate-600">Repete todo mês nesta data de vencimento</p>
                  </div>
                </label>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={closeAddModal}
                className="flex-1 py-2.5 rounded-xl bg-white/[0.04] text-sm text-slate-400 hover:text-slate-200 transition-all">
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={
                  !form.name.trim() || !form.dueDate ||
                  (form.parcelado && !editingBill
                    ? !form.totalValue || parseFloat(form.totalValue) <= 0
                    : !form.amount)
                }
                className="flex-1 py-2.5 rounded-xl btn-primary text-sm disabled:opacity-40">
                {editingBill
                  ? 'Salvar'
                  : form.parcelado
                    ? `Criar ${form.installments}x parcelas`
                    : 'Adicionar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Baixa Modal ─────────────────────────────────────────────────────── */}
      {baixaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setBaixaModal(null)} />
          <div className="relative w-full max-w-sm bg-[#16161E] border border-emerald-500/20 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Dar baixa</h3>
                  <p className="text-[11px] text-slate-500 truncate max-w-[180px]">{baixaModal.name}</p>
                </div>
              </div>
              <button onClick={() => setBaixaModal(null)}
                className="w-7 h-7 rounded-lg hover:bg-white/[0.08] flex items-center justify-center text-slate-500">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Summary */}
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 mb-4 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Total da conta</span>
                <span className="text-white font-medium tabular-nums">{fmt(baixaModal.amount)}</span>
              </div>
              {baixaModal.paidAmount > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Já pago</span>
                  <span className="text-emerald-400 tabular-nums">{fmt(baixaModal.paidAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-xs pt-1.5 border-t border-white/[0.06]">
                <span className="text-slate-400 font-medium">Restante</span>
                <span className="text-amber-400 font-bold tabular-nums">{fmt(baixaModal.amount - baixaModal.paidAmount)}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-500 mb-1.5 block">Valor pago agora</label>
                <input
                  type="number" min="0.01" step="0.01"
                  value={baixaAmount}
                  onChange={e => setBaixaAmount(e.target.value)}
                  className="finai-input w-full px-3 py-2.5 text-base text-white font-bold text-right tabular-nums"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1.5 block">Data do pagamento</label>
                <input
                  type="date"
                  value={baixaDate}
                  onChange={e => setBaixaDate(e.target.value)}
                  className="finai-input w-full px-3 py-2.5 text-sm text-white"
                />
              </div>
            </div>

            {/* Result preview */}
            {baixaAmount && parseFloat(baixaAmount) > 0 && (() => {
              const paying = parseFloat(baixaAmount)
              const remaining = baixaModal.amount - baixaModal.paidAmount
              const isFullPay = paying >= remaining
              return (
                <div className={cn(
                  'mt-3 px-3 py-2 rounded-lg border text-xs',
                  isFullPay ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                )}>
                  {isFullPay
                    ? '✓ Conta será totalmente quitada'
                    : `Restará ${fmt(remaining - paying)} — ficará como parcialmente pago`}
                </div>
              )
            })()}

            <div className="flex gap-3 mt-5">
              <button onClick={() => setBaixaModal(null)}
                className="flex-1 py-2.5 rounded-xl bg-white/[0.04] text-sm text-slate-400 hover:text-slate-200 transition-all">
                Cancelar
              </button>
              <button
                onClick={handleBaixa}
                disabled={!baixaAmount || parseFloat(baixaAmount) <= 0}
                className="flex-1 py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-sm text-emerald-300 hover:bg-emerald-500/30 font-medium transition-all disabled:opacity-40">
                Confirmar baixa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete confirm ──────────────────────────────────────────────────── */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
          <div className="relative w-full max-w-xs bg-[#16161E] border border-rose-500/20 rounded-2xl p-5 shadow-2xl text-center">
            <div className="w-10 h-10 rounded-xl bg-rose-500/15 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-5 h-5 text-rose-400" />
            </div>
            <p className="text-sm font-medium text-white mb-1">Excluir esta conta?</p>
            <p className="text-xs text-slate-500 mb-5">Esta ação não pode ser desfeita.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2 rounded-xl bg-white/[0.04] text-sm text-slate-400 hover:text-slate-200 transition-all">
                Cancelar
              </button>
              <button onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 py-2 rounded-xl bg-rose-500/20 border border-rose-500/30 text-sm text-rose-300 hover:bg-rose-500/30 font-medium transition-all">
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── StatCard ─────────────────────────────────────────────────────────────────

function StatCard({
  label, value, sub, icon, warn,
}: {
  label: string
  value: string
  sub: string
  color: string
  icon: React.ReactNode
  warn?: boolean
}) {
  return (
    <div className={cn(
      'p-4 rounded-2xl border bg-[#0D0D15] flex flex-col gap-2',
      warn ? 'border-rose-500/30' : 'border-white/[0.06]'
    )}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-slate-500 uppercase tracking-wider leading-tight">{label}</span>
        {icon}
      </div>
      <p className="text-base font-bold text-white tabular-nums">{value}</p>
      <p className="text-[10px] text-slate-600">{sub}</p>
    </div>
  )
}
