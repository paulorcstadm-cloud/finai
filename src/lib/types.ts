export type AccountType = 'checking' | 'savings' | 'credit' | 'investment'
export type BillStatus = 'pending' | 'partial' | 'paid'
export type TransactionType = 'debit' | 'credit' | 'transfer'
export type DocumentStatus = 'pending' | 'processing' | 'done' | 'error'
export type AlertSeverity = 'info' | 'warning' | 'danger' | 'success'
export type BillingCycle = 'monthly' | 'yearly' | 'weekly'
export type GoalStatus = 'active' | 'completed' | 'paused'
export type SplitStatus = 'pending' | 'settled'
export type MessageRole = 'user' | 'assistant'

export interface Account {
  id: string
  name: string
  institution: string
  type: AccountType
  balance: number
  limit?: number
  color: string
  gradient: string
  logo: string
  lastSync: string
  invoiceAmount?: number
  invoiceDue?: string
}

export interface Transaction {
  id: string
  accountId: string
  description: string
  amount: number
  type: TransactionType
  category: string
  categoryIcon: string
  categoryColor: string
  date: string
  isRecurring?: boolean
  installmentInfo?: string
  tags?: string[]
  splitWith?: string
}

export interface Category {
  name: string
  icon: string
  color: string
  amount: number
  budget?: number
  percentage: number
}

export interface Document {
  id: string
  filename: string
  type: string
  status: DocumentStatus
  uploadedAt: string
  processedAt?: string
  txCount?: number
  fileSize: number
  institution?: string
}

export interface Goal {
  id: string
  name: string
  icon: string
  targetAmount: number
  currentAmount: number
  deadline: string
  color: string
  monthlyContribution?: number
  status: GoalStatus
}

export interface Subscription {
  id: string
  name: string
  amount: number
  billingCycle: BillingCycle
  nextBilling: string
  category: string
  icon: string
  color: string
  isActive: boolean
}

export interface Installment {
  id: string
  description: string
  totalAmount: number
  installmentValue: number
  totalInstallments: number
  paidInstallments: number
  startDate: string
  accountId: string
  nextDue: string
}

export interface SplitExpense {
  id: string
  description: string
  totalAmount: number
  myShare: number
  friendShare: number
  paidBy: 'me' | 'friend'
  date: string
  category: string
  status: SplitStatus
  settled?: string
}

export interface Alert {
  id: string
  type: string
  title: string
  body: string
  severity: AlertSeverity
  isRead: boolean
  createdAt: string
  actionLabel?: string
  actionUrl?: string
}

export interface Bill {
  id: string
  name: string
  amount: number
  paidAmount: number
  dueDate: string
  category: string
  categoryIcon: string
  categoryColor: string
  status: BillStatus
  recurrent: boolean
  notes?: string
  createdAt: string
  paidAt?: string
  /** Present when this bill belongs to an installment purchase */
  installmentOf?: {
    current: number             // 1-based installment number
    total: number               // total number of installments
    groupId: string             // shared ID across the installment group
    totalPurchaseAmount: number // original full purchase price
  }
}

export interface ChatMessage {
  id: string
  role: MessageRole
  content: string
  createdAt: string
  isLoading?: boolean
}

export interface MonthlySpend {
  month: string
  gastos: number
  receitas: number
  saldo: number
}

export interface CategorySpend {
  name: string
  value: number
  color: string
  icon: string
}
