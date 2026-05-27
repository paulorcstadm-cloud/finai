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

export const ACCOUNTS: Account[] = [
  {
    id: 'sicoob-001',
    name: 'Sicoob',
    institution: 'Sicoob Credicitrus',
    type: 'checking',
    balance: 2847.63,
    color: '#1a5f3a',
    gradient: 'from-[#1a5f3a] to-[#0d3d24]',
    logo: 'SC',
    lastSync: '2026-05-26T08:00:00',
    invoiceAmount: 218.60,
    invoiceDue: '2026-06-15',
  },
  {
    id: 'sicredi-001',
    name: 'Sicredi',
    institution: 'Sicredi Planalto Gaúcho',
    type: 'savings',
    balance: 8420.00,
    color: '#006b3f',
    gradient: 'from-[#006b3f] to-[#004428]',
    logo: 'SR',
    lastSync: '2026-05-26T08:00:00',
    invoiceAmount: 432.10,
    invoiceDue: '2026-06-10',
  },
  {
    id: 'nubank-001',
    name: 'Nubank',
    institution: 'Nu Pagamentos S.A.',
    type: 'checking',
    balance: 1234.87,
    limit: 8000,
    color: '#8a05be',
    gradient: 'from-[#8a05be] to-[#6200a8]',
    logo: 'NU',
    lastSync: '2026-05-26T08:05:00',
    invoiceAmount: 1240.87,
    invoiceDue: '2026-05-29',
  },
  {
    id: 'itau-001',
    name: 'Itaú',
    institution: 'Itaú Unibanco S.A.',
    type: 'checking',
    balance: 5680.20,
    limit: 12000,
    color: '#ec7000',
    gradient: 'from-[#ec7000] to-[#c55a00]',
    logo: 'IT',
    lastSync: '2026-05-26T07:50:00',
    invoiceAmount: 876.34,
    invoiceDue: '2026-06-05',
  },
]

// ✅ CONSÓRCIO — Sicredi (não Itaú)
export const CONSORCIO: ConsorcioData = {
  id: 'cons-sicredi-001',
  institution: 'Sicredi Planalto Gaúcho',
  originalValue: 80000,
  currentValue: 83048,
  monthlyPayment: 1030.13,
  totalInstallments: 100,
  paidInstallments: 34,
  startDate: '2023-07-01',
  type: 'Bens Móveis',
  index: 'IPCA',
  group: '0482',
  quota: '034',
}

