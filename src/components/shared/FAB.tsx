'use client'

import { useState } from 'react'
import { Plus, X, ArrowDownLeft, ArrowUpRight, Check, CreditCard, Layers } from 'lucide-react'
import { ACCOUNTS, INSTALLMENTS } from '@/lib/mock-data'
import type { Installment } from '@/lib/types'
import { cn } from '@/lib/utils'

const CATEGORIES = [
  { name: 'Alimentação', icon: '🍔' },
  { name: 'Transporte',  icon: '🚗' },
  { name: 'Mercado',     icon: '🛒' },
  { name: 'Saúde',       icon: '💊' },
  { name: 'Lazer',       icon: '🎬' },
  { name: 'Moradia',     icon: '🏠' },
  { name: 'Compras',     icon: '🛍️' },
  { name: 'Assinaturas', icon: '📱' },
  { name: 'Salário',     icon: '💼' },
  { name: 'Transferência',icon:'↔️'  },
  { name: 'Outros',      icon: '📝' },
]

/** Write an installment directly to localStorage so Assinaturas page picks it up */
function persistInstallment(data: Installment) {
  if (typeof window === 'undefined') return
  try {
    const key = 'finai_installments'
    const raw = window.localStorage.getItem(key)
    const existing: Installment[] = raw ? JSON.parse(raw) : INSTALLMENTS
    window.localStorage.setItem(key, JSON.stringify([data, ...existing]))
  } catch {}
}

