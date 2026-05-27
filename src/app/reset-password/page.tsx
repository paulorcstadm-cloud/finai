'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Sparkles, Eye, EyeOff, Lock, CheckCircle2, AlertCircle, X,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const PW_RULES = [
  { label: 'Mínimo 8 caracteres',      test: (pw: string) => pw.length >= 8 },
  { label: 'Letra maiúscula (A-Z)',    test: (pw: string) => /[A-Z]/.test(pw) },
  { label: 'Letra minúscula (a-z)',    test: (pw: string) => /[a-z]/.test(pw) },
  { label: 'Número (0-9)',             test: (pw: string) => /\d/.test(pw) },
  { label: 'Caractere especial (!@#)', test: (pw: string) => /[^A-Za-z0-9]/.test(pw) },
]

export default function ResetPasswordPage() {
  const supabase  = createClient()
  const router    = useRouter()

  const [password, setPassword]   = useState('')
  const [confirm, setConfirm]     = useState('')
  const [showPwd, setShowPwd]     = useState(false)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [success, setSuccess]     = useState(false)

  const allPassed = PW_RULES.every(r => r.test(password))
  const match     = password === confirm && confirm.length > 0
  const canSubmit = allPassed && match

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setError('')
    setLoading(true)

    const { error: updateError } = await supabase.auth.updateUser({ password })

    setLoading(false)

    if (updateError) {
      setError('Não foi possível atualizar a senha. O link pode ter expirado. Solicite um novo.')
      return
    }

    setSuccess(true)

    // Sign out so the user logs in cleanly with the new password
    await supabase.auth.signOut()
    setTimeout(() => router.replace('/login?message=Senha atualizada com sucesso! Faça login.'), 2000)
  }

  return (
    <div className="min-h-screen bg-[#09090F] grid-bg flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-primary-500/6 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm animate-scale-in">
        <div className="text-center mb-7">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-glow mx-auto mb-3">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Fin<span className="gradient-text-primary">AI</span></h1>
        </div>

        <div className="bg-[#16161E] border border-white/[0.08] rounded-2xl p-6 shadow-card">
          {success ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-7 h-7 text-emerald-400" />
              </div>
              <h2 className="text-base font-bold text-white mb-2">Senha redefinida!</h2>
              <p className="text-sm text-slate-400">Redirecionando para o login...</p>
            </div>
          ) : (
            <>
              <h2 className="text-base font-semibold text-white mb-1">Nova senha</h2>
              <p className="text-xs text-slate-500 mb-5">Crie uma senha segura para sua conta.</p>

              <form onSubmit={handleReset} className="space-y-4">
                {/* New password */}
                <div>
                  <label className="text-xs text-slate-500 mb-1.5 block">Nova senha</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPwd ? 'text' : 'password'}
                      value={password}
                      onChange={e => { setPassword(e.target.value); setError('') }}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      required
                      className="finai-input w-full pl-9 pr-10 py-2.5 text-sm text-white"
                    />
                    <button type="button" onClick={() => setShowPwd(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                      {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {/* Rules */}
                  {password.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {PW_RULES.map(rule => {
                        const ok = rule.test(password)
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

                {/* Confirm */}
                <div>
                  <label className="text-xs text-slate-500 mb-1.5 block">Confirmar nova senha</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPwd ? 'text' : 'password'}
                      value={confirm}
                      onChange={e => { setConfirm(e.target.value); setError('') }}
                      placeholder="Repita a senha"
                      autoComplete="new-password"
                      required
                      className={cn(
                        'finai-input w-full pl-9 pr-3 py-2.5 text-sm text-white',
                        confirm.length > 0 && !match && 'border-rose-500/40'
                      )}
                    />
                  </div>
                  {confirm.length > 0 && !match && (
                    <p className="text-[10px] text-rose-400 mt-1">As senhas não coincidem</p>
                  )}
                </div>

                {error && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20 animate-fade-in">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                    <p className="text-xs text-rose-400">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!canSubmit || loading}
                  className={cn(
                    'w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all',
                    !canSubmit || loading ? 'bg-primary-600/40 text-white/40 cursor-not-allowed' : 'btn-primary'
                  )}
                >
                  {loading
                    ? <><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Salvando...</>
                    : <><Lock className="w-4 h-4" /> Redefinir senha</>}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
