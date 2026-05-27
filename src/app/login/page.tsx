'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Sparkles, Eye, EyeOff, LogIn, AlertCircle, Mail, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  // Show messages from URL params (e.g. after email verify)
  useEffect(() => {
    const msg = searchParams.get('message')
    const err = searchParams.get('error')
    if (msg) setInfo(msg)
    if (err) setError(err)
  }, [searchParams])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setInfo('')
    setLoading(true)

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    })

    if (signInError) {
      const m      = signInError.message.toLowerCase()
      const status = signInError.status ?? 0
      const msg =
        m.includes('invalid login') || m.includes('invalid credentials') || m.includes('invalid email or password')
          ? 'E-mail ou senha incorretos.'
          : m.includes('email not confirmed')
            ? 'Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada (e o spam).'
            : m.includes('too many') || m.includes('rate limit') || m.includes('security purposes') || status === 429
              ? 'Muitas tentativas. Aguarde alguns minutos e tente novamente.'
              : m.includes('network') || m.includes('fetch') || m.includes('failed to fetch')
                ? 'Erro de conexão. Verifique sua internet e tente novamente.'
                : m.includes('user not found') || m.includes('no user found')
                  ? 'E-mail não cadastrado. Verifique ou crie uma conta.'
                  : 'Erro ao entrar. Tente novamente.'
      setError(msg)
      setLoading(false)
      return
    }

    router.replace('/dashboard')
  }

  return (
    <div className="min-h-screen bg-[#09090F] grid-bg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-primary-500/8 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-emerald-500/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm animate-scale-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-glow mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">
            Fin<span className="gradient-text-primary">AI</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">Seu CFO pessoal inteligente</p>
        </div>

        {/* Card */}
        <div className="bg-[#16161E] border border-white/[0.08] rounded-2xl p-6 shadow-card">
          <h2 className="text-base font-semibold text-white mb-1">Entrar na sua conta</h2>
          <p className="text-xs text-slate-500 mb-6">
            Novo por aqui?{' '}
            <Link href="/register" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">
              Criar conta grátis
            </Link>
          </p>

          {/* Info banner (e.g. "email confirmed") */}
          {info && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 mb-4 animate-fade-in">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
              <p className="text-xs text-emerald-400">{info}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email */}
            <div>
              <label className="text-xs text-slate-500 mb-1.5 block">E-mail</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError('') }}
                  placeholder="seu@email.com"
                  autoComplete="email"
                  required
                  className="finai-input w-full pl-9 pr-3 py-2.5 text-sm text-white"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs text-slate-500">Senha</label>
                <Link href="/forgot-password" className="text-[11px] text-slate-500 hover:text-primary-400 transition-colors">
                  Esqueci a senha
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError('') }}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  className="finai-input w-full pl-9 pr-10 py-2.5 text-sm text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
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
              disabled={!email || !password || loading}
              className={cn(
                'w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all mt-2',
                loading || !email || !password
                  ? 'bg-primary-600/40 text-white/40 cursor-not-allowed'
                  : 'btn-primary'
              )}
            >
              {loading ? (
                <><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Entrando...</>
              ) : (
                <><LogIn className="w-4 h-4" /> Entrar no FinAI</>
              )}
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-white/[0.06] text-center">
            <p className="text-[11px] text-slate-600">
              🔒 Seus dados são protegidos por criptografia
            </p>
          </div>
        </div>

        <p className="text-[10px] text-slate-700 text-center mt-4">FinAI · Todos os direitos reservados</p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#09090F] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary-500/30 border-t-primary-500 animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
