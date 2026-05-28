'use client'

import { useState, useCallback } from 'react'
import {
  Upload, FileText, CheckCircle, XCircle, Clock, RefreshCw,
  Trash2, X, ArrowUpRight, ArrowDownRight,
} from 'lucide-react'
import { cn, formatDate } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { useUserStorage } from '@/hooks/useUserStorage'
import type { Document, DocumentStatus, Account, Transaction } from '@/lib/types'

// ─── Bank map ─────────────────────────────────────────────────────────────────

const BANK_MAP: Record<string, { logo: string; color: string; gradient: string }> = {
  'nubank':        { logo: 'NU', color: '#8a05be', gradient: 'from-[#8a05be] to-[#6200a8]' },
  'itaú':         { logo: 'IT', color: '#ec7000', gradient: 'from-[#ec7000] to-[#c55a00]' },
  'bradesco':      { logo: 'BD', color: '#cc0000', gradient: 'from-[#cc0000] to-[#990000]' },
  'santander':     { logo: 'ST', color: '#ec0000', gradient: 'from-[#ec0000] to-[#b00000]' },
  'caixa':         { logo: 'CX', color: '#005b9f', gradient: 'from-[#005b9f] to-[#003d6b]' },
  'banco do brasil': { logo: 'BB', color: '#f9d100', gradient: 'from-[#f9d100] to-[#c9a800]' },
  'sicoob':        { logo: 'SC', color: '#1a5f3a', gradient: 'from-[#1a5f3a] to-[#0d3d24]' },
  'sicredi':       { logo: 'SR', color: '#006b3f', gradient: 'from-[#006b3f] to-[#004428]' },
  'inter':         { logo: 'IN', color: '#ff7a00', gradient: 'from-[#ff7a00] to-[#cc6200]' },
  'c6':            { logo: 'C6', color: '#242424', gradient: 'from-[#333] to-[#111]' },
  'xp':            { logo: 'XP', color: '#000000', gradient: 'from-[#1a1a1a] to-[#000000]' },
  'btg':           { logo: 'BT', color: '#003399', gradient: 'from-[#003399] to-[#002266]' },
  'next':          { logo: 'NX', color: '#00c964', gradient: 'from-[#00c964] to-[#009948]' },
  'picpay':        { logo: 'PP', color: '#11c76f', gradient: 'from-[#11c76f] to-[#0a9954]' },
  'neon':          { logo: 'NO', color: '#7534f7', gradient: 'from-[#7534f7] to-[#5a1fd4]' },
}

