'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Sparkles, Mail, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function ForgotPasswordPage() {
  const supabase = createClient()
  const [email, setEmail]     = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent]       = useState(false)
  const [error, setError]     = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      { redirectTo: `${window.location.origin}/auth/callback?next=/reset-password` }
    )

    setLoading(false)

    if (resetError) {
      setError('Não foi possível enviar o e-mail. Verifique o endereço e tente novamente.')
      return
    }

    // Always show success (don't reveal if email exists — security best practice)
    setSent(true)
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-[#09090F] grid-bg flex items-center justify-center p-4">
        <div className="w-full max-w-sm animate-scale-in text-center">
          <div className="bg-[#16161E] border border-primary-500/20 rounded-2xl p-8 shadow-card">
            <div className="w-14 h-14 rounded-full bg-primary-500/15 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-7 h-7 text-primary-400" />
            </div>
            <h2 className="text-base font-bold text-white mb-2">E-mail enviado!</h2>
            <p className="text-sm text-slate-400 mb-1">
              Se o e-mail <span className="text-white font-medium">{email}</span> estiver cadastrado,
              você receberá um link para redefinir sua senha.
            </p>
            <p className="text-xs text-slate-600 mb-6">Verifique também sua pasta de spam.</p>
            <Link href="/login" className="block w-full py-2.5 rounded-xl btn-primary text-sm font-semibold text-center">
              Voltar ao Login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#09090F] grid-bg flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-primary-500/6 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm animate-scale-in">
        <div className="text-center mb-7">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-glow mx-auto mb-3">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Fin<span className="gradient-text-primary">AI</span></h1>
        </div>

        <div className="bg-[#16161E] border border-white/[0.08] rounded-2xl p-6 shadow-card">
          <Link href="/login" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors mb-4">
            <ArrowLeft className="w-3.5 h-3.5" /> Voltar ao login
          </Link>

          <h2 className="text-base font-semibold text-white mb-1">Recuperar senha</h2>
          <p className="text-xs text-slate-500 mb-5">
            Informe seu e-mail e enviaremos um link para redefinir sua senha.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-slate-500 mb-1.5 block">E-mail cadastrado</label>
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

            {error && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20 animate-fade-in">
                <AlertCircle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                <p className="text-xs text-rose-400">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={!email || loading}
              className={cn(
                'w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all',
                !email || loading ? 'bg-primary-600/40 text-white/40 cursor-not-allowed' : 'btn-primary'
              )}
            >
              {loading
                ? <><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Enviando...</>
                : <><Mail className="w-4 h-4" /> Enviar link de recuperação</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
