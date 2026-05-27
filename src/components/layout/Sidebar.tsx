'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { useUserStorage } from '@/hooks/useUserStorage'
import { ACCOUNTS } from '@/lib/mock-data'
import { GABRIEL_INITIAL_ACCOUNTS } from '@/lib/users'
import type { Account } from '@/lib/types'
import {
  LayoutDashboard, Landmark, TrendingUp, Users, CreditCard,
  Target, MessageSquare, Upload, Bell, Repeat,
  ChevronRight, Sparkles, LogOut, Settings, X, KeyRound,
  Check, Eye, EyeOff, RotateCcw,
} from 'lucide-react'

const ALL_NAV = [
  { id: 'dashboard',  label: 'Dashboard',   href: '/dashboard',  icon: LayoutDashboard, color: '#818CF8' },
  { id: 'contas',     label: 'Contas',       href: '/contas',     icon: Landmark,        color: '#60A5FA' },
  { id: 'consorcio',  label: 'Consórcio',   href: '/consorcio',  icon: TrendingUp,      color: '#34D399' },
  { id: 'gabriel',    label: 'Gabriel',      href: '/gabriel',    icon: Users,           color: '#F9A8D4' },
  { id: 'faturas',    label: 'Faturas',      href: '/faturas',    icon: CreditCard,      color: '#FB7185' },
  { id: 'metas',      label: 'Metas',        href: '/metas',      icon: Target,          color: '#FCD34D' },
  { id: 'assinaturas',label: 'Assinaturas',  href: '/assinaturas',icon: Repeat,          color: '#A78BFA' },
  { id: 'chat',       label: 'CFO IA',       href: '/chat',       icon: MessageSquare,   color: '#67E8F9' },
  { id: 'documentos', label: 'Documentos',   href: '/documentos', icon: Upload,          color: '#94A3B8' },
  { id: 'alertas',    label: 'Alertas',      href: '/alertas',    icon: Bell,            color: '#FB7185' },
]

