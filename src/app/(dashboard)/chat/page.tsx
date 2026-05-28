'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { Send, Sparkles, RefreshCw, Trash2, Copy, Check } from 'lucide-react'
import { cn, formatCurrency, calculateFinancialScore } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { useUserStorage } from '@/hooks/useUserStorage'
import type { ChatMessage, Account, Transaction, Goal, Bill, Subscription, Alert } from '@/lib/types'

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3 rounded-2xl rounded-bl-sm bg-[#16161E] border border-white/[0.06] w-fit">
      {[0, 1, 2].map(i => <div key={i} className="typing-dot" style={{ animationDelay: `${i * 0.2}s` }} />)}
    </div>
  )
}

function MessageContent({ content }: { content: string }) {
  const lines = content.split('\n')
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-1.5" />
        const parts = line.split(/(\*\*[^*]+\*\*)/g)
        return (
          <p key={i} className="text-[15px] leading-relaxed">
            {parts.map((part, j) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={j} className="text-white font-semibold">{part.slice(2, -2)}</strong>
              }
              return <span key={j}>{part}</span>
            })}
          </p>
        )
      })}
    </div>
  )
}

export default function ChatPage() {
  const { user } = useAuth()

  // ── Real financial data from localStorage ────────────────────────────────────
  const [accounts] = useUserStorage<Account[]>('finai_accounts', [])
  const [transactions] = useUserStorage<Transaction[]>('finai_transactions', [])
  const [goals] = useUserStorage<Goal[]>('finai_goals', [])
  const [bills] = useUserStorage<Bill[]>('finai_bills', [])
  const [subscriptions] = useUserStorage<Subscription[]>('finai_subscriptions', [])
  const [alerts] = useUserStorage<Alert[]>('finai_alerts', [])
  const [income] = useUserStorage<number>('finai_income', 0)

  const now = new Date()
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const totalBalance = useMemo(
    () => accounts.reduce((s, a) => s + a.balance, 0),
    [accounts]
  )

  const monthExpenses = useMemo(
    () => transactions
      .filter(t => t.type === 'debit' && t.date.startsWith(currentMonth))
      .reduce((s, t) => s + Math.abs(t.amount), 0),
    [transactions, currentMonth]
  )

  const subscriptionsMonthly = useMemo(
    () => subscriptions
      .filter(s => s.isActive)
      .reduce((sum, s) => {
        if (s.billingCycle === 'monthly') return sum + s.amount
        if (s.billingCycle === 'yearly') return sum + s.amount / 12
        if (s.billingCycle === 'weekly') return sum + s.amount * 4
        return sum
      }, 0),
    [subscriptions]
  )

  const unreadAlerts = useMemo(
    () => alerts.filter(a => !a.isRead).length,
    [alerts]
  )

  const savingsRate = income > 0
    ? Math.max(0, Math.round(((income - monthExpenses) / income) * 100))
    : 0

  const liveScore = useMemo(() =>
    calculateFinancialScore({ income, monthExpenses, totalBalance, accounts, goals, bills })
    ?? (user?.score ?? 742),
    [income, monthExpenses, totalBalance, accounts, goals, bills, user?.score]
  )

  const hasData = accounts.length > 0 || transactions.length > 0 || goals.length > 0

  // Build financial context to send with each message
  const financialContext = useMemo(() => ({
    totalBalance,
    income,
    monthExpenses,
    savingsRate,
    score: liveScore,
    unreadAlerts,
    accounts: accounts.map(a => ({ institution: a.institution, balance: a.balance, type: a.type })),
    goals: goals
      .filter(g => g.status === 'active')
      .map(g => ({
        name: g.name,
        current: g.currentAmount,
        target: g.targetAmount,
        pct: g.targetAmount > 0 ? Math.round((g.currentAmount / g.targetAmount) * 100) : 0,
        deadline: g.deadline,
      })),
    pendingBills: bills
      .filter(b => b.status === 'pending')
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
      .slice(0, 5)
      .map(b => ({ name: b.name, amount: b.amount, dueDate: b.dueDate })),
    subscriptionsMonthly,
    hasData,
  }), [totalBalance, income, monthExpenses, savingsRate, liveScore, unreadAlerts, accounts, goals, bills, subscriptionsMonthly, hasData])

  // ── Chat state ───────────────────────────────────────────────────────────────

  const initialMessages = useMemo((): ChatMessage[] => [{
    id: 'init-1',
    role: 'assistant',
    content: user?.cfoIntro ?? `Olá! 👋 Sou o **CFO IA** — seu assistente financeiro pessoal. Como posso ajudar você hoje?`,
    createdAt: new Date().toISOString(),
  }], [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const sendMessage = async (text: string) => {
    if (!text.trim() || isTyping) return
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text.trim(),
      createdAt: new Date().toISOString(),
    }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsTyping(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
          userId: user?.id,
          financialContext,
        }),
      })
      const data = await res.json()
      const responseText = data.content || 'Não consegui processar sua mensagem. Tente novamente.'
      setIsTyping(false)
      setMessages(prev => [...prev, {
        id: `msg-${Date.now()}-ai`,
        role: 'assistant',
        content: responseText,
        createdAt: new Date().toISOString(),
      }])
    } catch {
      await new Promise(r => setTimeout(r, 1000))
      setIsTyping(false)
      setMessages(prev => [...prev, {
        id: `msg-${Date.now()}-ai`,
        role: 'assistant',
        content: 'Erro de conexão. Verifique sua internet e tente novamente.',
        createdAt: new Date().toISOString(),
      }])
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) }
  }

  const copyMessage = (id: string, content: string) => {
    navigator.clipboard.writeText(content)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const clearChat = () => setMessages(initialMessages)

  // ── Header stats — real data ──────────────────────────────────────────────────
  const headerStats = [
    { label: 'Saldo', value: formatCurrency(totalBalance), color: 'text-slate-300' },
    { label: 'Score', value: `${liveScore}`, color: liveScore >= 750 ? 'text-emerald-400' : liveScore >= 600 ? 'text-amber-400' : 'text-rose-400' },
    { label: 'Alertas', value: String(unreadAlerts), color: unreadAlerts > 0 ? 'text-rose-400' : 'text-slate-400' },
  ]

  const quickPrompts = user?.quickPrompts ?? []

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-white/[0.06] bg-[#09090F]/95 backdrop-blur-sm flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-glow-sm">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-white">CFO IA — FinAI</h1>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-emerald-400">
                Online • {hasData ? 'Dados carregados' : 'Adicione seus dados para análise personalizada'}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-4 text-xs text-slate-500 mr-4">
            {headerStats.map(s => (
              <span key={s.label}>{s.label}: <strong className={s.color}>{s.value}</strong></span>
            ))}
          </div>
          <button
            onClick={clearChat}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] text-sm text-slate-400 hover:text-slate-200 hover:bg-white/[0.08] transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />Limpar
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-4">
        {messages.map(msg => (
          <div key={msg.id} className={cn('flex gap-3 animate-slide-up', msg.role === 'user' ? 'flex-row-reverse' : 'flex-row')}>
            <div className={cn(
              'w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5',
              msg.role === 'user'
                ? 'bg-gradient-to-br from-slate-600 to-slate-700'
                : 'bg-gradient-to-br from-primary-500 to-primary-700 shadow-glow-sm'
            )}>
              {msg.role === 'user'
                ? <span className="text-xs font-bold text-white">{user?.avatar ?? 'U'}</span>
                : <Sparkles className="w-4 h-4 text-white" />}
            </div>
            <div className={cn('max-w-[80%] group', msg.role === 'user' ? 'items-end' : 'items-start')}>
              <div className={cn(
                'px-4 py-3 rounded-2xl',
                msg.role === 'user'
                  ? 'bg-primary-600/80 text-white rounded-br-sm'
                  : 'bg-[#16161E] border border-white/[0.06] text-slate-300 rounded-bl-sm'
              )}>
                {msg.role === 'assistant'
                  ? <MessageContent content={msg.content} />
                  : <p className="text-[15px] leading-relaxed">{msg.content}</p>}
              </div>
              <div className={cn(
                'flex items-center gap-2 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity',
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              )}>
                <span className="text-[10px] text-slate-600">
                  {new Date(msg.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
                {msg.role === 'assistant' && (
                  <button
                    onClick={() => copyMessage(msg.id, msg.content)}
                    className="flex items-center gap-1 text-[10px] text-slate-600 hover:text-slate-400 transition-colors"
                  >
                    {copiedId === msg.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copiedId === msg.id ? 'Copiado' : 'Copiar'}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex gap-3 animate-fade-in">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center flex-shrink-0 shadow-glow-sm">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <TypingIndicator />
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick prompts */}
      {messages.length <= 1 && quickPrompts.length > 0 && (
        <div className="px-4 sm:px-6 pb-3 flex-shrink-0">
          <p className="text-xs text-slate-600 mb-2 ml-1">Sugestões de perguntas</p>
          <div className="flex flex-wrap gap-2">
            {quickPrompts.map(({ label, prompt }) => (
              <button
                key={label}
                onClick={() => sendMessage(prompt)}
                className="px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-xs text-slate-400 hover:text-slate-200 hover:border-primary-500/30 hover:bg-primary-500/5 transition-all"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-4 sm:px-6 pb-6 pt-3 border-t border-white/[0.06] bg-[#09090F]/95 backdrop-blur-sm flex-shrink-0">
        <div className="relative flex items-end gap-3 p-3 rounded-2xl bg-[#16161E] border border-white/[0.08] focus-within:border-primary-500/40 focus-within:shadow-glow-sm transition-all">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Pergunte sobre suas finanças... (Enter para enviar)"
            rows={1}
            className="flex-1 bg-transparent text-[15px] text-slate-200 placeholder-slate-600 resize-none focus:outline-none max-h-32 py-0.5"
            style={{ lineHeight: '1.5' }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isTyping}
            className={cn(
              'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all',
              input.trim() && !isTyping
                ? 'bg-primary-600 text-white shadow-glow-sm hover:bg-primary-500'
                : 'bg-white/[0.06] text-slate-600 cursor-not-allowed'
            )}
          >
            {isTyping ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-[10px] text-slate-700 mt-2 text-center">
          FinAI usa seus dados financeiros reais • Shift+Enter para nova linha
        </p>
      </div>
    </div>
  )
}
