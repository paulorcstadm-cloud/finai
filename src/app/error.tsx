'use client'

import { useEffect } from 'react'
import { RefreshCw, AlertTriangle } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen bg-[#09090F] flex items-center justify-center p-6">
      <div className="bg-[#16161E] border border-red-500/20 rounded-2xl p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8 text-red-400" />
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">Algo deu errado</h2>
        <p className="text-slate-400 text-sm mb-6">
          {error.message || 'Ocorreu um erro inesperado. Tente novamente.'}
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-medium transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Tentar novamente
        </button>
      </div>
    </div>
  )
}
