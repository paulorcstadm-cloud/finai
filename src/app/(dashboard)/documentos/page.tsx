'use client'

import { useState, useCallback } from 'react'
import { Upload, FileText, CheckCircle, XCircle, Clock, RefreshCw, Download, Trash2, Eye } from 'lucide-react'
import { cn, formatDate } from '@/lib/utils'
import { DOCUMENTS } from '@/lib/mock-data'
import type { Document, DocumentStatus } from '@/lib/types'

function StatusBadge({ status }: { status: DocumentStatus }) {
  const config = {
    pending:    { icon: Clock,        color: 'text-amber-400',  bg: 'bg-amber-500/10  border-amber-500/20',  label: 'Pendente' },
    processing: { icon: RefreshCw,    color: 'text-blue-400',   bg: 'bg-blue-500/10   border-blue-500/20',   label: 'Processando' },
    done:       { icon: CheckCircle,  color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', label: 'Concluído' },
    error:      { icon: XCircle,      color: 'text-rose-400',   bg: 'bg-rose-500/10   border-rose-500/20',   label: 'Erro' },
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

export default function DocumentosPage() {
  const [documents, setDocuments] = useState<Document[]>(DOCUMENTS)
  const [dragging, setDragging] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const files = Array.from(e.dataTransfer.files).filter(f => f.type === 'application/pdf')
    if (!files.length) return

    const newDocs: Document[] = files.map(f => ({
      id: `d${Date.now()}-${Math.random()}`,
      filename: f.name,
      type: 'invoice' as const,
      status: 'pending' as const,
      uploadedAt: new Date().toISOString(),
      fileSize: f.size,
    }))

    setDocuments(prev => [...newDocs, ...prev])

    // Simulate processing
    newDocs.forEach(doc => {
      setTimeout(() => {
        setDocuments(prev => prev.map(d => d.id === doc.id ? { ...d, status: 'processing' } : d))
      }, 1000)
      setTimeout(() => {
        setDocuments(prev => prev.map(d => d.id === doc.id ? {
          ...d,
          status: 'done',
          txCount: Math.floor(Math.random() * 30) + 5,
          processedAt: new Date().toISOString(),
        } : d))
      }, 4000)
    })
  }, [])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter(f => f.type === 'application/pdf')
    if (!files.length) return
    const newDocs: Document[] = files.map(f => ({
      id: `d${Date.now()}-${Math.random()}`,
      filename: f.name,
      type: 'invoice' as const,
      status: 'pending' as const,
      uploadedAt: new Date().toISOString(),
      fileSize: f.size,
    }))
    setDocuments(prev => [...newDocs, ...prev])
  }

  const deleteDoc = (id: string) => {
    setDocuments(prev => prev.filter(d => d.id !== id))
    if (selected === id) setSelected(null)
  }

  const done = documents.filter(d => d.status === 'done')
  const processing = documents.filter(d => d.status === 'processing')
  const pending = documents.filter(d => d.status === 'pending')
  const errors = documents.filter(d => d.status === 'error')

  const INST_COLORS: Record<string, string> = {
    Nubank: '#8a05be',
    Itaú: '#ec7000',
    Sicoob: '#1a5f3a',
    Sicredi: '#006b3f',
  }

  return (
    <div className="p-6 space-y-6 max-w-[1200px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Documentos Financeiros</h1>
          <p className="text-sm text-slate-500 mt-0.5">Upload de faturas e extratos para leitura automática com IA</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500">{done.length} processados · {processing.length} processando</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Processados', value: done.length, color: '#10b981', sub: `${done.reduce((s, d) => s + (d.txCount || 0), 0)} transações extraídas` },
          { label: 'Processando', value: processing.length, color: '#3b82f6', sub: 'IA lendo agora' },
          { label: 'Pendentes', value: pending.length, color: '#f59e0b', sub: 'na fila' },
          { label: 'Com erro', value: errors.length, color: '#f43f5e', sub: 'reprocessar' },
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
        <input type="file" accept=".pdf" multiple className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileInput} />

        <div className={cn(
          'w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-all duration-200',
          dragging ? 'bg-primary-500/25 scale-110' : 'bg-primary-500/10'
        )}>
          <Upload className={cn('w-8 h-8 transition-colors', dragging ? 'text-primary-400' : 'text-primary-500/60')} />
        </div>

        <p className="text-base font-semibold text-white mb-1">
          {dragging ? 'Solte aqui para fazer upload' : 'Arraste PDFs ou clique para selecionar'}
        </p>
        <p className="text-sm text-slate-500 text-center max-w-sm">
          Faturas, extratos, notas fiscais • A IA extrai e categoriza todas as transações automaticamente
        </p>

        <div className="flex items-center gap-4 mt-5">
          {['Nubank', 'Itaú', 'Sicoob', 'Sicredi'].map(bank => (
            <div key={bank} className="flex items-center gap-1.5">
              <div
                className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold text-white"
                style={{ background: INST_COLORS[bank] }}
              >
                {bank.slice(0, 2).toUpperCase()}
              </div>
              <span className="text-xs text-slate-500">{bank}</span>
            </div>
          ))}
        </div>
      </label>

      {/* Documents list */}
      <div className="rounded-2xl bg-[#16161E] border border-white/[0.06] shadow-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <h3 className="text-sm font-semibold text-white">Todos os documentos</h3>
          <span className="text-xs text-slate-500">{documents.length} arquivos</span>
        </div>

        <div className="divide-y divide-white/[0.04]">
          {documents.map(doc => {
            const instColor = doc.institution ? INST_COLORS[doc.institution] : '#8b5cf6'
            return (
              <div
                key={doc.id}
                className={cn(
                  'flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors cursor-pointer',
                  selected === doc.id && 'bg-primary-500/5'
                )}
                onClick={() => setSelected(doc.id === selected ? null : doc.id)}
              >
                <div className="w-10 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-rose-400" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-slate-200 truncate">{doc.filename}</p>
                    {doc.institution && (
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full font-medium text-white flex-shrink-0"
                        style={{ background: `${instColor}30`, color: instColor }}
                      >
                        {doc.institution}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-slate-500">
                      {doc.status === 'done' && doc.processedAt
                        ? `Processado ${formatDate(doc.processedAt.slice(0, 10), 'short')}`
                        : `Enviado ${formatDate(doc.uploadedAt.slice(0, 10), 'short')}`}
                    </span>
                    <span className="text-xs text-slate-600">{formatSize(doc.fileSize)}</span>
                    {doc.txCount && (
                      <span className="text-xs text-emerald-400">{doc.txCount} transações</span>
                    )}
                  </div>
                </div>

                <StatusBadge status={doc.status} />

                <div className="flex items-center gap-1">
                  <button
                    className="w-8 h-8 rounded-lg hover:bg-white/[0.06] flex items-center justify-center text-slate-500 hover:text-slate-300 transition-all"
                    onClick={e => e.stopPropagation()}
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button
                    className="w-8 h-8 rounded-lg hover:bg-white/[0.06] flex items-center justify-center text-slate-500 hover:text-slate-300 transition-all"
                    onClick={e => e.stopPropagation()}
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); deleteDoc(doc.id) }}
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
    </div>
  )
}
