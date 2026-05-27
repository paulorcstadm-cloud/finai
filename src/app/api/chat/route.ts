import { NextRequest, NextResponse } from 'next/server'
import { AI_FINANCIAL_CONTEXT } from '@/lib/mock-data'

// Smart fallback responses when no API key is configured
const FALLBACK_RESPONSES: { pattern: RegExp; response: string }[] = [
  {
    pattern: /cortar|economizar|reduzir|gasto|economia/i,
    response: `✂️ **Onde cortar sem sentir — Maio 2026:**

1. **Assinaturas** (R$ 334/mês atual → R$ 197 possível):
   • Adobe Creative inativo: cancel = -R$ 20,75/mês
   • Avalie se usa ChatGPT + Spotify com a mesma intensidade

2. **Alimentação** (R$ 514 → meta R$ 400):
   • iFood consome ~20% do orçamento de comida
   • 3 jantares com Gabriel = R$ 284 só em maio

3. **Oportunidade imediata:** Gabriel te deve **R$ 106,05** — cobra essa semana via Pix (paulorcst.adm@gmail.com)!

💰 **Potencial:** R$ 137/mês → R$ 1.644/ano
Aplicado na meta Europa: chegaria **2 meses antes** do previsto!`,
  },
  {
    pattern: /europa|viagem|meta|metas/i,
    response: `✈️ **Projeção: Viagem Europa 2027**

📍 Situação atual: R$ 4.200 / R$ 25.000 (17%)
📅 Prazo: jun/2027 — 13 meses restantes

**Com R$ 800/mês:**
→ R$ 4.200 + (13 × 800) = R$ 14.600 ⚠️ Faltam R$ 10.400 — não chega!

**Cenários para atingir em jun/2027:**
1. **Com 13°:** R$ 4.200 + R$ ~4.200 (13°) + R$ 800 × 12 = R$ 18.000 → ainda faltam R$ 7.000
2. **Boost:** Precisa de R$ 1.600/mês — difícil com seus compromissos atuais
3. **Prazo flexível:** Com R$ 800/mês chega em **set/2027** (3 meses de atraso) ✅

💡 **Recomendação realista:** Flexibilize o prazo para set/2027 e aplique o 13° como aporte extra. Chega com sobra para passeios!`,
  },
  {
    pattern: /gabriel|deve|divisão|racha/i,
    response: `👥 **Divisão com Gabriel Henrique — 26/mai/2026:**

**Gabriel te deve:**
• 🍽️ Jantar Casa da Carne (21/mai): R$ 142,25
• ⛽ Combustível Balneário (25/mai): R$ 90,00
• 🎬 Cinema (12/mai): R$ 34,00
Subtotal: **R$ 266,25**

**Você deve pro Gabriel:**
• 🛒 Supermercado Giassi (24/mai): R$ 160,20

**Saldo líquido: Gabriel → Paulo: R$ 106,05** 💸

💡 **Mensagem sugerida:**
*"Brow, atualização do racha! Você me deve R$ 106,05 líquido. Pode mandar no Pix? Chave: paulorcst.adm@gmail.com 🤙"*

Esse valor entra direto no seu Sicredi!`,
  },
  {
    pattern: /score|pontos|800|avaliação/i,
    response: `🎯 **Plano para Score 800 (+58 pontos):**

**Atual: 742** → Meta: 800

Breakdown:
✅ Taxa de poupança: 85/100 (23% — excelente!)
✅ Organização: 78/100 (docs em dia)
⚠️ Dívidas ativas: 65/100 (consórcio + parcelamentos)
⚠️ Reserva emergência: 72/100 (64% da meta)
❌ Diversificação: 58/100 (tudo em conta/poupança)

**3 ações para +58 pontos:**
1. ✅ Complete o fundo de emergência → **+15 pts**
2. 💳 Quite os parcelamentos do Shopee → **+12 pts**
3. 📈 Invista R$ 100/mês em CDB/Tesouro → **+31 pts**

**Timeline:** Com disciplina, score 800 em ~5-6 meses.`,
  },
  {
    pattern: /invest|aplicar|sicredi|poupança|selic|cdb|tesouro/i,
    response: `📈 **Onde investir o dinheiro parado:**

Você tem R$ 8.420 no Sicredi (poupança) rendendo ~6,5% a.a. — abaixo da Selic de 10,5%!

**Opções melhores (sem sair da Sicredi):**
1. **RDC (Recibo de Depósito Cooperativo):** ~105% CDI → +3.500/ano vs poupança
2. **LCI/LCA:** Isento de IR, ~8-9% a.a. — ideal para fundo de emergência
3. **Sicredi Spectra (fundo renda fixa):** Liquidez D+1, ~100% CDI

**Minha recomendação:**
• Mantenha R$ 3.000 com liquidez imediata (emergências)
• Aplique R$ 5.420 em RDC 12 meses → rendimento extra de R$ ~200/ano vs poupança
• Ganho real anual vs poupança: **R$ 290** — sem risco adicional!

Quer que eu calcule o montante projetado?`,
  },
  {
    pattern: /nubank|fatura|vencimento|pagar|cartão/i,
    response: `💳 **Situação das Faturas:**

⚠️ **URGENTE — Nubank vence em 3 dias (29/mai):**
• Fatura: R$ 1.240,87
• Seu saldo Nubank: R$ 1.234,87 (faltam R$ 6,00!)
• Juros se não pagar: 12,5% a.m. = R$ 155/mês!

**Solução:** Transfira R$ 10,00 da Sicredi para o Nubank hoje e pague a fatura integralmente. Custo: R$ 0. Alternativa: R$ 62/dia de juros se atrasar!

**Calendário das outras:**
• Itaú R$ 876,34 → 05/jun (10 dias)
• Sicredi R$ 432,10 → 10/jun (15 dias)
• Sicoob R$ 218,60 → 15/jun (20 dias)
• Total: R$ 2.767,91

Você tem saldo suficiente (R$ 18.182,70) para pagar todas. Priorize o Nubank!`,
  },
  {
    pattern: /resumo|situação|visão geral|como estou|mês/i,
    response: `📊 **Resumo Financeiro — Maio 2026:**

**Patrimônio:** R$ 18.182,70 (4 contas)
**Gastos maio:** R$ 3.847,50 (77% da renda)
**Economia:** R$ 1.152,50 (23% ✅ acima dos 20% recomendados)
**Score:** 742/1000 — Bom 🟡

**3 prioridades para esta semana:**
1. 🔴 Pagar fatura Nubank R$ 1.240,87 até 29/mai (3 dias!)
2. 🟡 Cobrar Gabriel os R$ 106,05 via Pix
3. 🟢 Confirmar débito consórcio Sicredi R$ 1.030,13 em 27/mai

**Destaques positivos:**
• 23% de taxa de poupança é ótima!
• Consórcio Sicredi no trilho (34% concluído)
• 3 metas ativas progredindo

O que você quer aprofundar?`,
  },
]

