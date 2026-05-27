'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Sparkles, Eye, EyeOff, LogIn, AlertCircle, Camera } from 'lucide-react'
import { cn } from '@/lib/utils'

const USERS = [
  { id: 'paulo', label: 'Paulo Ricardo', avatar: 'PR', color: '#6366f1', hint: 'Administrador' },
  { id: 'gabriel', label: 'Gabriel Henrique', avatar: 'GH', color: '#10b981', hint: 'Usuário' },
]

export default function LoginPage() {
  const router = useRouter()
  const { login, user, loading } = useAuth()
  const [userId, setUserId] = useState('paulo')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [profilePhotos, setProfilePhotos] = useState<Record<string, string>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Already logged in → go to dashboard
  useEffect(() => {
    if (!loading && user) router.replace('/dashboard')
  }, [user, loading, router])

  // Load profile photos from localStorage
  useEffect(() => {
    const photos: Record<string, string> = {}
    USERS.forEach(u => {
      try {
        const photo = localStorage.getItem(`${u.id}_profile_photo`)
        if (photo) photos[u.id] = photo
      } catch {}
    })
    setProfilePhotos(photos)
  }, [])

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = reader.result as string
      try { localStorage.setItem(`${userId}_profile_photo`, base64) } catch {}
      setProfilePhotos(prev => ({ ...prev, [userId]: base64 }))
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    await new Promise(r => setTimeout(r, 500))
    const ok = login(userId, password)
    if (ok) {
      router.replace('/dashboard')
    } else {
      setError('Senha incorreta. Tente novamente.')
      setSubmitting(false)
    }
  }

  const selectedUser = USERS.find(u => u.id === userId)!

  if (loading) return (
    <div className="min-h-screen bg-[#09090F] flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-primary-500/30 border-t-primary-500 animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-[#09090F] grid-bg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Hidden file input — shared, always uploads for currently selected user */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handlePhotoUpload}
      />

      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-primary-500/8 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-emerald-500/6 blur-3xl" />
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
          <p className="text-xs text-slate-500 mb-6">Selecione seu usuário e confirme a senha</p>

          {/* User selector */}
          <div className="flex gap-3 mb-2">
            {USERS.map(u => (
              <button
                key={u.id}
                type="button"
                onClick={() => { setUserId(u.id); setError('') }}
                className={cn(
                  'flex-1 flex flex-col items-center gap-2 p-3 rounded-xl border transition-all',
                  userId === u.id
                    ? 'border-primary-500/40 bg-primary-500/8 shadow-glow-sm'
                    : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]'
                )}
              >
                {/* Avatar */}
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white text-sm font-bold overflow-hidden"
                  style={{
                    background: profilePhotos[u.id] ? undefined : `linear-gradient(135deg, ${u.color}, ${u.color}99)`,
                    boxShadow: userId === u.id ? `0 0 14px ${u.color}50` : undefined,
                  }}
                >
                  {profilePhotos[u.id]
                    ? <img src={profilePhotos[u.id]} alt={u.label} className="w-full h-full object-cover" />
                    : u.avatar}
                </div>
                <div className="text-center">
                  <p className={cn('text-xs font-semibold', userId === u.id ? 'text-white' : 'text-slate-400')}>
                    {u.id === 'paulo' ? 'Paulo' : 'Gabriel'}
                  </p>
                  <p className="text-[10px] text-slate-600">{u.hint}</p>
                </div>
                {userId === u.id && (
                  <div className="w-2 h-2 rounded-full" style={{ background: u.color }} />
                )}
              </button>
            ))}
          </div>

          {/* Photo upload link — outside user card buttons, no nesting issues */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 mb-4 text-[11px] text-slate-600 hover:text-slate-400 transition-colors"
          >
            <Camera className="w-3 h-3" />
            Trocar foto de {selectedUser.id === 'paulo' ? 'Paulo' : 'Gabriel'}
          </button>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Username display */}
            <div>
              <label className="text-xs text-slate-500 mb-1.5 block">Usuário</label>
              <div className="finai-input px-3 py-2.5 flex items-center gap-2.5">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 overflow-hidden"
                  style={!profilePhotos[selectedUser.id] ? { background: `linear-gradient(135deg, ${selectedUser.color}, ${selectedUser.color}99)` } : undefined}
                >
                  {profilePhotos[selectedUser.id]
                    ? <img src={profilePhotos[selectedUser.id]} alt={selectedUser.label} className="w-full h-full object-cover" />
                    : selectedUser.avatar}
                </div>
                <span className="text-sm text-white">{selectedUser.label}</span>
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-xs text-slate-500 mb-1.5 block">Senha</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError('') }}
                  placeholder="Digite sua senha"
                  autoFocus
                  className="finai-input w-full px-3 py-2.5 pr-10 text-sm text-white"
                  required
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
              disabled={!password || submitting}
              className={cn(
                'w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all',
                submitting || !password ? 'bg-primary-600/40 text-white/40 cursor-not-allowed' : 'btn-primary'
              )}
            >
              {submitting ? (
                <><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Entrando...</>
              ) : (
                <><LogIn className="w-4 h-4" /> Entrar no FinAI</>
              )}
            </button>
          </form>

          <div className="mt-4 pt-4 border-t border-white/[0.06]">
            <p className="text-[11px] text-slate-600 text-center">
              Seus dados ficam protegidos e armazenados localmente
            </p>
          </div>
        </div>

        <p className="text-[10px] text-slate-700 text-center mt-4">FinAI v1.0 · Dados armazenados em seu dispositivo</p>
      </div>
    </div>
  )
}