export const TRANSACTIONS: Transaction[] = [
  { id: 't01', accountId: 'nubank-001', description: 'iFood - Restaurante Saboroso', amount: -48.90, type: 'debit', category: 'Alimentação', categoryIcon: '🍔', categoryColor: '#f59e0b', date: '2026-05-26', tags: ['delivery'] },
  { id: 't02', accountId: 'itau-001', description: 'Posto Shell - Combustível', amount: -180.00, type: 'debit', category: 'Transporte', categoryIcon: '⛽', categoryColor: '#3b82f6', date: '2026-05-25', splitWith: 'Gabriel' },
  { id: 't03', accountId: 'nubank-001', description: 'Salário - Empresa Ltda', amount: 5000.00, type: 'credit', category: 'Salário', categoryIcon: '💼', categoryColor: '#10b981', date: '2026-05-25' },
  { id: 't04', accountId: 'sicoob-001', description: 'Supermercado Giassi', amount: -320.40, type: 'debit', category: 'Mercado', categoryIcon: '🛒', categoryColor: '#8b5cf6', date: '2026-05-24', splitWith: 'Gabriel' },
  { id: 't05', accountId: 'sicredi-001', description: 'Consórcio Sicredi - Parcela 35/100', amount: -1030.13, type: 'debit', category: 'Consórcio', categoryIcon: '🏦', categoryColor: '#006b3f', date: '2026-05-27', isRecurring: true },
  { id: 't06', accountId: 'nubank-001', description: 'Netflix', amount: -55.90, type: 'debit', category: 'Assinaturas', categoryIcon: '📺', categoryColor: '#e11d48', date: '2026-05-22', isRecurring: true },
  { id: 't07', accountId: 'sicredi-001', description: 'Restaurante - Jantar com Gabriel', amount: -284.50, type: 'debit', category: 'Alimentação', categoryIcon: '🍽️', categoryColor: '#f59e0b', date: '2026-05-21', splitWith: 'Gabriel' },
  { id: 't08', accountId: 'nubank-001', description: 'Amazon - Compra Online', amount: -129.90, type: 'debit', category: 'Compras', categoryIcon: '📦', categoryColor: '#6366f1', date: '2026-05-20' },
  { id: 't09', accountId: 'itau-001', description: 'Farmácia São João', amount: -67.80, type: 'debit', category: 'Saúde', categoryIcon: '💊', categoryColor: '#10b981', date: '2026-05-19' },
  { id: 't10', accountId: 'sicoob-001', description: 'Academia Smart Fit', amount: -99.90, type: 'debit', category: 'Saúde', categoryIcon: '🏋️', categoryColor: '#10b981', date: '2026-05-18', isRecurring: true },
  { id: 't11', accountId: 'nubank-001', description: 'Spotify Premium', amount: -21.90, type: 'debit', category: 'Assinaturas', categoryIcon: '🎵', categoryColor: '#1DB954', date: '2026-05-17', isRecurring: true },
  { id: 't12', accountId: 'itau-001', description: 'Shopee - Eletrônico', amount: -199.00, type: 'debit', category: 'Compras', categoryIcon: '🛍️', categoryColor: '#6366f1', date: '2026-05-16', installmentInfo: '3/6' },
  { id: 't13', accountId: 'sicredi-001', description: 'Transferência - Gabriel Henrique', amount: 142.25, type: 'credit', category: 'Transferência', categoryIcon: '↔️', categoryColor: '#3b82f6', date: '2026-05-15' },
  { id: 't14', accountId: 'nubank-001', description: 'Uber - Viagem Centro', amount: -24.50, type: 'debit', category: 'Transporte', categoryIcon: '🚗', categoryColor: '#3b82f6', date: '2026-05-15' },
  { id: 't15', accountId: 'itau-001', description: 'Energia Elétrica - CELESC', amount: -187.30, type: 'debit', category: 'Utilidades', categoryIcon: '⚡', categoryColor: '#f59e0b', date: '2026-05-14', isRecurring: true },
  { id: 't16', accountId: 'sicoob-001', description: 'Internet - Claro Fibra', amount: -109.90, type: 'debit', category: 'Utilidades', categoryIcon: '📡', categoryColor: '#f59e0b', date: '2026-05-13', isRecurring: true },
  { id: 't17', accountId: 'nubank-001', description: 'Cinema - Cinemark', amount: -68.00, type: 'debit', category: 'Lazer', categoryIcon: '🎬', categoryColor: '#a78bfa', date: '2026-05-12', splitWith: 'Gabriel' },
  { id: 't18', accountId: 'itau-001', description: 'Aluguel - Ap 302', amount: -1400.00, type: 'debit', category: 'Moradia', categoryIcon: '🏠', categoryColor: '#94a3b8', date: '2026-05-10', isRecurring: true },
  { id: 't19', accountId: 'sicredi-001', description: 'Rendimento Poupança', amount: 58.40, type: 'credit', category: 'Rendimentos', categoryIcon: '📈', categoryColor: '#10b981', date: '2026-05-08' },
  { id: 't20', accountId: 'nubank-001', description: 'ChatGPT Plus', amount: -20.00, type: 'debit', category: 'Assinaturas', categoryIcon: '🤖', categoryColor: '#10a37f', date: '2026-05-07', isRecurring: true },
]

export const GOALS: Goal[] = [
  { id: 'g01', name: 'Fundo de Emergência', icon: '🛡️', targetAmount: 20000, currentAmount: 12800, deadline: '2026-12-31', color: '#10b981', monthlyContribution: 600, status: 'active' },
  { id: 'g02', name: 'Viagem Europa 2027', icon: '✈️', targetAmount: 25000, currentAmount: 4200, deadline: '2027-06-01', color: '#6366f1', monthlyContribution: 800, status: 'active' },
  { id: 'g03', name: 'Notebook Novo', icon: '💻', targetAmount: 6500, currentAmount: 2100, deadline: '2026-10-01', color: '#00754a', monthlyContribution: 450, status: 'active' },
  { id: 'g04', name: 'Carta Consórcio Paga', icon: '🏆', targetAmount: 83048, currentAmount: 35044.42, deadline: '2031-07-01', color: '#006b3f', monthlyContribution: 1030.13, status: 'active' },
]

