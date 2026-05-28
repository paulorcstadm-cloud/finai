import { NextRequest, NextResponse } from 'next/server'

// ─── Types ────────────────────────────────────────────────────────────────────

interface FinancialContext {
  totalBalance: number
  income: number
  monthExpenses: number
  savingsRate: number
  score: number
  unreadAlerts: number
  accounts: { institution: string; balance: number; type: string }[]
  goals: { name: string; current: number; target: number; pct: number; deadline: string }[]
  pendingBills: { name: string; amount: number; dueDate: string }[]
  subscriptionsMonthly: number
  hasData: boolean
}

// ─── Dynamic system prompt ────────────────────────────────────────────────────

function buildSystemPrompt(ctx: FinancialContext): string {
  const fmt = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
  const now = new Date()
  const monthLabel = now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  if (!ctx.hasData) {
    return `Você é CFO IA, o assistente financeiro pessoal integrado ao FinAI.

O usuário ainda não cadastrou contas, transações ou metas no sistema.
Oriente-o a:
1. Ir em "Contas" para cadastrar suas contas bancárias
2. Adicionar transações manualmente ou importar extratos em "Documentos"
3. Criar metas em "Metas"
Seja simpático e encorajador. Responda SEMPRE em português brasileiro.`
  }

  const accountsStr = ctx.accounts.length > 0
    ? ctx.accounts.map(a => `  - ${a.institution} (${a.type}): ${fmt(a.balance)}`).join('\n')
    : '  - Nenhuma conta cadastrada'

  const goalsStr = ctx.goals.length > 0
    ? ctx.goals.map(g => `  - ${g.name}: ${g.pct}% (${fmt(g.current)} / ${fmt(g.target)}) → prazo: ${g.deadline}`).join('\n')
    : '  - Nenhuma meta ativa'

  const billsStr = ctx.pendingBills.length > 0
    ? ctx.pendingBills.slice(0, 5).map(b => `  - ${b.name}: ${fmt(b.amount)} (vence ${b.dueDate})`).join('\n')
    : '  - Nenhuma conta a pagar pendente'

  return `Você é CFO IA, o assistente financeiro pessoal integrado ao FinAI.

═══ DADOS FINANCEIROS REAIS DO USUÁRIO — ${monthLabel.toUpperCase()} ═══

💰 RESUMO:
  Saldo total: ${fmt(ctx.totalBalance)}
  Renda mensal: ${fmt(ctx.income)}
  Gastos do mês: ${fmt(ctx.monthExpenses)}
  Taxa de poupança: ${ctx.savingsRate}%
  Score FinAI: ${ctx.score}/1000
  Alertas não lidos: ${ctx.unreadAlerts}

🏦 CONTAS (${ctx.accounts.length}):
${accountsStr}

🎯 METAS ATIVAS:
${goalsStr}

📋 CONTAS A PAGAR PENDENTES:
${billsStr}

📱 ASSINATURAS: ${fmt(ctx.subscriptionsMonthly)}/mês

═══════════════════════════════════════════════

INSTRUÇÕES:
- Use APENAS os dados acima — nunca invente valores
- Responda SEMPRE em português brasileiro
- Seja direto, objetivo e acionável
- Use emojis com moderação
- Dê conselhos práticos e personalizados baseados nos dados reais
- Se o usuário perguntar algo que não tem dados disponíveis, diga isso claramente`
}

// ─── Dynamic fallback (no API key or API error) ───────────────────────────────

