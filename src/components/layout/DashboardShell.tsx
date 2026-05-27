'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from './Sidebar'
import { FAB } from '@/components/shared/FAB'
import { Menu, Sparkles, Bell } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useUserStorage } from '@/hooks/useUserStorage'
import { cn } from '@/lib/utils'

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [tick, setTick] = useState(0)
  const [alerts] = useUserStorage<Array<{ isRead: boolean }>>('finai_alerts', [])
  const unread = alerts.filter(a => !a.isRead).length

  // Auth guard
  useEffect(() => {
    if (!loading && !user) router.replace('/login')
  }, [loading, user, router])

  useEffect(() => {
    setSidebarOpen(false)
  }, [])

  useEffect(() => {
    if (sidebarOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [sidebarOpen])

  // Subtle "live" pulse every 3 seconds
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 3000)
    return () => clearInterval(id)
  }, [])

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090F] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-glow animate-pulse">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div className="flex gap-1">
            {[0,1,2].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />)}
          </div>
        </div>
      </div>
    )
  }

  // Not authenticated — render nothing while redirecting
  if (!user) return null

  return (
    <div className="flex min-h-screen bg-[#09090F] grid-bg">
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/70 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} aria-hidden />
      )}

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col lg:ml-60 min-h-screen">
        {/* Mobile top bar */}
        <header className="lg:hidden sticky top-0 z-20 flex items-center justify-between px-4 py-3 bg-[#09090F]/95 backdrop-blur-md border-b border-[rgba(99,102,241,0.15)]">
          <button onClick={() => setSidebarOpen(true)} className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:bg-primary-500/10 hover:text-slate-200 transition-colors">
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-glow-sm">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-white font-bold text-base tracking-tight">
              Fin<span className="gradient-text-primary">AI</span>
            </span>
            {/* Live indicator */}
            <div className="flex items-center gap-1 ml-1">
              <div className={cn('w-1.5 h-1.5 rounded-full bg-emerald-400 transition-all duration-500', tick % 2 === 0 ? 'opacity-100 scale-100' : 'opacity-40 scale-75')} />
            </div>
          </div>

          <Link href="/alertas" className="relative w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:bg-primary-500/10 hover:text-slate-200 transition-colors">
            <Bell className="w-5 h-5" />
            {unread > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 border-2 border-[#09090F]" />}
          </Link>
        </header>

        <main className="flex-1 overflow-x-hidden">{children}</main>
      </div>

      <FAB />
    </div>
  )
}