export const SUBSCRIPTIONS: Subscription[] = [
  { id: 's01', name: 'Netflix', amount: 55.90, billingCycle: 'monthly', nextBilling: '2026-06-22', category: 'Entretenimento', icon: '📺', color: '#e11d48', isActive: true },
  { id: 's02', name: 'Spotify', amount: 21.90, billingCycle: 'monthly', nextBilling: '2026-06-17', category: 'Música', icon: '🎵', color: '#1DB954', isActive: true },
  { id: 's03', name: 'ChatGPT Plus', amount: 20.00, billingCycle: 'monthly', nextBilling: '2026-06-07', category: 'Produtividade', icon: '🤖', color: '#10a37f', isActive: true },
  { id: 's04', name: 'Smart Fit', amount: 99.90, billingCycle: 'monthly', nextBilling: '2026-06-18', category: 'Saúde', icon: '🏋️', color: '#f59e0b', isActive: true },
  { id: 's05', name: 'Amazon Prime', amount: 19.90, billingCycle: 'monthly', nextBilling: '2026-06-12', category: 'Entretenimento', icon: '📦', color: '#ff9900', isActive: true },
  { id: 's06', name: 'Adobe Creative', amount: 249.00, billingCycle: 'yearly', nextBilling: '2027-01-15', category: 'Design', icon: '🎨', color: '#ff0000', isActive: false },
  { id: 's07', name: 'Claro Fibra', amount: 109.90, billingCycle: 'monthly', nextBilling: '2026-06-13', category: 'Internet', icon: '📡', color: '#e11d48', isActive: true },
  { id: 's08', name: 'iCloud 200GB', amount: 7.00, billingCycle: 'monthly', nextBilling: '2026-06-03', category: 'Armazenamento', icon: '☁️', color: '#3b82f6', isActive: true },
]

export const INSTALLMENTS: Installment[] = [
  { id: 'i01', description: 'Shopee - Eletrônico', totalAmount: 1194.00, installmentValue: 199.00, totalInstallments: 6, paidInstallments: 3, startDate: '2026-03-16', accountId: 'itau-001', nextDue: '2026-06-16' },
  { id: 'i02', description: 'Magazine Luiza - TV 55"', totalAmount: 2799.00, installmentValue: 233.25, totalInstallments: 12, paidInstallments: 5, startDate: '2026-01-10', accountId: 'nubank-001', nextDue: '2026-06-10' },
  { id: 'i03', description: 'Havan - Roupas', totalAmount: 480.00, installmentValue: 80.00, totalInstallments: 6, paidInstallments: 2, startDate: '2026-04-20', accountId: 'sicoob-001', nextDue: '2026-06-20' },
]

export const GABRIEL_EXPENSES: SplitExpense[] = [
  { id: 'ge01', description: 'Jantar Restaurante Casa da Carne', totalAmount: 284.50, myShare: 142.25, friendShare: 142.25, paidBy: 'me', date: '2026-05-21', category: 'Alimentação', status: 'pending' },
  { id: 'ge02', description: 'Combustível - Viagem Balneário', totalAmount: 180.00, myShare: 90.00, friendShare: 90.00, paidBy: 'me', date: '2026-05-25', category: 'Transporte', status: 'pending' },
  { id: 'ge03', description: 'Cinema + Pipoca', totalAmount: 68.00, myShare: 34.00, friendShare: 34.00, paidBy: 'me', date: '2026-05-12', category: 'Lazer', status: 'pending' },
  { id: 'ge04', description: 'Supermercado Giassi', totalAmount: 320.40, myShare: 160.20, friendShare: 160.20, paidBy: 'friend', date: '2026-05-24', category: 'Mercado', status: 'pending' },
  { id: 'ge05', description: 'Bar - Barzinho da Praia', totalAmount: 156.00, myShare: 78.00, friendShare: 78.00, paidBy: 'me', date: '2026-05-08', category: 'Lazer', status: 'settled', settled: '2026-05-15' },
  { id: 'ge06', description: 'Pizza delivery', totalAmount: 98.00, myShare: 49.00, friendShare: 49.00, paidBy: 'friend', date: '2026-04-30', category: 'Alimentação', status: 'settled', settled: '2026-05-02' },
]