function getFallbackResponse(message: string): string {
  for (const { pattern, response } of FALLBACK_RESPONSES) {
    if (pattern.test(message)) return response
  }
  return `📊 **Análise personalizada do CFO IA:**

Com base nos seus dados de maio/2026:
• **Saldo total:** R$ 18.182,70
• **Gastos:** R$ 3.847,50 (77% da renda)
• **Economia:** R$ 1.152,50 (23% ✅)

⚠️ **Ação urgente:** Fatura Nubank vence em 3 dias (R$ 1.240,87)!

Posso te ajudar com:
- 💳 Faturas e contas a pagar
- 📈 Análise do consórcio Sicredi
- 👥 Divisão de gastos com Gabriel
- 🎯 Projeção de metas
- 💰 Onde investir o saldo parado
- ✂️ Como reduzir gastos

O que quer analisar?`
}

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json()
    const lastMessage = messages[messages.length - 1]?.content || ''

    const apiKey = process.env.ANTHROPIC_API_KEY

    if (!apiKey) {
      // Smart fallback without API key
      await new Promise(r => setTimeout(r, 800 + Math.random() * 1200))
      const response = getFallbackResponse(lastMessage)
      return NextResponse.json({ content: response })
    }

    // Real Anthropic API call
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
        system: AI_FINANCIAL_CONTEXT,
        messages: messages.map((m: any) => ({
          role: m.role,
          content: m.content,
        })),
      }),
    })

    if (!response.ok) {
      const fallback = getFallbackResponse(lastMessage)
      return NextResponse.json({ content: fallback })
    }

    const data = await response.json()
    const content = data.content?.[0]?.text || getFallbackResponse(lastMessage)
    return NextResponse.json({ content })

  } catch (err) {
    console.error('[chat/route] error:', err)
    return NextResponse.json(
      { content: 'Ocorreu um erro ao processar sua mensagem. Tente novamente.' },
      { status: 200 }
    )
  }
}
