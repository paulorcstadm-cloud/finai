'use client'

import { useEffect } from 'react'
import { RefreshCw, AlertTriangle } from 'lucide-react'

export default function GlobalError({
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
    <html>
      <body style={{ background: '#09090F', margin: 0, fontFamily: 'system-ui, sans-serif' }}>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          }}
        >
          <div
            style={{
              background: '#16161E',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: '16px',
              padding: '32px',
              maxWidth: '400px',
              width: '100%',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                background: 'rgba(239,68,68,0.1)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <AlertTriangle style={{ width: 32, height: 32, color: '#f87171' }} />
            </div>
            <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: 600, marginBottom: '8px' }}>
              Erro crítico
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '24px' }}>
              {error.message || 'Ocorreu um erro crítico. Por favor, recarregue a página.'}
            </p>
            <button
              onClick={reset}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                background: '#6366f1',
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              <RefreshCw style={{ width: 16, height: 16 }} />
              Recarregar
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