export const ALERTS: Alert[] = [
  { id: 'al01', type: 'bill_due', title: 'Fatura Nubank vence em 3 dias', body: 'Sua fatura de R$ 1.240,87 vence no dia 29/mai. Pague antes para evitar juros de 12,5% a.m.', severity: 'danger', isRead: false, createdAt: '2026-05-26T08:00:00', actionLabel: 'Ver fatura', actionUrl: '/faturas' },
  { id: 'al02', type: 'consorcio', title: 'Débito consórcio Sicredi amanhã', body: 'A parcela 35/100 do consórcio Sicredi (R$ 1.030,13) será debitada amanhã dia 27/mai.', severity: 'warning', isRead: false, createdAt: '2026-05-26T07:00:00', actionLabel: 'Ver consórcio', actionUrl: '/consorcio' },
  { id: 'al03', type: 'unusual_spend', title: 'Gasto em Alimentação acima do normal', body: 'Você gastou R$ 514,80 em alimentação este mês — 23% acima da sua média de R$ 418,50.', severity: 'warning', isRead: false, createdAt: '2026-05-25T20:00:00' },
  { id: 'al04', type: 'goal', title: 'Meta Fundo de Emergência: 64%', body: 'Você está a R$ 7.200 de atingir sua meta. Com R$ 600/mês, alcança em dez/2026.', severity: 'info', isRead: true, createdAt: '2026-05-24T10:00:00', actionLabel: 'Ver metas', actionUrl: '/metas' },
  { id: 'al05', type: 'gabriel', title: 'Gabriel te deve R$ 106,05', body: 'Saldo acumulado: jantar (R$ 142,25) + combustível (R$ 90) + cinema (R$ 34) − mercado (R$ 160,20).', severity: 'info', isRead: true, createdAt: '2026-05-25T09:00:00', actionLabel: 'Ver divisões', actionUrl: '/gabriel' },
  { id: 'al06', type: 'subscription', title: 'Adobe Creative inativo', body: 'Você tem uma assinatura inativa (R$ 249/ano). Cancele se não estiver usando.', severity: 'info', isRead: true, createdAt: '2026-05-22T12:00:00', actionLabel: 'Ver assinaturas', actionUrl: '/assinaturas' },
  { id: 'al07', type: 'insight', title: 'Você economizou R$ 1.152 este mês', body: 'Parabéns! Sua taxa de poupança foi de 23% — acima do recomendado de 20%.', severity: 'success', isRead: true, createdAt: '2026-05-20T18:00:00' },
]

export const DOCUMENTS: Document[] = [
  { id: 'd01', filename: 'fatura-nubank-maio-2026.pdf', type: 'invoice', status: 'done', uploadedAt: '2026-05-22T10:00:00', processedAt: '2026-05-22T10:02:30', txCount: 18, fileSize: 284320, institution: 'Nubank' },
  { id: 'd02', filename: 'extrato-itau-abril-2026.pdf', type: 'statement', status: 'done', uploadedAt: '2026-05-10T14:30:00', processedAt: '2026-05-10T14:33:15', txCount: 32, fileSize: 512640, institution: 'Itaú' },
  { id: 'd03', filename: 'fatura-sicredi-maio-2026.pdf', type: 'invoice', status: 'processing', uploadedAt: '2026-05-26T09:15:00', fileSize: 198400, institution: 'Sicredi' },
  { id: 'd04', filename: 'extrato-sicoob-marco-2026.pdf', type: 'statement', status: 'done', uploadedAt: '2026-04-05T11:00:00', processedAt: '2026-04-05T11:01:45', txCount: 24, fileSize: 367800, institution: 'Sicoob' },
  { id: 'd05', filename: 'nota-fiscal-smart-fit.pdf', type: 'receipt', status: 'error', uploadedAt: '2026-05-15T16:45:00', fileSize: 52400 },
]

export const MONTHLY_SPEND: MonthlySpend[] = [
  { month: 'Dez', gastos: 3240, receitas: 5000, saldo: 1760 },
  { month: 'Jan', gastos: 4180, receitas: 5000, saldo: 820 },
  { month: 'Fev', gastos: 3620, receitas: 5200, saldo: 1580 },
  { month: 'Mar', gastos: 3890, receitas: 5000, saldo: 1110 },
  { month: 'Abr', gastos: 3520, receitas: 5000, saldo: 1480 },
  { month: 'Mai', gastos: 3848, receitas: 5000, saldo: 1152 },
]

export const CATEGORY_SPEND: CategorySpend[] = [
  { name: 'Moradia',    value: 1400,    color: '#94a3b8', icon: '🏠' },
  { name: 'Consórcio',  value: 1030.13, color: '#006b3f', icon: '🏦' },
  { name: 'Alimentação',value: 514.80,  color: '#f59e0b', icon: '🍔' },
  { name: 'Assinaturas',value: 334.60,  color: '#e11d48', icon: '📱' },
  { name: 'Compras',    value: 328.90,  color: '#6366f1', icon: '🛍️' },
  { name: 'Transporte', value: 204.50,  color: '#3b82f6', icon: '🚗' },
  { name: 'Saúde',      value: 167.70,  color: '#10b981', icon: '💊' },
  { name: 'Lazer',      value: 92.00,   color: '#a78bfa', icon: '🎬' },
  { name: 'Utilidades', value: 297.20,  color: '#f97316', icon: '⚡' },
]