export function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout, changePassword } = useAuth()

  // Live total balance from user accounts
  const initialAccounts: Account[] = user?.id === 'gabriel' ? GABRIEL_INITIAL_ACCOUNTS : ACCOUNTS.map(a => ({ ...a }))
  const [accounts] = useUserStorage<Account[]>('finai_accounts', initialAccounts)
  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0)

  // Pulsing live dot
  const [livePulse, setLivePulse] = useState(true)
  useEffect(() => {
    const id = setInterval(() => setLivePulse(v => !v), 2500)
    return () => clearInterval(id)
  }, [])

  // Unread alerts — also live from user storage
  const [alerts] = useUserStorage<Array<{ id: string; isRead: boolean }>>('finai_alerts', [])
  const unread = alerts.filter(a => !a.isRead).length

  // Profile photo from localStorage
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null)
  useEffect(() => {
    if (!user) return
    const photo = localStorage.getItem(`${user.id}_profile_photo`)
    if (photo) setProfilePhoto(photo)
  }, [user?.id])

  // Change password modal
  const [showPwModal, setShowPwModal] = useState(false)
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' })
  const [pwShow, setPwShow] = useState(false)
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState(false)

  const handleChangePassword = () => {
    setPwError('')
    if (!pwForm.current || !pwForm.next || !pwForm.confirm) { setPwError('Preencha todos os campos.'); return }
    if (pwForm.next !== pwForm.confirm) { setPwError('As novas senhas não coincidem.'); return }
    if (pwForm.next.length < 4) { setPwError('Senha muito curta (mínimo 4 caracteres).'); return }
    const ok = changePassword(pwForm.current, pwForm.next)
    if (!ok) { setPwError('Senha atual incorreta.'); return }
    setPwSuccess(true)
    setTimeout(() => { setShowPwModal(false); setPwForm({ current: '', next: '', confirm: '' }); setPwSuccess(false) }, 1500)
  }

  // Reset data modal
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
    window.location.reload()
  }

  const nav = ALL_NAV.filter(n => user?.nav.includes(n.id as never) ?? true)

  const handleLogout = () => {
    logout()
    router.replace('/login')
  }

  return (
    <>
      <aside className={cn(
        'fixed left-0 top-0 h-screen w-60 flex flex-col z-40',
        'bg-[#0D0D15] border-r border-[rgba(99,102,241,0.12)]',
        'sidebar-transition',
        'lg:translate-x-0',
        isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
      )}>
        {/* Mobile close */}
        <button onClick={onClose} className="lg:hidden absolute top-4 right-4 w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-300 hover:bg-white/[0.06] z-50">
          <X className="w-4 h-4" />
        </button>

        {/* Logo + online indicator */}
        <div className="px-5 pt-6 pb-4 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-glow-sm">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-bold text-lg tracking-tight">
              Fin<span className="gradient-text-primary">AI</span>
            </span>
            <div className="ml-auto flex items-center gap-1.5">
              <div className={cn('w-1.5 h-1.5 rounded-full bg-emerald-400 transition-all duration-700', livePulse ? 'opacity-100 scale-110 shadow-[0_0_6px_#34d399]' : 'opacity-60 scale-90')} />
              <span className="text-[9px] text-emerald-500 font-medium">online</span>
            </div>
          </div>
          <p className="text-[10px] text-slate-600 mt-0.5 ml-0.5">Seu CFO pessoal</p>
        </div>

        {/* Balance pill */}
        <div className="mx-4 mb-4 rounded-xl bg-primary-500/10 border border-primary-500/15 px-4 py-3 flex-shrink-0">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">Patrimônio</p>
          <p className="text-white font-bold text-lg mt-0.5 tabular-nums">
            R$ {totalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <div className="flex items-center gap-1 mt-1">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />
            <span className="text-[10px] text-slate-600">{accounts.length} conta{accounts.length !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
          {nav.map(({ id, label, href, icon: Icon, color }) => {
            const active = pathname === href
            return (
              <Link key={href} href={href} onClick={onClose}
                className={cn(
                  'group flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-150',
                  active ? 'nav-active text-white' : 'text-slate-500 hover:text-slate-200 hover:bg-white/[0.03]'
                )}>
                <div className="flex items-center gap-3">
                  <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center transition-all', active ? 'shadow-lg' : 'group-hover:scale-105')}
                    style={{ background: active ? `${color}22` : 'rgba(255,255,255,0.04)', boxShadow: active ? `0 0 12px ${color}30` : undefined }}>
                    <Icon className="w-4 h-4" style={{ color: active ? color : undefined }} />
                  </div>
                  <span className={cn('text-sm font-medium', active && 'text-white')}>{label}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {href === '/alertas' && unread > 0 && (
                    <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">{unread}</span>
                  )}
                  {active && <ChevronRight className="w-3 h-3 text-primary-400" />}
                </div>
              </Link>
            )
          })}
        </nav>

        {/* Score */}
        <div className="mx-4 mb-3 mt-2 p-3 rounded-xl border border-primary-500/12 bg-[rgba(22,22,30,0.6)] flex-shrink-0">
          <div className="flex justify-between mb-1.5">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">Score FinAI</span>
            <span className="text-xs font-bold text-amber-400">{user?.score ?? 742}</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-white/5">
            <div className="h-1.5 rounded-full transition-all duration-1000" style={{ width: `${((user?.score ?? 742) / 1000) * 100}%`, background: 'linear-gradient(90deg,#f59e0b,#f97316)', boxShadow: '0 0 8px rgba(245,158,11,0.4)' }} />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-amber-400">{(user?.score ?? 742) >= 750 ? 'Bom' : 'Regular'}</span>
            <span className="text-[10px] text-slate-600">Meta: 800</span>
          </div>
        </div>

        {/* User */}
        <div className="border-t border-white/[0.06] p-3 flex-shrink-0">
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/[0.03] cursor-pointer group">
            {/* Avatar: photo or initials */}
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 overflow-hidden"
              style={!profilePhoto ? { background: `linear-gradient(135deg, ${user?.color ?? '#6366f1'}, ${user?.color ?? '#6366f1'}99)` } : undefined}>
              {profilePhoto
                ? <img src={profilePhoto} alt="avatar" className="w-full h-full object-cover" />
                : <span>{user?.avatar ?? 'PR'}</span>
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-200 truncate">{user?.name ?? 'Paulo'}</p>
              <p className="text-[10px] text-slate-500 truncate">{user?.email ?? ''}</p>
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => setShowPwModal(true)}
                className="w-6 h-6 rounded-lg hover:bg-white/10 flex items-center justify-center"
                title="Alterar senha"
              >
                <Settings className="w-3 h-3 text-slate-500" />
              </button>
              <button
                onClick={() => setShowResetModal(true)}
                className="w-6 h-6 rounded-lg hover:bg-amber-500/20 flex items-center justify-center"
                title="Redefinir dados"
              >
                <RotateCcw className="w-3 h-3 text-slate-500 hover:text-amber-400" />
              </button>
              <button onClick={handleLogout} className="w-6 h-6 rounded-lg hover:bg-rose-500/20 flex items-center justify-center" title="Sair">
                <LogOut className="w-3 h-3 text-slate-500 hover:text-rose-400" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Change Password Modal */}
      {showPwModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => { setShowPwModal(false); setPwError(''); setPwForm({ current: '', next: '', confirm: '' }) }} />
          <div className="relative w-full max-w-sm bg-[#16161E] border border-white/[0.10] rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-primary-500/15 flex items-center justify-center">
                  <KeyRound className="w-4 h-4 text-primary-400" />
                </div>
                <h3 className="text-sm font-semibold text-white">Alterar senha</h3>
              </div>
              <button onClick={() => { setShowPwModal(false); setPwError(''); setPwForm({ current: '', next: '', confirm: '' }) }} className="w-7 h-7 rounded-lg hover:bg-white/[0.08] flex items-center justify-center text-slate-500 hover:text-slate-300">
                <X className="w-4 h-4" />
              </button>
            </div>

            {pwSuccess ? (
              <div className="flex flex-col items-center gap-3 py-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500/15 flex items-center justify-center">
                  <Check className="w-6 h-6 text-emerald-400" />
                </div>
                <p className="text-sm text-emerald-400 font-medium">Senha alterada com sucesso!</p>
              </div>
            ) : (
              <div className="space-y-4">
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
                    <button type="button" onClick={() => setPwShow(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
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
                </div>

                {pwError && (
                  <p className="text-xs text-rose-400 px-1">{pwError}</p>
                )}

                <div className="flex gap-3 pt-1">
                  <button onClick={() => { setShowPwModal(false); setPwError(''); setPwForm({ current: '', next: '', confirm: '' }) }} className="flex-1 py-2.5 rounded-xl bg-white/[0.04] text-sm text-slate-400 hover:text-slate-200 transition-all">
                    Cancelar
                  </button>
                  <button onClick={handleChangePassword} disabled={!pwForm.current || !pwForm.next || !pwForm.confirm} className="flex-1 py-2.5 rounded-xl btn-primary text-sm">
                    Salvar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reset Data Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowResetModal(false)} />
          <div className="relative w-full max-w-sm bg-[#16161E] border border-amber-500/20 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center">
                <RotateCcw className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Redefinir dados financeiros</h3>
                <p className="text-[11px] text-slate-500">Esta ação não pode ser desfeita</p>
              </div>
            </div>
            <p className="text-xs text-slate-400 mb-5 leading-relaxed">
              Todos os seus dados financeiros (contas, transações, metas, assinaturas, faturas) serão apagados e você começará do zero.
              Suas fotos de perfil e senha serão mantidas.
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
                className="flex-1 py-2.5 rounded-xl bg-amber-500/20 border border-amber-500/30 text-sm text-amber-300 hover:bg-amber-500/30 transition-all font-medium"
              >
                Sim, redefinir
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
