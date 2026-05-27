import type { Account, Transaction, Goal, Subscription } from './types'

// ─── User Configurations ──────────────────────────────────────────────────────
export const USER_CONFIG = {
  paulo: {
    id: 'paulo' as const,
    name: 'Paulo',
    fullName: 'Paulo Ricardo',
    email: 'paulorcst.adm@gmail.com',
    avatar: 'PR',
    color: '#6366f1',
    password: '08072023',
    score: 742,
    nav: ['dashboard','contas','faturas','contas-a-pagar','metas','assinaturas','chat','documentos','alertas','perfil'],
    quickPrompts: [
      { label: '📊 Resumo geral',  prompt: 'Me dê um resumo do meu estado financeiro atual' },
      { label: '✂️ Onde cortar',   prompt: 'Onde posso cortar gastos esse mês?' },
      { label: '🤝 Gabriel',       prompt: 'Quanto o Gabriel me deve agora?' },
      { label: '💰 Investir',      prompt: 'Onde devo investir o dinheiro parado?' },
      { label: '🎯 Minhas metas',  prompt: 'Como estou em relação às minhas metas financeiras?' },
    ],
    cfoIntro: `Olá, **Paulo**! 👋 Sou o **CFO IA** — seu assistente financeiro pessoal.\n\nAdicione suas contas e lançamentos para que eu possa analisar seus dados e te dar insights personalizados.\n\nComo posso te ajudar hoje?`,
  },
  gabriel: {
    id: 'gabriel' as const,
    name: 'Gabriel',
    fullName: 'Gabriel Henrique',
    email: 'gabriel@finai.app',
    avatar: 'GH',
    color: '#10b981',
    password: '08072023',
    score: 685,
    nav: ['dashboard','contas','faturas','contas-a-pagar','metas','assinaturas','chat','documentos','alertas'],
    quickPrompts: [
      { label: '📊 Meu resumo',    prompt: 'Como estão minhas finanças hoje?' },
      { label: '💡 Economizar',    prompt: 'Como posso economizar mais este mês?' },
      { label: '🎯 Minhas metas',  prompt: 'Como estou em relação às minhas metas?' },
      { label: '💳 Fatura',       prompt: 'Como está minha fatura do cartão?' },
      { label: '📈 Investir',      prompt: 'Quais investimentos são melhores pra mim?' },
    ],
    cfoIntro: `Olá, **Gabriel**! 👋 Sou o **CFO IA** — seu assistente financeiro pessoal.\n\nAdicione suas contas e lançamentos para que eu possa analisar seus dados e te dar insights personalizados.\n\nComo posso te ajudar hoje?`,
  },
} as const

export type UserId = keyof typeof USER_CONFIG
export type AuthUser = typeof USER_CONFIG[UserId]

// ─── Gabriel's Initial Data ───────────────────────────────────────────────────
export const GABRIEL_INITIAL_ACCOUNTS: Account[] = [
  {
    id: 'g-nubank', name: 'Nubank', institution: 'Nubank',
    type: 'checking', balance: 0, color: '#8a05be',
    gradient: 'from-[#8a05be] to-[#5a0380]', logo: 'N',
    lastSync: new Date().toISOString(),
  },
  {
    id: 'g-sicoob', name: 'Sicoob', institution: 'Sicoob',
    type: 'checking', balance: 0, color: '#1a5f3a',
    gradient: 'from-[#1a5f3a] to-[#0d3d24]', logo: 'SC',
    lastSync: new Date().toISOString(),
  },
]

export const GABRIEL_INITIAL_TRANSACTIONS: Transaction[] = []

export const GABRIEL_INITIAL_GOALS: Goal[] = []

export const GABRIEL_INITIAL_SUBS: Subscription[] = []

export const GABRIEL_WHATSAPP = '5546999031075'
