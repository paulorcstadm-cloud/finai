'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { Send, Sparkles, RefreshCw, Trash2, Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import type { ChatMessage } from '@/lib/types'

const FALLBACK_RESPONSES_PAULO: Record<string, string> = {
  cortar: `**Onde cortar gastos — Análise de maio/2026** ✂️\n\nAnalisando seus gastos atuais:\n\n🔴 **Prioridade alta:**\n• Assinaturas inativas (Adobe Creative): R$ 249/ano sem uso\n\n🟡 **Considerar:**\n• Alimentação R$ 514,80 (+23% acima da média) — tente reduzir delivery\n• Parcelamentos R$ 512,25/mês — evite novos por ora\n\n✅ **Positivo:** Sua taxa de poupança está em 23% — acima dos 20% recomendados!\n\n**Ação imediata:** Cancele o Adobe Creative e economize R$ 20,75/mês.`,
  europa: `**Meta Viagem Europa 2027** ✈️\n\nProgresso atual: R$ 4.200 / R$ 25.000 (17%)\n\nCom R$ 800/mês de aporte:\n• Atingirá a meta em **~26 meses** → ago/2028\n\nPara ir em **junho/2027** (seu prazo), você precisaria de:\n• **R$ 1.733/mês** nos próximos 12 meses\n\n**Estratégia recomendada:**\n1. Mantenha R$ 800/mês na meta Europa\n2. Cancele assinaturas inativas (+R$ 21/mês)\n3. Reduza delivery em 30% (→ +R$ 154/mês)\n\nCom essas mudanças: meta atingida em **jan/2027** 🎯`,
  gabriel: `**Situação com Gabriel Henrique** 🤝\n\nSaldo líquido: **Gabriel te deve R$ 106,05**\n\nDetalhamento:\n📌 Gabriel deve a você:\n• Jantar restaurante: R$ 142,25\n• Combustível: R$ 90,00\n• Cinema: R$ 34,00\n• **Subtotal: R$ 266,25**\n\n📌 Você deve ao Gabriel:\n• Supermercado Giassi: R$ 160,20\n\n**Saldo final: +R$ 106,05 a seu favor**\n\nQuer que eu gere a mensagem de cobrança para o WhatsApp? Acesse a página Gabriel. 📱`,
  score: `**Como chegar em 800 no Score FinAI** 📈\n\nScore atual: **742** → Meta: 800 (+58 pontos)\n\nFatores para aumentar:\n1. ✅ **Pague a fatura Nubank** antes do vencimento (29/mai) — evita juros e melhora histórico (+8 pts)\n2. 📉 **Reduza utilização do cartão** abaixo de 30% do limite (+10 pts)\n3. 💰 **Mantenha reserva de emergência** acima de R$ 15k (+7 pts)\n4. 🔄 **Consistência nos aportes** das metas por 3 meses seguidos (+12 pts)\n5. ❌ **Cancele assinaturas inativas** — menos risco de inadimplência (+5 pts)\n\n**Prazo estimado para 800:** ~4-5 meses com disciplina`,
  investimento: `**Onde investir o dinheiro parado** 💹\n\nVocê tem R$ 8.420 na poupança Sicredi rendendo ~0,5% a.m.\n\n**Comparação de alternativas:**\n\n📊 **Tesouro Selic (SELIC ~10,75% a.a.)**\n• Risco: baixíssimo | Liquidez: D+1\n• Rendimento anual: ~R$ 905 vs R$ 505 da poupança\n\n📊 **CDB 100% CDI**\n• Risco: baixo (FGC até R$ 250k)\n• Rendimento: similar ao Tesouro Selic\n\n📊 **Tesouro IPCA+**\n• Proteção contra inflação + juro real\n• Ideal para objetivos de longo prazo\n\n**Minha recomendação:** Mantenha R$ 3k como reserva de emergência na poupança, e mova R$ 5k para Tesouro Selic.`,
  default: `Entendido! Baseado no seu perfil financeiro:\n\n💡 **Situação geral:** Você está indo bem — taxa de poupança de 23%, score 742.\n\n⚠️ **Atenção imediata:**\n• Fatura Nubank vence em 3 dias (R$ 1.240,87)\n\nPosso ajudar com análise de gastos, metas, situação com Gabriel ou sugestões de investimento. O que você gostaria de explorar?`,
}