function getBankInfo(bankName: string) {
  const lower = (bankName ?? '').toLowerCase()
  for (const [key, val] of Object.entries(BANK_MAP)) {
    if (lower.includes(key)) return { ...val, name: bankName }
  }
  return {
    logo: (bankName ?? 'XX').slice(0, 2).toUpperCase(),
    color: '#6366f1',
    gradient: 'from-[#6366f1] to-[#4f46e5]',
    name: bankName,
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface ExtractedTransaction {
  date: string
  description: string
  amount: number
  type: 'credit' | 'debit'
  category: string
}

interface AnalysisResult {
  bank: string
  accountType: string
  accountHolder: string | null
  period: string | null
  transactions: ExtractedTransaction[]
  openingBalance: number | null
  closingBalance: number | null
}

// Stored document (serializable — no File or other non-JSON objects)
type StoredDoc = Omit<Document, 'type'> & {
  type: string
  analysisResult?: AnalysisResult
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: DocumentStatus }) {
  const config = {
    pending:    { icon: Clock,        color: 'text-amber-400',   bg: 'bg-amber-500/10  border-amber-500/20',   label: 'Pendente' },
    processing: { icon: RefreshCw,    color: 'text-blue-400',    bg: 'bg-blue-500/10   border-blue-500/20',    label: 'Processando' },
    done:       { icon: CheckCircle,  color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', label: 'Concluído' },
    error:      { icon: XCircle,      color: 'text-rose-400',    bg: 'bg-rose-500/10   border-rose-500/20',    label: 'Erro' },
  }[status]
  const Icon = config.icon
  return (
    <span className={cn('flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium', config.bg, config.color)}>
      <Icon className={cn('w-3 h-3', status === 'processing' && 'animate-spin')} />
      {config.label}
    </span>
  )
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// ─── Category map ─────────────────────────────────────────────────────────────

const CAT_MAP: Record<string, { icon: string; color: string }> = {
  'Alimentação': { icon: '🍽️', color: '#4ADE80' },
  'Transporte':  { icon: '🚗', color: '#FB923C' },
  'Moradia':     { icon: '🏠', color: '#60A5FA' },
  'Saúde':       { icon: '🏥', color: '#F87171' },
  'Educação':    { icon: '🎓', color: '#A78BFA' },
  'Lazer':       { icon: '🎮', color: '#FBBF24' },
  'Assinatura':  { icon: '📱', color: '#34D399' },
  'Transferência': { icon: '💸', color: '#818CF8' },
  'Outros':      { icon: '📦', color: '#94A3B8' },
}

function getCatInfo(cat: string) {
  return CAT_MAP[cat] ?? { icon: '📦', color: '#94A3B8' }
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function DocumentosPage() {
  const { user } = useAuth()

  // Documents persisted in localStorage per user
  const [documents, setDocuments] = useUserStorage<StoredDoc[]>('finai_documents', [])
  const [dragging, setDragging] = useState(false)
  const [reviewDoc, setReviewDoc] = useState<StoredDoc | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  // Real accounts & transactions from localStorage
  const [accounts, setAccounts] = useUserStorage<Account[]>('finai_accounts', [])
  const [transactions, setTransactions] = useUserStorage<Transaction[]>('finai_transactions', [])

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 4000)
  }

  const processFile = useCallback(async (file: File) => {
    const docId = `d${Date.now()}-${Math.random().toString(36).slice(2)}`
    const newDoc: StoredDoc = {
      id: docId,
      filename: file.name,
      type: 'invoice',
      status: 'processing',
      uploadedAt: new Date().toISOString(),
      fileSize: file.size,
    }

    setDocuments(prev => [newDoc, ...prev])

    try {
      const fd = new FormData()
      fd.append('file', file)

      const res = await fetch('/api/documents/analyze', { method: 'POST', body: fd })
      const json = await res.json()

      if (!res.ok || !json.success) {
        setDocuments(prev => prev.map(d => d.id === docId ? { ...d, status: 'error' } : d))
        return
      }

      const result: AnalysisResult = json.data
      const bankInfo = getBankInfo(result.bank ?? 'Banco')

      const updated: StoredDoc = {
        ...newDoc,
        status: 'done',
        institution: bankInfo.name,
        txCount: result.transactions?.length ?? 0,
        processedAt: new Date().toISOString(),
        analysisResult: result,
      }

      setDocuments(prev => prev.map(d => d.id === docId ? updated : d))

      // Open review modal
      setReviewDoc(updated)
    } catch {
      setDocuments(prev => prev.map(d => d.id === docId ? { ...d, status: 'error' } : d))
    }
  }, [setDocuments])

  const handleFiles = useCallback((files: File[]) => {
    const valid = files.filter(f =>
      ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'image/webp'].includes(f.type)
    )
    valid.forEach(f => processFile(f))
  }, [processFile])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    handleFiles(Array.from(e.dataTransfer.files))
  }, [handleFiles])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(Array.from(e.target.files || []))
    // Reset input so same file can be re-uploaded
    e.target.value = ''
  }

  const deleteDoc = (id: string) => {
    setDocuments(prev => prev.filter(d => d.id !== id))
    if (reviewDoc?.id === id) setReviewDoc(null)
  }

  // Import confirmed transactions
  const confirmImport = () => {
    if (!reviewDoc?.analysisResult || !user) return
    const result = reviewDoc.analysisResult
    const bankInfo = getBankInfo(result.bank ?? 'Banco')

    // Find or create account
    let accountId: string
    const existing = accounts.find(a =>
      a.institution.toLowerCase().includes((result.bank ?? '').toLowerCase()) ||
      (result.bank ?? '').toLowerCase().includes(a.institution.toLowerCase())
    )

    if (existing) {
      accountId = existing.id
    } else {
      const newAcc: Account = {
        id: `acc-${Date.now()}`,
        name: bankInfo.name,
        institution: bankInfo.name,
        type: (result.accountType as Account['type']) ?? 'checking',
        balance: result.closingBalance ?? 0,
        color: bankInfo.color,
        gradient: bankInfo.gradient,
        logo: bankInfo.logo,
        lastSync: new Date().toISOString(),
      }
      setAccounts(prev => [...prev, newAcc])
      accountId = newAcc.id
      showToast(`Conta "${bankInfo.name}" criada e ${result.transactions.length} transações importadas!`)
    }

    // Import transactions
    const newTxs: Transaction[] = (result.transactions ?? []).map((t, i) => {
      const catInfo = getCatInfo(t.category)
      return {
        id: `tx-${Date.now()}-${i}`,
        accountId,
        description: t.description,
        amount: t.type === 'debit' ? -Math.abs(t.amount) : Math.abs(t.amount),
        type: t.type === 'credit' ? 'credit' : 'debit',
        category: t.category || 'Outros',
        categoryIcon: catInfo.icon,
        categoryColor: catInfo.color,
        date: t.date,
      }
    })

    setTransactions(prev => [...newTxs, ...prev])

    if (existing) {
      showToast(`${result.transactions.length} transações importadas para "${bankInfo.name}"!`)
    }

    // Clear analysisResult from stored doc (save space)
    setDocuments(prev => prev.map(d =>
      d.id === reviewDoc.id ? { ...d, analysisResult: undefined } : d
    ))
    setReviewDoc(null)
  }

  const done       = documents.filter(d => d.status === 'done')
  const processing = documents.filter(d => d.status === 'processing')
  const pending    = documents.filter(d => d.status === 'pending')
  const errors     = documents.filter(d => d.status === 'error')

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-4xl mx-auto">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 px-4 py-3 rounded-xl bg-emerald-500/15 border border-emerald-500/25 text-sm text-emerald-300 shadow-xl animate-slide-up max-w-sm">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Documentos Financeiros</h1>
          <p className="text-sm text-slate-500 mt-0.5">Upload de faturas e extratos para leitura automática com IA</p>
        </div>
        <span className="text-xs text-slate-500">{done.length} processados · {processing.length} processando</span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Processados', value: done.length,       color: '#10b981', sub: `${done.reduce((s, d) => s + (d.txCount || 0), 0)} transações extraídas` },
          { label: 'Processando', value: processing.length, color: '#3b82f6', sub: 'IA lendo agora' },
          { label: 'Pendentes',   value: pending.length,    color: '#f59e0b', sub: 'na fila' },
          { label: 'Com erro',    value: errors.length,     color: '#f43f5e', sub: 'reprocessar' },
        ].map(({ label, value, color, sub }) => (
          <div key={label} className="rounded-2xl bg-[#16161E] border border-white/[0.06] p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">{label}</p>
            <p className="text-3xl font-bold" style={{ color }}>{value}</p>
            <p className="text-xs text-slate-600 mt-1">{sub}</p>
          </div>
        ))}
      </div>

      {/* Drop zone */}
      <label
        className={cn(
          'relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed py-12 px-6 cursor-pointer transition-all duration-200',
          dragging
            ? 'border-primary-500/60 bg-primary-500/10 shadow-glow-sm'
            : 'border-white/[0.10] bg-white/[0.02] hover:border-primary-500/30 hover:bg-white/[0.04]'
        )}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.webp"
          multiple
          className="absolute inset-0 opacity-0 cursor-pointer"
          onChange={handleFileInput}
        />

        <div className={cn(
          'w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-all duration-200',
          dragging ? 'bg-primary-500/25 scale-110' : 'bg-primary-500/10'
        )}>
          <Upload className={cn('w-8 h-8 transition-colors', dragging ? 'text-primary-400' : 'text-primary-500/60')} />
        </div>

        <p className="text-base font-semibold text-white mb-1">
          {dragging ? 'Solte aqui para fazer upload' : 'Arraste arquivos ou clique para selecionar'}
        </p>
        <p className="text-sm text-slate-500 text-center max-w-sm">
          PDF, PNG, JPG, WEBP • A IA extrai e categoriza todas as transações automaticamente
        </p>

        {/* Detected banks — show user's real accounts, or hint text if none */}
        <div className="flex items-center gap-3 mt-5 flex-wrap justify-center">
          {accounts.length > 0 ? (
            accounts.map(acc => (
              <div key={acc.id} className="flex items-center gap-1.5">
                <div
                  className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold text-white"
                  style={{ background: acc.color }}
                >
                  {acc.logo}
                </div>
                <span className="text-xs text-slate-500">{acc.institution}</span>
              </div>
            ))
          ) : (
            <span className="text-xs text-slate-600">
              Nubank, Itaú, Sicoob, Sicredi e outros detectados automaticamente
            </span>
          )}
        </div>
      </label>

      {/* Documents list */}
      {documents.length > 0 && (
        <div className="rounded-2xl bg-[#16161E] border border-white/[0.06] shadow-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
            <h3 className="text-sm font-semibold text-white">Documentos enviados</h3>
            <span className="text-xs text-slate-500">{documents.length} arquivo{documents.length !== 1 ? 's' : ''}</span>
          </div>

          <div className="divide-y divide-white/[0.04]">
            {documents.map(doc => {
              const bankInfo = getBankInfo(doc.institution ?? '')
              const instColor = doc.institution ? bankInfo.color : '#8b5cf6'
              return (
                <div key={doc.id} className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors">
                  <div className="w-10 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-rose-400" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-slate-200 truncate">{doc.filename}</p>
                      {doc.institution && (
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0"
                          style={{ background: `${instColor}25`, color: instColor }}
                        >
                          {doc.institution}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="text-xs text-slate-500">
                        {doc.status === 'done' && doc.processedAt
                          ? `Processado ${formatDate(doc.processedAt.slice(0, 10), 'short')}`
                          : `Enviado ${formatDate(doc.uploadedAt.slice(0, 10), 'short')}`}
                      </span>
                      <span className="text-xs text-slate-600">{formatSize(doc.fileSize)}</span>
                      {doc.txCount !== undefined && (
                        <span className="text-xs text-emerald-400">{doc.txCount} transações</span>
                      )}
                    </div>
                  </div>

                  <StatusBadge status={doc.status} />

                  <div className="flex items-center gap-1">
                    {doc.status === 'done' && doc.analysisResult && (
                      <button
                        onClick={() => setReviewDoc(doc)}
                        className="px-3 py-1.5 rounded-lg bg-primary-500/10 text-xs text-primary-400 hover:bg-primary-500/20 transition-all flex-shrink-0"
                      >
                        Revisar
                      </button>
                    )}
                    {doc.status === 'error' && (
                      <span className="text-[10px] text-rose-400/60 px-2">Falha no processamento</span>
                    )}
                    <button
                      onClick={() => deleteDoc(doc.id)}
                      className="w-8 h-8 rounded-lg hover:bg-rose-500/10 flex items-center justify-center text-slate-600 hover:text-rose-400 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Review modal */}
      {reviewDoc?.analysisResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setReviewDoc(null)} />
          <div className="relative w-full max-w-2xl bg-[#16161E] border border-white/[0.10] rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06] flex-shrink-0">
              <div className="flex items-center gap-3">
                {(() => {
                  const bi = getBankInfo(reviewDoc.analysisResult!.bank ?? '')
                  return (
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                      style={{ background: `linear-gradient(135deg, ${bi.color}, ${bi.color}88)` }}
                    >
                      {bi.logo}
                    </div>
                  )
                })()}
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    {reviewDoc.analysisResult.bank ?? 'Extrato'} — {reviewDoc.analysisResult.period ?? 'sem período'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {reviewDoc.analysisResult.transactions.length} transações encontradas
                    {reviewDoc.analysisResult.accountHolder ? ` • ${reviewDoc.analysisResult.accountHolder}` : ''}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setReviewDoc(null)}
                className="w-7 h-7 rounded-lg hover:bg-white/[0.08] flex items-center justify-center text-slate-500 hover:text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Transactions table */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-1">
              {reviewDoc.analysisResult.transactions.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-8">Nenhuma transação extraída</p>
              ) : (
                reviewDoc.analysisResult.transactions.map((tx, i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.03] transition-colors">
                    <div className={cn(
                      'w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0',
                      tx.type === 'credit' ? 'bg-emerald-500/15' : 'bg-rose-500/15'
                    )}>
                      {tx.type === 'credit'
                        ? <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
                        : <ArrowDownRight className="w-3.5 h-3.5 text-rose-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-200 truncate">{tx.description}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-slate-500">{tx.date}</span>
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded-full"
                          style={{
                            background: `${getCatInfo(tx.category).color}18`,
                            color: getCatInfo(tx.category).color,
                          }}
                        >
                          {getCatInfo(tx.category).icon} {tx.category}
                        </span>
                      </div>
                    </div>
                    <p className={cn(
                      'text-sm font-semibold tabular-nums flex-shrink-0',
                      tx.type === 'credit' ? 'text-emerald-400' : 'text-rose-400'
                    )}>
                      {tx.type === 'credit' ? '+' : '-'}R$ {tx.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Modal footer */}
            <div className="px-5 py-4 border-t border-white/[0.06] flex gap-3 flex-shrink-0">
              <button
                onClick={() => setReviewDoc(null)}
                className="flex-1 py-2.5 rounded-xl bg-white/[0.04] text-sm text-slate-400 hover:text-slate-200 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={confirmImport}
                className="flex-1 py-2.5 rounded-xl btn-primary text-sm font-medium"
              >
                Confirmar e importar {reviewDoc.analysisResult.transactions.length} transações
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
