'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  Sparkles, Eye, EyeOff, UserPlus, AlertCircle,
  Mail, Lock, User, CheckCircle2, X,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Password strength helpers ────────────────────────────────────────────────

interface PasswordRule {
  label: string
  test: (pw: string) => boolean
}

const PW_RULES: PasswordRule[] = [
  { label: 'Mínimo 8 caracteres',      test: pw => pw.length >= 8 },
  { label: 'Letra maiúscula (A-Z)',    test: pw => /[A-Z]/.test(pw) },
  { label: 'Letra minúscula (a-z)',    test: pw => /[a-z]/.test(pw) },
  { label: 'Número (0-9)',             test: pw => /\d/.test(pw) },
  { label: 'Caractere especial (!@#)', test: pw => /[^A-Za-z0-9]/.test(pw) },
]

function passwordStrength(pw: string): { score: number; label: string; color: string } {
  const passed = PW_RULES.filter(r => r.test(pw)).length
  if (passed <= 1) return { score: passed, label: 'Muito fraca', color: '#ef4444' }
  if (passed === 2) return { score: passed, label: 'Fraca',       color: '#f97316' }
  if (passed === 3) return { score: passed, label: 'Média',       color: '#eab308' }
  if (passed === 4) return { score: passed, label: 'Forte',       color: '#22c55e' }
  return                   { score: passed, label: 'Muito forte', color: '#10b981' }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RegisterPage() {
  const supabase = createClient()

  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const strength = passwordStrength(form.password)
  const allRulesPassed = PW_RULES.every(r => r.test(form.password))
  const passwordsMatch = form.password === form.confirm && form.confirm.length > 0
  const canSubmit = form.name.trim().length >= 2 && form.email.includes('@') && allRulesPassed && passwordsMatch

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setError('')
    setLoading(true)

    const name = form.name.trim()
    const avatar = name.slice(0, 2).toUpperCase()

    const { error: signUpError } = await supabase.auth.signUp({
      email: form.email.trim().toLowerCase(),
      password: form.password,
      options: {
        data: { name, avatar },
        // Supabase will send a verification email
        // Redirect back to our callback after confirmation
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    setLoading(false)

    if (signUpError) {
      const m = signUpError.message.toLowerCase()
      const msg =
        m.includes('already registered') || m.includes('user already registered')
          ? 'Este e-mail já está cadastrado. Tente fazer login.'
          : m.includes('password should be') || m.includes('weak password')
            ? 'A senha não atende aos requisitos mínimos de segurança.'
            : m.includes('rate limit') || m.includes('too many')
              ? 'Muitas tentativas. Aguarde alguns minutos e tente novamente.'
              : m.includes('invalid email')
                ? 'E-mail inválido. Verifique e tente novamente.'
                : 'Erro ao criar conta. Tente novamente.'
      setError(msg)
      return
    }

    setSuccess(true)
  }

  // ── Success screen ──────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen bg-[#09090F] grid-bg flex items-center justify-center p-4">
        <div className="relative w-full max-w-sm animate-scale-in text-center">
          <div className="bg-[#16161E] border border-emerald-500/20 rounded-2xl p-8 shadow-card">
            <div className="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>
            <h2 className="text-lg font-bold text-white mb-2">Conta criada! 🎉</h2>
            <p className="text-sm text-slate-400 mb-2">
              Enviamos um e-mail de confirmação para:
            </p>
            <p className="text-sm font-medium text-primary-400 mb-5">{form.email}</p>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              Clique no link do e-mail para ativar sua conta e depois faça login.
              Verifique também a pasta de spam.
            </p>
            <Link href="/login"
              className="block w-full py-3 rounded-xl btn-primary text-sm font-semibold text-center">
              Ir para o Login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ── Register form ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#09090F] grid-bg flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-primary-500/6 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm animate-scale-in">
        {/* Logo */}
        <div className="text-center mb-7">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-glow mx-auto mb-3">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">
            Fin<span className="gradient-text-primary">AI</span>
          </h1>
        </div>

        <div className="bg-[#16161E] border border-white/[0.08] rounded-2xl p-6 shadow-card">
          <h2 className="text-base font-semibold text-white mb-1">Criar conta gratuita</h2>
          <p className="text-xs text-slate-500 mb-5">
            Já tem conta?{' '}
            <Link href="/login" className="text-primary-400 hover:text-primary-300 font-medium">
              Entrar
            </Link>
          </p>

          <form onSubmit={handleRegister} className="space-y-4">
            {/* Full name */}
            <div>
              <label className="text-xs text-slate-500 mb-1.5 block">Nome completo</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Seu nome completo"
                  autoComplete="name"
                  required
                  className="finai-input w-full pl-9 pr-3 py-2.5 text-sm text-white"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="text-xs text-slate-500 mb-1.5 block">E-mail</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="seu@email.com"
                  autoComplete="email"
                  required
                  className="finai-input w-full pl-9 pr-3 py-2.5 text-sm text-white"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-xs text-slate-500 mb-1.5 block">Senha</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="Crie uma senha segura"
                  autoComplete="new-password"
                  required
                  className="finai-input w-full pl-9 pr-10 py-2.5 text-sm text-white"
                />
                <button type="button" onClick={() => setShowPwd(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Strength bar */}
              {form.password.length > 0 && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1,2,3,4,5].map(i => (
                      <div key={i} className="flex-1 h-1 rounded-full transition-all duration-300"
                        style={{ background: i <= strength.score ? strength.color : 'rgba(255,255,255,0.08)' }} />
                    ))}
                  </div>
                  <p className="text-[10px]" style={{ color: strength.color }}>{strength.label}</p>
                </div>
              )}

              {/* Rules checklist */}
              {form.password.length > 0 && (
                <div className="mt-2 space-y-1">
                  {PW_RULES.map(rule => {
                    const ok = rule.test(form.password)
                    return (
                      <div key={rule.label} className="flex items-center gap-1.5">
                        {ok
                          ? <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                          : <X className="w-3 h-3 text-slate-600 flex-shrink-0" />}
                        <span className={cn('text-[10px]', ok ? 'text-emerald-400' : 'text-slate-600')}>
                          {rule.label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div>
              <label className="text-xs text-slate-500 mb-1.5 block">Confirmar senha</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={form.confirm}
                  onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
                  placeholder="Repita a senha"
                  autoComplete="new-password"
                  required
                  className={cn(
                    'finai-input w-full pl-9 pr-3 py-2.5 text-sm text-white',
                    form.confirm.length > 0 && !passwordsMatch && 'border-rose-500/40'
                  )}
                />
              </div>
              {form.confirm.length > 0 && !passwordsMatch && (
                <p className="text-[10px] text-rose-400 mt-1">As senhas não coincidem</p>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20 animate-fade-in">
                <AlertCircle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                <p className="text-xs text-rose-400">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={!canSubmit || loading}
              className={cn(
                'w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all mt-1',
                !canSubmit || loading
                  ? 'bg-primary-600/40 text-white/40 cursor-not-allowed'
                  : 'btn-primary'
              )}
            >
              {loading ? (
                <><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Criando conta...</>
              ) : (
                <><UserPlus className="w-4 h-4" /> Criar conta gratuita</>
              )}
            </button>
          </form>

          <p className="text-[11px] text-slate-600 text-center mt-4">
            Ao criar uma conta você concorda com nossos termos de uso
          </p>
        </div>
      </div>
    </div>
  )
}
