import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number, compact = false): string {
  if (compact && Math.abs(value) >= 1000) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value)
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatDate(dateStr: string, format: 'short' | 'medium' | 'long' = 'medium'): string {
  const date = new Date(dateStr + 'T12:00:00')
  if (format === 'short') {
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(date)
  }
  if (format === 'long') {
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }).format(date)
  }
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(date)
}

export function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00')
  const now = new Date()
  const diff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
  if (diff === 0) return 'Hoje'
  if (diff === 1) return 'Ontem'
  if (diff < 7) return `Há ${diff} dias`
  return formatDate(dateStr, 'short')
}

export function daysUntil(dateStr: string): number {
  const date = new Date(dateStr + 'T12:00:00')
  const now = new Date()
  return Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

export function percentage(current: number, total: number): number {
  if (total === 0) return 0
  return Math.min(Math.round((current / total) * 100), 100)
}

export function getScoreColor(score: number): string {
  if (score >= 800) return '#10b981'
  if (score >= 650) return '#f59e0b'
  if (score >= 500) return '#f97316'
  return '#f43f5e'
}

export function getScoreLabel(score: number): string {
  if (score >= 800) return 'Excelente'
  if (score >= 650) return 'Bom'
  if (score >= 500) return 'Regular'
  return 'Atenção'
}

export function abbreviate(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`
  return value.toString()
}
