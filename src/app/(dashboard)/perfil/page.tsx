'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import {
  UserCog, Lock, Eye, EyeOff, Check, X, AlertTriangle,
  Camera, Mail, Shield, Trash2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const PW_RULES = [
  { label: 'Mínimo 8 caracteres',      test: (pw: string) => pw.length >= 8 },
  { label: 'Letra maiúscula (A-Z)',    test: (pw: string) => /[A-Z]/.test(pw) },
  { label: 'Letra minúscula (a-z)',    test: (pw: string) => /[a-z]/.test(pw) },
  { label: 'Número (0-9)',             test: (pw: string) => /\d/.test(pw) },
  { label: 'Caractere especial (!@#)', test: (pw: string) => /[^A-Za-z0-9]/.test(pw) },
]

export default function PerfilPage() {
  const { user, refreshUser } = useAuth()
  const supabase = createClient()
  const fileRef = useRef<HTMLInputElement>(null)

  // ── Profile photo ─────────────────────────────────────────────────────────
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null)
  useEffect(() => {
    if (!user) return
    const photo = localStorage.getItem(`${user.id}_profile_photo`)
    if (photo) setProfilePhoto(photo)
  }, [user?.id])

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const result = ev.target?.result as string
      if (user) localStorage.setItem(`${user.id}_profile_photo`, result)
      setProfilePhoto(result)
    }
    reader.readAsDataURL(file)
  }

  // ── Personal data ─────────────────────────────────────────────────────────
  const [name, setName] = useState(user?.fullName ?? '')
  const [nameLoading, setNameLoading] = useState(false)
  const [nameSuccess, setNameSuccess] = useState(false)
  const [nameError, setNameError] = useState('')

  useEffect(() => { setName(user?.fullName ?? '') }, [user?.fullName])

  const saveName = async () => {
    if (!name.trim() || !user) return
    setNameLoading(true)
    setNameError('')
    setNameSuccess(false)
    const { error } = await supabase.from('profiles').update({ name: name.trim() }).eq('id', user.id)
    setNameLoading(false)
    if (error) { setNameError('Não foi possível salvar. Tente novamente.'); return }
    setNameSuccess(true)
    await refreshUser()
    setTimeout(() => setNameSuccess(false), 2500)
  }

  // ── Change password ───────────────────────────────────────────────────────
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' })
  const [pwShow, setPwShow] = useState(false)
  const [pwLoading, setPwLoading] = useState(false)
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState(false)

  const allPwRules = PW_RULES.every(r => r.test(pwForm.next))
  const pwMatch = pwForm.next === pwForm.confirm && pwForm.confirm.length > 0
  const canSavePw = !!pwForm.current && allPwRules && pwMatch

  const handleChangePassword = async () => {
    if (!canSavePw || !user?.email) return
    setPwLoading(true)
    setPwError('')
    setPwSuccess(false)

    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: pwForm.current,
    })
    if (signInErr) { setPwError('Senha atual incorreta.'); setPwLoading(false); return }

    const { error: updateErr } = await supabase.auth.updateUser({ password: pwForm.next })
    setPwLoading(false)
    if (updateErr) { setPwError('Não foi possível alterar a senha. Tente novamente.'); return }

    setPwSuccess(true)
    setPwForm({ current: '', next: '', confirm: '' })
    setTimeout(() => setPwSuccess(false), 3000)
  }

  // ── Danger zone — reset data ──────────────────────────────────────────────
  const [showResetModal, setShowResetModal] = useState(false)

  const handleReset = () => {
    if (!user) return
    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && (key.startsWith(`${user.id}_finai`) || key.startsWith('finai_'))) {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k))
    window.location.href = '/dashboard'
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary-500/15 flex items-center justify-center">
          <UserCog className="w-5 h-5 text-primary-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Meu Perfil</h1>
          <p className="text-sm text-slate-500">Gerencie suas informações pessoais e segurança</p>
        </div>
      </div>

      {/* Avatar section */}
      <div className="rounded-2xl bg-[#16161E] border border-white/[0.06] p-6">
        <h2 className="text-sm font-semibold text-white mb-4">Foto de Perfil</h2>
        <div className="flex items-center gap-5">
          <div className="relative">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-white text-xl font-bold overflow-hidden border-2 border-white/10"
              style={!profilePhoto ? { background: `linear-gradient(135deg, ${user?.color ?? '#6366f1'}, ${user?.color ?? '#6366f1'}99)` } : undefined}
            >
              {profilePhoto
                ? <img src={profilePhoto} alt="avatar" className="w-full h-full object-cover" />
                : <span>{user?.avatar ?? 'U'}</span>
              }
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary-600 border-2 border-[#16161E] flex items-center justify-center hover:bg-primary-500 transition-colors"
            >
              <Camera className="w-3.5 h-3.5 text-white" />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-200">{user?.fullName ?? ''}</p>
            <p className="text-xs text-slate-500 mt-0.5">{user?.email ?? ''}</p>
            <button
              onClick={() => fileRef.current?.click()}
              className="mt-2 text-xs text-primary-400 hover:text-primary-300 transition-colors"
            >
              Alterar foto
            </button>
          </div>
        </div>
      </div>

      {/* Personal data */}
      <div className="rounded-2xl bg-[#16161E] border border-white/[0.06] p-6 space-y-4">
        <h2 className="text-sm font-semibold text-white">Dados Pessoais</h2>

        {/* Name */}
        <div>
          <label className="text-xs text-slate-500 mb-1.5 block">Nome completo</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={name}
              onChange={e => { setName(e.target.value); setNameError(''); setNameSuccess(false) }}
              onKeyDown={e => e.key === 'Enter' && saveName()}
              placeholder="Seu nome completo"
              className="finai-input flex-1 px-3 py-2.5 text-sm text-white"
            />
            <button
              onClick={saveName}
              disabled={nameLoading || !name.trim()}
              className={cn(
                'px-4 py-2.5 rounded-xl text-sm font-medium transition-all',
                nameLoading || !name.trim()
                  ? 'bg-white/[0.04] text-slate-600 cursor-not-allowed'
                  : 'btn-primary'
              )}
            >
              {nameLoading ? '...' : nameSuccess ? <Check className="w-4 h-4" /> : 'Salvar'}
            </button>
          </div>
          {nameError && <p className="text-xs text-rose-400 mt-1.5 px-1">{nameError}</p>}
          {nameSuccess && <p className="text-xs text-emerald-400 mt-1.5 px-1">Nome atualizado com sucesso!</p>}
        </div>

        {/* Email — read only */}
        <div>
          <label className="text-xs text-slate-500 mb-1.5 block">E-mail</label>
          <div className="relative">
            <div className="finai-input flex items-center gap-2 px-3 py-2.5 opacity-60 cursor-not-allowed select-none">
              <Mail className="w-4 h-4 text-slate-500 flex-shrink-0" />
              <span className="text-sm text-slate-400 truncate">{user?.email ?? ''}</span>
              <Lock className="w-3.5 h-3.5 text-slate-600 ml-auto flex-shrink-0" />
            </div>
          </div>
          <p className="text-[11px] text-slate-600 mt-1.5 px-1">Alterar e-mail via configurações do Supabase</p>
        </div>

        {/* Score */}
        <div>
          <label className="text-xs text-slate-500 mb-1.5 block">Score FinAI</label>
          <div className="flex items-center gap-3">
            <span
              className="px-4 py-1.5 rounded-full text-sm font-bold border"
              style={{
                color: '#f59e0b',
                background: 'rgba(245,158,11,0.12)',
                borderColor: 'rgba(245,158,11,0.25)',
              }}
            >
              {user?.score ?? 742}
            </span>
            <div className="flex-1 h-2 rounded-full bg-white/5">
              <div
                className="h-2 rounded-full"
                style={{
                  width: `${((user?.score ?? 742) / 1000) * 100}%`,
                  background: 'linear-gradient(90deg,#f59e0b,#f97316)',
                  boxShadow: '0 0 8px rgba(245,158,11,0.4)',
                }}
              />
            </div>
            <span className="text-xs text-slate-500">/ 1000</span>
          </div>
        </div>
      </div>

      {/* Change password */}
      <div className="rounded-2xl bg-[#16161E] border border-white/[0.06] p-6 space-y-4">
        <div className="flex items-center gap-2.5">
          <Shield className="w-4 h-4 text-primary-400" />
          <h2 className="text-sm font-semibold text-white">Alterar Senha</h2>
        </div>

        {pwSuccess ? (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <Check className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <p className="text-sm text-emerald-400 font-medium">Senha alterada com sucesso!</p>
          </div>
        ) : (
          <>
            <div>
              <label className="text-xs text-slate-500 mb-1.5 block">Senha atual</label>
              <div className="relative">
                <input
                  type={pwShow ? 'text' : 'password'}
                  value={pwForm.current}
                  onChange={e => { setPwForm(f => ({ ...f, current: e.target.value })); setPwError('') }}
                  placeholder="Digite a senha atual"
                  className="finai-input w-full px-3 py-2.5 pr-10 text-sm text-white"
                />
                <button
                  type="button"
                  onClick={() => setPwShow(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {pwShow ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-500 mb-1.5 block">Nova senha</label>
              <input
                type={pwShow ? 'text' : 'password'}
                value={pwForm.next}
                onChange={e => { setPwForm(f => ({ ...f, next: e.target.value })); setPwError('') }}
                placeholder="Nova senha"
                className="finai-input w-full px-3 py-2.5 text-sm text-white"
              />
              {/* PW rules */}
              {pwForm.next.length > 0 && (
                <div className="mt-2 space-y-1">
                  {PW_RULES.map(r => (
                    <div key={r.label} className="flex items-center gap-1.5">
                      {r.test(pwForm.next)
                        ? <Check className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                        : <X className="w-3 h-3 text-slate-600 flex-shrink-0" />}
                      <span className={cn('text-[11px]', r.test(pwForm.next) ? 'text-emerald-400' : 'text-slate-600')}>
                        {r.label}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="text-xs text-slate-500 mb-1.5 block">Confirmar nova senha</label>
              <input
                type={pwShow ? 'text' : 'password'}
                value={pwForm.confirm}
                onChange={e => { setPwForm(f => ({ ...f, confirm: e.target.value })); setPwError('') }}
                placeholder="Repetir nova senha"
                onKeyDown={e => e.key === 'Enter' && handleChangePassword()}
                className="finai-input w-full px-3 py-2.5 text-sm text-white"
              />
              {pwForm.confirm.length > 0 && (
                <p className={cn('text-[11px] mt-1 px-1', pwMatch ? 'text-emerald-400' : 'text-rose-400')}>
                  {pwMatch ? 'Senhas coincidem' : 'Senhas não coincidem'}
                </p>
              )}
            </div>

            {pwError && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <p className="text-xs text-rose-400">{pwError}</p>
              </div>
            )}

            <button
              onClick={handleChangePassword}
              disabled={!canSavePw || pwLoading}
              className={cn(
                'w-full py-2.5 rounded-xl text-sm font-medium transition-all',
                canSavePw && !pwLoading ? 'btn-primary' : 'bg-white/[0.04] text-slate-600 cursor-not-allowed'
              )}
            >
              {pwLoading ? 'Aguarde...' : 'Salvar nova senha'}
            </button>
          </>
        )}
      </div>

      {/* Danger zone */}
      <div className="rounded-2xl bg-[#16161E] border border-rose-500/20 p-6 space-y-4">
        <div className="flex items-center gap-2.5">
          <AlertTriangle className="w-4 h-4 text-rose-400" />
          <h2 className="text-sm font-semibold text-white">Zona de Perigo</h2>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          A redefinição apaga todos os seus dados financeiros locais (contas, transações, metas, assinaturas, faturas).
          Sua foto de perfil e senha são mantidas.
        </p>
        <button
          onClick={() => setShowResetModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-sm text-rose-400 hover:bg-rose-500/20 transition-all font-medium"
        >
          <Trash2 className="w-4 h-4" />
          Redefinir todos os dados financeiros
        </button>
      </div>

      {/* Reset confirm modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowResetModal(false)} />
          <div className="relative w-full max-w-sm bg-[#16161E] border border-rose-500/25 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Redefinir dados financeiros</h3>
                <p className="text-[11px] text-slate-500">Esta ação não pode ser desfeita</p>
              </div>
            </div>
            <p className="text-xs text-slate-400 mb-5 leading-relaxed">
              Todos os seus dados financeiros (contas, transações, metas, assinaturas, faturas) serão apagados e você começará do zero.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowResetModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-white/[0.04] text-sm text-slate-400 hover:text-slate-200 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleReset}
                className="flex-1 py-2.5 rounded-xl bg-rose-500/20 border border-rose-500/30 text-sm text-rose-300 hover:bg-rose-500/30 transition-all font-medium"
              >
                Sim, redefinir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