const FALLBACK_RESPONSES_GABRIEL: Record<string, string> = {
  meta: `**Suas metas financeiras** 🎯\n\nVocê tem 3 metas ativas:\n\n🛡️ **Reserva de emergência**: R$ 2.500 / R$ 10.000 (25%)\n• Com R$ 400/mês: concluída em ~19 meses\n\n🚗 **Carro próprio**: R$ 3.200 / R$ 35.000 (9%)\n• Com R$ 600/mês: ~53 meses\n\n✈️ **Viagem Disney**: R$ 750 / R$ 8.000 (9%)\n• Com R$ 300/mês: ~24 meses\n\n**Minha recomendação:** Priorize a reserva de emergência primeiro — é sua rede de segurança.`,
  economizar: `**Como economizar mais este mês** ✂️\n\nAnalisando seu perfil:\n\n🔴 **Reduza delivery (iFood)**\n• Você gastou R$ 89,60 este mês\n• Meta: R$ 60/mês → economia de R$ 30\n\n🟡 **Otimize assinaturas**\n• Spotify + Netflix = R$ 77,80/mês\n• Considere plano familiar se possível\n\n✅ **Positivo:** Seu aluguel representa apenas 30% da renda — está dentro do ideal!\n\n**Potencial de economia:** R$ 80-120/mês com pequenos ajustes.`,
  fatura: `**Situação do cartão Nubank** 💳\n\nFatura atual: **R$ 487,50**\nVencimento: 05/jun/2026 (9 dias)\n\nLançamentos recentes:\n• iFood: R$ 89,60\n• Spotify: R$ 21,90\n• Netflix: R$ 55,90\n• Mercado: R$ 124,30\n\n✅ A fatura está dentro do esperado para seu perfil.\n\n**Atenção:** Pague em dia para manter o score e evitar juros de ~15% a.m.`,
  investimento: `**Onde investir com seu perfil** 💹\n\nSaldo disponível: **R$ 5.047,80**\nReserva de emergência recomendada: R$ 10.000\n\nPor isso você ainda **não está pronto** para investimentos de risco. Recomendo:\n\n1. 🛡️ **Prioridade:** Complete a reserva de emergência (faltam R$ 7.500)\n2. 💰 **Enquanto isso:** Guarde no CDB/Tesouro Selic (rende ~10,75% a.a. com liquidez diária)\n3. 📈 **Depois:** Com reserva completa, explore Tesouro IPCA+ e ações\n\n**Meta:** Construa primeiro a base sólida!`,
  default: `Olá, Gabriel! 👋 Baseado no seu perfil:\n\n💡 **Situação atual:** Você está no começo da jornada financeira — isso é ótimo!\n\n📊 **Destaques:**\n• Saldo total: R$ 5.047,80\n• Score: 685 (crescendo!)\n• Fatura OK: R$ 487,50 (vence em 9 dias)\n\n🎯 **Próximo passo recomendado:** Focar em construir sua reserva de emergência (R$ 10.000). Você já tem R$ 2.500 — continue!\n\nPosso ajudar com metas, orçamento, fatura ou estratégias de investimento. O que deseja explorar?`,
}

