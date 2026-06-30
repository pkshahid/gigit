import { ReactNode } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-bento-900/40 dark:bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-bento-lg border border-bento-200 bg-white p-4 shadow-bento-lg dark:border-bento-800 dark:bg-bento-900 dark:shadow-bento-dark-md sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-bento-800 dark:text-bento-100">{title}</h2>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-bento-sm border border-bento-200 bg-white text-bento-500 transition-all hover:border-bento-300 hover:bg-bento-50 dark:border-bento-700 dark:bg-bento-800 dark:text-bento-400 dark:hover:bg-bento-700">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