export const QUICK_PROMPTS = [
  { label: 'Resumo do mês', prompt: 'Como está minha situação financeira em maio 2026?' },
  { label: 'Consórcio', prompt: 'Vale a pena adiantar parcelas do meu consórcio Sicredi?' },
  { label: 'Onde cortar gastos?', prompt: 'Onde posso reduzir gastos sem impactar minha qualidade de vida?' },
  { label: 'Meta Europa', prompt: 'Quando vou atingir a meta da viagem Europa com R$ 800/mês?' },
  { label: 'Situação Gabriel', prompt: 'Me mostra o resumo de quanto o Gabriel me deve' },
  { label: 'Score 800', prompt: 'O que preciso fazer para chegar em 800 pontos no Score FinAI?' },
  { label: 'Melhor investimento', prompt: 'Onde devo investir o dinheiro da Sicredi que está parado?' },
  { label: 'Fatura Nubank', prompt: 'Vou conseguir pagar a fatura do Nubank antes do vencimento?' },
]

export const AI_FINANCIAL_CONTEXT = `
Você é CFO IA, o assistente financeiro pessoal do Paulo integrado ao FinAI.

📊 SITUAÇÃO FINANCEIRA DE PAULO (26/mai/2026):

CONTAS BANCÁRIAS:
• Sicoob (c/c cooperativa): R$ 2.847,63
• Sicredi (poupança cooperativa): R$ 8.420,00
• Nubank (conta digital): R$ 1.234,87
• Itaú (c/c): R$ 5.680,20
• TOTAL: R$ 18.182,70

RENDA E GASTOS:
• Renda mensal: R$ 5.000,00
• Gastos maio/2026: R$ 3.847,50 (77% da renda)
• Economia: R$ 1.152,50 (23% — acima dos 20% recomendados)
• Score FinAI: 742/1000 (Bom)

CONSÓRCIO (⚠️ É DO SICREDI, não Itaú):
• Carta: R$ 83.048,00 (original R$ 80.000, corrigido pelo IPCA)
• Parcela mensal: R$ 1.030,13
• Progresso: 34/100 parcelas pagas
• Término previsto: jul/2031
• Tipo: Bens Móveis | Grupo 0482 | Cota 034

FATURAS ABERTAS:
• Nubank: R$ 1.240,87 (vence 29/mai — URGENTE, 3 dias!)
• Itaú: R$ 876,34 (vence 05/jun)
• Sicredi: R$ 432,10 (vence 10/jun)
• Sicoob: R$ 218,60 (vence 15/jun)
• Total em aberto: R$ 2.767,91

GABRIEL HENRIQUE (divisão de gastos):
• Gabriel deve ao Paulo: R$ 266,25 (jantar R$142,25 + combustível R$90 + cinema R$34)
• Paulo deve ao Gabriel: R$ 160,20 (supermercado que Gabriel pagou)
• Saldo líquido: Gabriel deve R$ 106,05 ao Paulo
• Chave Pix do Paulo: paulorcst.adm@gmail.com

METAS ATIVAS:
• 🛡️ Fundo de Emergência: R$ 12.800/R$ 20.000 (64%) — aportes R$ 600/mês
• ✈️ Viagem Europa 2027: R$ 4.200/R$ 25.000 (17%) — aportes R$ 800/mês
• 💻 Notebook: R$ 2.100/R$ 6.500 (32%) — aportes R$ 450/mês

ASSINATURAS MENSAIS: Netflix R$55,90 + Spotify R$21,90 + ChatGPT R$20 + Smart Fit R$99,90 + Amazon Prime R$19,90 + Claro Fibra R$109,90 + iCloud R$7 = R$ 334,60/mês

PARCELAMENTOS ATIVOS: R$ 512,25/mês (Shopee, Magazine Luiza, Havan)

REGRAS:
- Responda SEMPRE em português brasileiro
- Use dados reais do Paulo na resposta, nunca genéricos
- Seja direto, objetivo e acionável
- Use emojis moderadamente para clareza
- Tutele financeiramente: aponte riscos e oportunidades reais
- Quando falar de consórcio, sempre diga que é do Sicredi
`