function getFallback(msg: string, isGabriel: boolean): string {
  const lower = msg.toLowerCase()
  if (isGabriel) {
    if (/meta|objetivo|economiz|poupar/i.test(lower)) return FALLBACK_RESPONSES_GABRIEL.meta
    if (/economizar|cortar|reduzir|gastar menos/i.test(lower)) return FALLBACK_RESPONSES_GABRIEL.economizar
    if (/fatura|cartão|nubank/i.test(lower)) return FALLBACK_RESPONSES_GABRIEL.fatura
    if (/invest|aplicar|dinheiro parado|renda/i.test(lower)) return FALLBACK_RESPONSES_GABRIEL.investimento
    return FALLBACK_RESPONSES_GABRIEL.default
  }
  if (/cortar|economiz|redu[zc]/i.test(lower)) return FALLBACK_RESPONSES_PAULO.cortar
  if (/europa|viagem|meta/i.test(lower)) return FALLBACK_RESPONSES_PAULO.europa
  if (/gabriel|deve|divis/i.test(lower)) return FALLBACK_RESPONSES_PAULO.gabriel
  if (/score|pontos|800/i.test(lower)) return FALLBACK_RESPONSES_PAULO.score
  if (/invest|aplicar|dinheiro parado/i.test(lower)) return FALLBACK_RESPONSES_PAULO.investimento
  return FALLBACK_RESPONSES_PAULO.default
}

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
  const isGabriel = user?.id === 'gabriel'

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
    const userMsg: ChatMessage = { id: `msg-${Date.now()}`, role: 'user', content: text.trim(), createdAt: new Date().toISOString() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsTyping(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })), userId: user?.id }),
      })
      const data = await res.json()
      const responseText = data.content || getFallback(text, isGabriel)
      setIsTyping(false)
      setMessages(prev => [...prev, { id: `msg-${Date.now()}-ai`, role: 'assistant', content: responseText, createdAt: new Date().toISOString() }])
    } catch {
      await new Promise(r => setTimeout(r, 1000 + Math.random() * 1000))
      setIsTyping(false)
      setMessages(prev => [...prev, { id: `msg-${Date.now()}-ai`, role: 'assistant', content: getFallback(text, isGabriel), createdAt: new Date().toISOString() }])
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

  // User-specific header stats
  const headerStats = isGabriel
    ? [
        { label: 'Saldo', value: 'R$ 5.047,80', color: 'text-slate-300' },
        { label: 'Score', value: '685', color: 'text-amber-400' },
        { label: 'Fatura', value: 'R$ 487,50', color: 'text-rose-400' },
      ]
    : [
        { label: 'Saldo', value: 'R$ 18.182,70', color: 'text-slate-300' },
        { label: 'Score', value: '742', color: 'text-amber-400' },
        { label: 'Alertas', value: '3', color: 'text-rose-400' },
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
              <span className="text-xs text-emerald-400">Online • Contexto de {user?.name ?? 'usuário'} carregado</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-4 text-xs text-slate-500 mr-4">
            {headerStats.map(s => (
              <span key={s.label}>{s.label}: <strong className={s.color}>{s.value}</strong></span>
            ))}
          </div>
          <button onClick={clearChat} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] text-sm text-slate-400 hover:text-slate-200 hover:bg-white/[0.08] transition-all">
            <Trash2 className="w-3.5 h-3.5" />Limpar
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-4">
        {messages.map(msg => (
          <div key={msg.id} className={cn('flex gap-3 animate-slide-up', msg.role === 'user' ? 'flex-row-reverse' : 'flex-row')}>
            <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5', msg.role === 'user' ? 'bg-gradient-to-br from-slate-600 to-slate-700' : 'bg-gradient-to-br from-primary-500 to-primary-700 shadow-glow-sm')}>
              {msg.role === 'user'
                ? <span className="text-xs font-bold text-white">{user?.avatar ?? 'U'}</span>
                : <Sparkles className="w-4 h-4 text-white" />}
            </div>
            <div className={cn('max-w-[80%] group', msg.role === 'user' ? 'items-end' : 'items-start')}>
              <div className={cn('px-4 py-3 rounded-2xl', msg.role === 'user' ? 'bg-primary-600/80 text-white rounded-br-sm' : 'bg-[#16161E] border border-white/[0.06] text-slate-300 rounded-bl-sm')}>
                {msg.role === 'assistant' ? <MessageContent content={msg.content} /> : <p className="text-[15px] leading-relaxed">{msg.content}</p>}
              </div>
              <div className={cn('flex items-center gap-2 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                <span className="text-[10px] text-slate-600">{new Date(msg.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                {msg.role === 'assistant' && (
                  <button onClick={() => copyMessage(msg.id, msg.content)} className="flex items-center gap-1 text-[10px] text-slate-600 hover:text-slate-400 transition-colors">
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
              <button key={label} onClick={() => sendMessage(prompt)}
                className="px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-xs text-slate-400 hover:text-slate-200 hover:border-primary-500/30 hover:bg-primary-500/5 transition-all">
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
            className={cn('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all',
              input.trim() && !isTyping ? 'bg-primary-600 text-white shadow-glow-sm hover:bg-primary-500' : 'bg-white/[0.06] text-slate-600 cursor-not-allowed'
            )}
          >
            {isTyping ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-[10px] text-slate-700 mt-2 text-center">FinAI usa seus dados financeiros reais • Shift+Enter para nova linha</p>
      </div>
    </div>
  )
}