export function FAB() {
  const [open, setOpen]   = useState(false)
  const [saved, setSaved] = useState(false)
  const [type, setType]   = useState<'debit'|'credit'>('debit')
  const [parcelado, setParcelado] = useState(false)
  const [installCount, setInstallCount] = useState('2')
  const [form, setForm]   = useState({
    description: '',
    amount: '',
    category: 'Alimentação',
    accountId: ACCOUNTS[0].id,
    date: new Date().toISOString().slice(0, 10),
    notes: '',
  })

  const f = (key: string, val: string) => setForm(p => ({ ...p, [key]: val }))

  const handleSave = () => {
    if (!form.description || !form.amount) return

    if (parcelado) {
      const n = Math.max(2, parseInt(installCount) || 2)
      const installmentValue = parseFloat(form.amount)
      const newInstallment: Installment = {
        id: `fab${Date.now()}`,
        description: form.description,
        totalAmount: parseFloat((installmentValue * n).toFixed(2)),
        installmentValue,
        totalInstallments: n,
        paidInstallments: 0,
        startDate: form.date,
        accountId: form.accountId,
        nextDue: form.date,
      }
      persistInstallment(newInstallment)
    }

    setSaved(true)
    setTimeout(() => {
      setSaved(false)
      setOpen(false)
      setParcelado(false)
      setInstallCount('2')
      setForm({ description:'', amount:'', category:'Alimentação', accountId:ACCOUNTS[0].id, date:new Date().toISOString().slice(0,10), notes:'' })
    }, 1200)
  }

  const catIcon = CATEGORIES.find(c => c.name === form.category)?.icon ?? '📝'
  const installNum = Math.max(2, parseInt(installCount) || 2)
  const totalParc = parseFloat(form.amount || '0') * installNum

  return (
    <>
      {/* Overlay */}
      {open && (
        <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)} />
      )}

      {/* Panel */}
      {open && (
        <div className="fixed bottom-24 right-4 sm:right-6 z-50 w-[340px] max-w-[calc(100vw-2rem)] rounded-2xl bg-[#16161E] border border-primary-500/20 shadow-2xl shadow-primary-500/10 animate-slide-up">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <span className="text-lg">{parcelado ? '💳' : catIcon}</span>
              <h3 className="text-sm font-semibold text-white">
                {parcelado ? 'Compra Parcelada' : 'Novo Lançamento'}
              </h3>
            </div>
            <button onClick={() => setOpen(false)} className="w-6 h-6 rounded-lg hover:bg-white/10 flex items-center justify-center text-slate-500 hover:text-slate-300 transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-4 space-y-3">
            {/* Type toggle (hidden when parcelado) */}
            {!parcelado && (
              <div className="flex gap-2 p-1 bg-white/[0.04] rounded-xl">
                {(['debit','credit'] as const).map(t => (
                  <button key={t} onClick={() => setType(t)}
                    className={cn('flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-all',
                      type === t
                        ? t === 'debit'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'text-slate-500 hover:text-slate-300'
                    )}>
                    {t === 'debit' ? <ArrowDownLeft className="w-3.5 h-3.5"/> : <ArrowUpRight className="w-3.5 h-3.5"/>}
                    {t === 'debit' ? 'Despesa' : 'Receita'}
                  </button>
                ))}
              </div>
            )}

            {/* Parcelado toggle */}
            <button
              onClick={() => setParcelado(v => !v)}
              className={cn(
                'w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-sm font-medium transition-all',
                parcelado
                  ? 'bg-primary-500/20 border-primary-500/40 text-primary-300'
                  : 'bg-white/[0.04] border-white/[0.06] text-slate-400 hover:text-slate-200'
              )}
            >
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Compra parcelada no cartão
              </div>
              <div className={cn('w-4 h-4 rounded border-2 flex items-center justify-center transition-all', parcelado ? 'bg-primary-500 border-primary-400' : 'border-slate-600')}>
                {parcelado && <Check className="w-2.5 h-2.5 text-white" />}
              </div>
            </button>

            {/* Installment count — shows when parcelado */}
            {parcelado && (
              <div className="rounded-xl bg-primary-500/8 border border-primary-500/20 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 flex items-center gap-1.5"><Layers className="w-3.5 h-3.5 text-primary-400" />Número de parcelas</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setInstallCount(v => String(Math.max(2, parseInt(v||'2') - 1)))} className="w-6 h-6 rounded-lg bg-white/[0.06] text-slate-300 hover:bg-white/[0.10] font-bold text-sm flex items-center justify-center">−</button>
                    <input
                      type="number"
                      value={installCount}
                      onChange={e => setInstallCount(e.target.value)}
                      min={2}
                      max={48}
                      className="finai-input w-14 px-2 py-1 text-center text-sm font-bold text-white"
                    />
                    <button onClick={() => setInstallCount(v => String(Math.min(48, parseInt(v||'2') + 1)))} className="w-6 h-6 rounded-lg bg-white/[0.06] text-slate-300 hover:bg-white/[0.10] font-bold text-sm flex items-center justify-center">+</button>
                  </div>
                </div>
                <div className="flex gap-2">
                  {[2,3,6,10,12].map(n => (
                    <button key={n} onClick={() => setInstallCount(String(n))} className={cn('flex-1 py-1 rounded-lg text-xs font-medium transition-all', parseInt(installCount) === n ? 'bg-primary-500/30 text-primary-300 border border-primary-500/40' : 'bg-white/[0.04] text-slate-500 hover:text-slate-300')}>{n}×</button>
                  ))}
                </div>
                {form.amount && (
                  <p className="text-xs text-slate-500">
                    {installNum}× de <span className="text-white font-semibold">R$ {parseFloat(form.amount || '0').toFixed(2).replace('.', ',')}</span> = total <span className="text-primary-300 font-semibold">R$ {totalParc.toFixed(2).replace('.', ',')}</span>
                  </p>
                )}
              </div>
            )}

            {/* Amount */}
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium text-sm">R$</span>
              <input
                type="number"
                value={form.amount}
                onChange={e => f('amount', e.target.value)}
                placeholder={parcelado ? 'Valor por parcela' : '0,00'}
                className="finai-input w-full pl-10 pr-4 py-3 text-xl font-bold text-center"
                autoFocus
              />
            </div>

            {/* Description */}
            <input
              type="text"
              value={form.description}
              onChange={e => f('description', e.target.value)}
              placeholder={parcelado ? 'Ex: iPhone 15 Pro' : 'Descrição (ex: iFood - pizza)'}
              className="finai-input w-full px-3 py-2.5"
              onKeyDown={e => e.key === 'Enter' && handleSave()}
            />

            {/* Category chips (hidden when parcelado) */}
            {!parcelado && (
              <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
                {CATEGORIES.map(c => (
                  <button key={c.name} onClick={() => f('category', c.name)}
                    className={cn('flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all',
                      form.category === c.name
                        ? 'bg-primary-500/20 border border-primary-500/40 text-primary-300'
                        : 'bg-white/[0.04] text-slate-400 hover:text-slate-200 border border-transparent'
                    )}>
                    {c.icon} {c.name}
                  </button>
                ))}
              </div>
            )}

            {/* Account + Date row */}
            <div className="grid grid-cols-2 gap-2">
              <select value={form.accountId} onChange={e => f('accountId', e.target.value)} className="finai-input px-3 py-2 text-xs">
                {ACCOUNTS.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
              <input type="date" value={form.date} onChange={e => f('date', e.target.value)} className="finai-input px-3 py-2 text-xs" />
            </div>

            {/* Notes (hidden when parcelado) */}
            {!parcelado && (
              <input type="text" value={form.notes} onChange={e => f('notes', e.target.value)} placeholder="Observação (opcional)" className="finai-input w-full px-3 py-2 text-xs" />
            )}

            {/* Save */}
            <button
              onClick={handleSave}
              disabled={!form.description || !form.amount}
              className={cn('w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all',
                saved ? 'bg-emerald-500 text-white' : 'btn-primary'
              )}
            >
              {saved
                ? (<><Check className="w-4 h-4"/> {parcelado ? 'Parcelamento salvo!' : 'Salvo!'}</>)
                : parcelado
                  ? `Parcelar em ${installNum}× de R$ ${parseFloat(form.amount||'0').toFixed(2).replace('.', ',')}`
                  : 'Registrar lançamento'}
            </button>

            {parcelado && (
              <p className="text-[10px] text-slate-600 text-center">
                O parcelamento aparecerá em Assinaturas → Parcelamentos
              </p>
            )}
          </div>
        </div>
      )}

      {/* FAB button */}
      <button
        onClick={() => setOpen(v => !v)}
        aria-label="Novo lançamento"
        className={cn(
          'fixed bottom-6 right-4 sm:right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200',
          open
            ? 'bg-[#1E1E2A] border border-white/10 rotate-45'
            : 'bg-primary-600 hover:bg-primary-500 shadow-fab'
        )}
      >
        <Plus className="w-6 h-6 text-white" />
      </button>
    </>
  )
}
