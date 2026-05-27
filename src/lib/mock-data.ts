import type {
  Account, Transaction, Goal, Subscription,
  Installment, SplitExpense, Alert, ConsorcioData,
  MonthlySpend, CategorySpend, Document,
} from './types'

export const USER = {
  id: 'paulo-001',
  name: 'Paulo',
  fullName: 'Paulo Ricardo',
  email: 'paulorcst.adm@gmail.com',
  avatar: 'PR',
  plan: 'pro' as const,
  healthScore: 742,
  memberSince: '2024-01-15',
  monthlyIncome: 5000,
  pixKey: 'paulorcst.adm@gmail.com',
}

// ─── Accounts (zero balances — user fills in real values) ────────────────────
export const ACCOUNTS: Account[] = [
  {
    id: 'sicoob-001',
    name: 'Sicoob',
    institution: 'Sicoob',
    type: 'checking',
    balance: 0,
    color: '#1a5f3a',
    gradient: 'from-[#1a5f3a] to-[#0d3d24]',
    logo: 'SC',
    lastSync: new Date().toISOString(),
  },
  {
    id: 'sicredi-001',
    name: 'Sicredi',
    institution: 'Sicredi Planalto Gaúcho',
    type: 'savings',
    balance: 0,
    color: '#006b3f',
    gradient: 'from-[#006b3f] to-[#004428]',
    logo: 'SR',
    lastSync: new Date().toISOString(),
  },
  {
    id: 'nubank-001',
    name: 'Nubank',
    institution: 'Nubank',
    type: 'checking',
    balance: 0,
    color: '#8a05be',
    gradient: 'from-[#8a05be] to-[#6200a8]',
    logo: 'NU',
    lastSync: new Date().toISOString(),
  },
  {
    id: 'itau-001',
    name: 'Itaú',
    institution: 'Itaú Unibanco',
    type: 'checking',
    balance: 0,
    color: '#ec7000',
    gradient: 'from-[#ec7000] to-[#c55a00]',
    logo: 'IT',
    lastSync: new Date().toISOString(),
  },
]

// ─── Consórcio Sicredi (keep structure, zero numbers) ───────────────────────
export const CONSORCIO: ConsorcioData = {
  id: 'cons-sicredi-001',
  institution: 'Sicredi Planalto Gaúcho',
  originalValue: 80000,
  currentValue: 83048,
  monthlyPayment: 1030.13,
  totalInstallments: 100,
  paidInstallments: 0,
  startDate: '2023-07-01',
  type: 'Bens Móveis',
  index: 'IPCA',
  group: '0482',
  quota: '034',
}

// ─── Empty defaults — user enters real data ──────────────────────────────────
export const TRANSACTIONS: Transaction[] = []

export const GOALS: Goal[] = []

export const SUBSCRIPTIONS: Subscription[] = []

export const INSTALLMENTS: Installment[] = []

export const GABRIEL_EXPENSES: SplitExpense[] = []

export const ALERTS: Alert[] = []

export const DOCUMENTS: Document[] = []

// ─── Charts — start empty; filled after user enters transactions ─────────────
export const MONTHLY_SPEND: MonthlySpend[] = [
  { month: 'Jan', gastos: 0, receitas: 0, saldo: 0 },
  { month: 'Fev', gastos: 0, receitas: 0, saldo: 0 },
  { month: 'Mar', gastos: 0, receitas: 0, saldo: 0 },
  { month: 'Abr', gastos: 0, receitas: 0, saldo: 0 },
  { month: 'Mai', gastos: 0, receitas: 0, saldo: 0 },
  { month: 'Jun', gastos: 0, receitas: 0, saldo: 0 },
]

export const CATEGORY_SPEND: CategorySpend[] = []

export const QUICK_PROMPTS = [
  { label: 'Resumo do mês',    prompt: 'Como está minha situação financeira este mês?' },
  { label: 'Consórcio',        prompt: 'Vale a pena adiantar parcelas do meu consórcio Sicredi?' },
  { label: 'Onde cortar gastos?', prompt: 'Onde posso reduzir gastos sem impactar minha qualidade de vida?' },
  { label: 'Investir',         prompt: 'Onde devo investir o dinheiro parado?' },
  { label: 'Situação Gabriel', prompt: 'Me mostra o resumo de quanto o Gabriel me deve' },
]

export const AI_FINANCIAL_CONTEXT = `
Você é CFO IA, o assistente financeiro pessoal integrado ao FinAI.

INSTRUÇÕES:
- Responda SEMPRE em português brasileiro
- Seja direto, objetivo e acionável
- Use os dados reais do usuário quando disponíveis
- Quando falar de consórcio, confirme que é do Sicredi
- Dê conselhos financeiros práticos e personalizados
- Use emojis moderadamente para clareza
`
