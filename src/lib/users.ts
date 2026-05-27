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
    nav: ['dashboard','contas','consorcio','gabriel','faturas','metas','assinaturas','chat','documentos','alertas'],
    quickPrompts: [
      { label: '📊 Resumo geral',  prompt: 'Me dê um resumo do meu estado financeiro atual' },
      { label: '📈 Consórcio',     prompt: 'Como está meu consórcio Sicredi? Vale antecipar?' },
      { label: '✂️ Onde cortar',   prompt: 'Onde posso cortar gastos esse mês?' },
      { label: '🤝 Gabriel',       prompt: 'Quanto o Gabriel me deve agora?' },
      { label: '💰 Investir',      prompt: 'Onde devo investir o dinheiro parado?' },
    ],
    cfoIntro: `Olá, **Paulo**! 👋 Sou o **CFO IA** — seu assistente financeiro pessoal.\n\nTenho acesso ao seu perfil completo:\n• Saldo total: **R$ 18.182,70** em 4 contas\n• Consórcio Sicredi: parcela 35/100 — **R$ 1.030,13/mês**\n• Score FinAI: **742/1000** (Bom)\n• Fatura Nubank vence em 3 dias ⚠️\n\nComo posso ajudar você hoje?`,
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
    nav: ['dashboard','contas','faturas','metas','assinaturas','chat','documentos','alertas'],
    quickPrompts: [
      { label: '📊 Meu resumo',    prompt: 'Como estão minhas finanças hoje?' },
      { label: '💡 Economizar',    prompt: 'Como posso economizar mais este mês?' },
      { label: '🎯 Minhas metas',  prompt: 'Como estou em relação às minhas metas?' },
      { label: '💳 Fatura',       prompt: 'Como está minha fatura do cartão?' },
      { label: '📈 Investir',      prompt: 'Quais investimentos são melhores pra mim?' },
    ],
    cfoIntro: `Olá, **Gabriel**! 👋 Sou o **CFO IA** — seu assistente financeiro pessoal.\n\nAqui está seu panorama atual:\n• Saldo total: **R$ 5.047,80** (Nubank + Sicoob)\n• Fatura Nubank: **R$ 487,50** (vence em 9 dias)\n• Score FinAI: **685/1000** (Regular — mas crescendo!)\n\nComo posso ajudar você hoje?`,
  },
} as const

export type UserId = keyof typeof USER_CONFIG
export type AuthUser = typeof USER_CONFIG[UserId]

// ─── Gabriel's Initial Data ───────────────────────────────────────────────────
export const GABRIEL_INITIAL_ACCOUNTS: Account[] = [
  {
    id: 'g-nubank', name: 'Nubank', institution: 'Nubank',
    type: 'checking', balance: 3247.80, color: '#8a05be',
    gradient: 'from-[#8a05be] to-[#5a0380]', logo: 'N',
    lastSync: '2026-05-27T09:00:00', invoiceAmount: 487.50, invoiceDue: '2026-06-05',
  },
  {
    id: 'g-sicoob', name: 'Sicoob', institution: 'Sicoob',
    type: 'checking', balance: 1800.00, color: '#1a5f3a',
    gradient: 'from-[#1a5f3a] to-[#0d3d24]', logo: 'SC',
    lastSync: '2026-05-27T09:00:00',
  },
]

export const GABRIEL_INITIAL_TRANSACTIONS: Transaction[] = [
  { id: 'gt1', accountId: 'g-nubank', description: 'Salário', amount: 2800.00, type: 'credit', category: 'Salário', categoryIcon: '💼', categoryColor: '#10b981', date: '2026-05-05' },
  { id: 'gt2', accountId: 'g-nubank', description: 'Aluguel', amount: -850.00, type: 'debit', category: 'Moradia', categoryIcon: '🏠', categoryColor: '#f59e0b', date: '2026-05-10' },
  { id: 'gt3', accountId: 'g-nubank', description: 'iFood', amount: -89.60, type: 'debit', category: 'Alimentação', categoryIcon: '🍔', categoryColor: '#f97316', date: '2026-05-20' },
  { id: 'gt4', accountId: 'g-nubank', description: 'Spotify', amount: -21.90, type: 'debit', category: 'Assinaturas', categoryIcon: '🎵', categoryColor: '#1DB954', date: '2026-05-15' },
  { id: 'gt5', accountId: 'g-nubank', description: 'Netflix', amount: -55.90, type: 'debit', category: 'Assinaturas', categoryIcon: '📺', categoryColor: '#e11d48', date: '2026-05-18' },
  { id: 'gt6', accountId: 'g-nubank', description: 'Mercado', amount: -124.30, type: 'debit', category: 'Mercado', categoryIcon: '🛒', categoryColor: '#10b981', date: '2026-05-22' },
  { id: 'gt7', accountId: 'g-nubank', description: 'Uber', amount: -34.50, type: 'debit', category: 'Transporte', categoryIcon: '🚗', categoryColor: '#0ea5e9', date: '2026-05-25' },
  { id: 'gt8', accountId: 'g-sicoob', description: 'Depósito', amount: 1800.00, type: 'credit', category: 'Transferência', categoryIcon: '↔️', categoryColor: '#3b82f6', date: '2026-05-01' },
]

export const GABRIEL_INITIAL_GOALS: Goal[] = [
  { id: 'gg1', name: 'Reserva de emergência', icon: '🛡️', targetAmount: 10000, currentAmount: 2500, color: '#10b981', deadline: '2027-12-31', monthlyContribution: 400, status: 'active' },
  { id: 'gg2', name: 'Carro próprio', icon: '🚗', targetAmount: 35000, currentAmount: 3200, color: '#3b82f6', deadline: '2029-06-01', monthlyContribution: 600, status: 'active' },
  { id: 'gg3', name: 'Viagem Disney', icon: '✈️', targetAmount: 8000, currentAmount: 750, color: '#f59e0b', deadline: '2027-07-01', monthlyContribution: 300, status: 'active' },
]

export const GABRIEL_INITIAL_SUBS: Subscription[] = [
  { id: 'gs1', name: 'Spotify', amount: 21.90, billingCycle: 'monthly', nextBilling: '2026-06-15', category: 'Música', icon: '🎵', color: '#1DB954', isActive: true },
  { id: 'gs2', name: 'Netflix', amount: 55.90, billingCycle: 'monthly', nextBilling: '2026-06-18', category: 'Entretenimento', icon: '📺', color: '#e11d48', isActive: true },
  { id: 'gs3', name: 'Academia', amount: 89.90, billingCycle: 'monthly', nextBilling: '2026-06-01', category: 'Saúde', icon: '🏋️', color: '#f59e0b', isActive: true },
]

export const GABRIEL_WHATSAPP = '5546999031075'