function getDynamicFallback(message: string, ctx: FinancialContext | null): string {
  if (!ctx || !ctx.hasData) {
    return `Olá! 👋 Para que eu possa te ajudar com análises personalizadas, primeiro cadastre suas contas e transações no sistema.\n\n**Como começar:**\n1. Vá em **Contas** → adicione suas contas bancárias\n2. Vá em **Documentos** → faça upload de um extrato PDF\n3. Vá em **Metas** → defina seus objetivos\n\nDepois disso, posso te dar insights reais! 🚀`
  }

  const fmt = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
  const lower = message.toLowerCase()

  if (/resumo|situação|como estou|visão geral|mês/i.test(lower)) {
    const economia = ctx.income - ctx.monthExpenses
    return `📊 **Resumo Financeiro:**

**Patrimônio:** ${fmt(ctx.totalBalance)} (${ctx.accounts.length} conta${ctx.accounts.length !== 1 ? 's' : ''})
**Gastos do mês:** ${fmt(ctx.monthExpenses)} (${ctx.savingsRate}% poupado)
**Economia:** ${fmt(Math.max(0, economia))}
**Score:** ${ctx.score}/1000

${ctx.goals.length > 0 ? `**Metas ativas:** ${ctx.goals.length}\n${ctx.goals.map(g => `• ${g.name}: ${g.pct}%`).join('\n')}` : ''}
${ctx.pendingBills.length > 0 ? `\n⚠️ **Contas pendentes:** ${ctx.pendingBills.length}\n${ctx.pendingBills.slice(0, 3).map(b => `• ${b.name}: ${fmt(b.amount)} (${b.dueDate})`).join('\n')}` : '\n✅ Nenhuma conta a pagar pendente'}

O que quer aprofundar?`
  }

  if (/cortar|economizar|reduzir|gasto/i.test(lower)) {
    return `✂️ **Como economizar mais:**

Gastos do mês: ${fmt(ctx.monthExpenses)} / Renda: ${fmt(ctx.income)}
Taxa de poupança atual: **${ctx.savingsRate}%**

${ctx.savingsRate >= 20 ? '✅ Você está poupando acima dos 20% recomendados — ótimo!' : '⚠️ Tente chegar em 20% de poupança.'}
${ctx.subscriptionsMonthly > 0 ? `\n📱 **Assinaturas:** ${fmt(ctx.subscriptionsMonthly)}/mês — revise se todas estão em uso.` : ''}
${ctx.pendingBills.length > 0 ? `\n📋 Você tem ${ctx.pendingBills.length} conta(s) a pagar — não deixe vencer para evitar juros.` : ''}

Quer analisar alguma categoria de gasto específica?`
  }

  if (/meta|objetivo|poupan/i.test(lower)) {
    if (ctx.goals.length === 0) {
      return `🎯 **Metas financeiras:**\n\nVocê ainda não tem metas cadastradas.\n\nAcesse **Metas** e crie seus objetivos financeiros — isso ajuda muito a manter o foco!\n\n💡 Dica: comece pela reserva de emergência (3-6 meses de despesas = ${fmt(ctx.monthExpenses * 4)} a ${fmt(ctx.monthExpenses * 6)}).`
    }
    return `🎯 **Suas metas ativas:**\n\n${ctx.goals.map(g => `**${g.name}**\nProgresso: ${g.pct}% → ${fmt(g.current)} / ${fmt(g.target)}\nPrazo: ${g.deadline}`).join('\n\n')}\n\nCom a economia atual de ${fmt(Math.max(0, ctx.income - ctx.monthExpenses))}/mês, continue aportando regularmente!`
  }

  if (/invest|aplicar|dinheiro parado/i.test(lower)) {
    return `💹 **Onde investir:**\n\nSaldo atual: ${fmt(ctx.totalBalance)}\n\nPrimeiro verifique se você tem:\n✅ Reserva de emergência (3-6 meses de gastos = ${fmt(ctx.monthExpenses * 3)} a ${fmt(ctx.monthExpenses * 6)})\n\n**Opções para começar:**\n1. **Tesouro Selic** — liquidez D+1, ~10,5% a.a.\n2. **CDB 100% CDI** — baixo risco, coberto pelo FGC\n3. **LCI/LCA** — isento de IR\n\nQual seu prazo e objetivo de investimento?`
  }

  if (/score|pontos|800/i.test(lower)) {
    return `📈 **Score FinAI: ${ctx.score}/1000**\n\n${ctx.score >= 800 ? '🟢 Excelente!' : ctx.score >= 650 ? '🟡 Bom' : ctx.score >= 500 ? '🟠 Regular' : '🔴 Atenção'}\n\n**Para melhorar seu score:**\n${ctx.savingsRate < 20 ? '• Aumente a taxa de poupança para 20%+\n' : '✅ Taxa de poupança boa\n'}${ctx.pendingBills.length > 0 ? `• Pague as ${ctx.pendingBills.length} conta(s) em atraso\n` : '✅ Sem contas em atraso\n'}${ctx.goals.length === 0 ? '• Cadastre metas financeiras\n' : '✅ Metas cadastradas\n'}${ctx.income > 0 && ctx.totalBalance / ctx.income < 3 ? '• Construa reserva de emergência (meta: 3+ meses)\n' : '✅ Reserva de emergência adequada\n'}`
  }

  // Generic fallback with real data
  return `Com base nos seus dados:\n\n💰 **Saldo total:** ${fmt(ctx.totalBalance)}\n📊 **Gastos do mês:** ${fmt(ctx.monthExpenses)}\n📈 **Score:** ${ctx.score}/1000\n\nComo posso te ajudar?\n• Resumo financeiro do mês\n• Onde cortar gastos\n• Análise das suas metas\n• Onde investir`
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const { messages, financialContext } = await req.json() as {
      messages: { role: string; content: string }[]
      financialContext?: FinancialContext
    }

    const lastMessage = messages[messages.length - 1]?.content || ''
    const ctx = financialContext ?? null

    const apiKey = process.env.ANTHROPIC_API_KEY

    if (!apiKey) {
      // Smart fallback without API key
      await new Promise(r => setTimeout(r, 800 + Math.random() * 1000))
      return NextResponse.json({ content: getDynamicFallback(lastMessage, ctx) })
    }

    // Real API call with dynamic system prompt
    const systemPrompt = buildSystemPrompt(ctx ?? {
      totalBalance: 0, income: 0, monthExpenses: 0, savingsRate: 0,
      score: 500, unreadAlerts: 0, accounts: [], goals: [],
      pendingBills: [], subscriptionsMonthly: 0, hasData: false,
    })

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        system: systemPrompt,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
      }),
    })

    if (!response.ok) {
      return NextResponse.json({ content: getDynamicFallback(lastMessage, ctx) })
    }

    const data = await response.json()
    const content = data.content?.[0]?.text || getDynamicFallback(lastMessage, ctx)
    return NextResponse.json({ content })

  } catch (err) {
    console.error('[chat/route] error:', err)
    return NextResponse.json(
      { content: 'Ocorreu um erro ao processar sua mensagem. Tente novamente.' },
      { status: 200 }
    )
  }
}
