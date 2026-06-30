import { useState, useCallback, createContext, useContext, type ReactNode } from 'react'
import { Modal } from './Modal'
import { AlertTriangle } from 'lucide-react'

export interface ConfirmOptions {
  title: string
  message: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'warning' | 'primary'
  onConfirm: () => void | Promise<void>
}

export function ConfirmDialog({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null)
  const [busy, setBusy] = useState(false)

  const confirm = useCallback((opts: ConfirmOptions) => {
    setOptions(opts)
  }, [])

  const close = useCallback(() => {
    if (busy) return
    setOptions(null)
  }, [busy])

  const handleConfirm = useCallback(async () => {
    if (!options) return
    setBusy(true)
    try {
      await options.onConfirm()
    } finally {
      setBusy(false)
      setOptions(null)
    }
  }, [options])

  const variantClass =
    options?.variant === 'danger'
      ? 'btn btn-sm bg-red-600 text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800'
      : options?.variant === 'warning'
      ? 'btn btn-sm bg-amber-600 text-white hover:bg-amber-700 dark:bg-amber-700 dark:hover:bg-amber-800'
      : 'btn btn-primary btn-sm'

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Modal open={!!options} onClose={close} title={options?.title || ''}>
        <div className="flex gap-3">
          <div className="shrink-0">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-bento-sm ${
                options?.variant === 'danger'
                  ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                  : options?.variant === 'warning'
                  ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
                  : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
              }`}
            >
              <AlertTriangle size={20} />
            </div>
          </div>
          <div className="flex-1 text-sm text-bento-600 dark:text-bento-300">
            {options?.message}
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={close} disabled={busy} className="btn btn-secondary btn-sm">
            {options?.cancelLabel || 'Cancel'}
          </button>
          <button onClick={handleConfirm} disabled={busy} className={variantClass}>
            {busy ? '...' : options?.confirmLabel || 'Confirm'}
          </button>
        </div>
      </Modal>
    </ConfirmContext.Provider>
  )
}

type ConfirmFn = (opts: ConfirmOptions) => void
const ConfirmContext = createContext<ConfirmFn | null>(null)

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm must be used within a ConfirmDialog provider')
  return ctx
}
