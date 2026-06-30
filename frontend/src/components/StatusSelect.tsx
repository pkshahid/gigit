import { useState, useRef, useEffect } from 'react'
import { api } from '../api/client'
import { Application, STATUS_OPTIONS } from '../types'
import { ChevronDown, Check } from 'lucide-react'
import { useConfirm } from './ConfirmDialog'

const statusColors: Record<string, string> = {
  applied: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  interview: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  offer: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  accepted: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
}

interface Props {
  app: Application
  onUpdated: () => void
}

export function StatusSelect({ app, onUpdated }: Props) {
  const [open, setOpen] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  const confirm = useConfirm()

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  const handleSelect = async (newStatus: string) => {
    if (newStatus === app.status) {
      setOpen(false)
      return
    }
    if (newStatus === 'rejected') {
      setOpen(false)
      confirm({
        title: 'Reject Application',
        message: `Mark this application as rejected? This will move it to the "Rejected" status.`,
        confirmLabel: 'Reject',
        variant: 'danger',
        onConfirm: () => doUpdate(newStatus),
      })
      return
    }
    doUpdate(newStatus)
  }

  const doUpdate = async (newStatus: string) => {
    setUpdating(true)
    setError('')
    try {
      await api.updateApplication(app.id, { ...app, status: newStatus })
      setOpen(false)
      onUpdated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status')
    } finally {
      setUpdating(false)
    }
  }

  const color = statusColors[app.status] || 'bg-bento-100 text-bento-600 dark:bg-bento-800 dark:text-bento-400'

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        disabled={updating}
        className={`badge ${color} inline-flex items-center gap-1 transition-all hover:opacity-80 ${updating ? 'opacity-50' : ''}`}
      >
        <span className="capitalize">{app.status}</span>
        <ChevronDown size={12} className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-20 mt-1 min-w-[160px] rounded-bento-sm border border-bento-200 bg-white py-1 shadow-bento-lg dark:border-bento-700 dark:bg-bento-800">
          {STATUS_OPTIONS.map((status) => (
            <button
              key={status}
              onClick={() => handleSelect(status)}
              className="flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors hover:bg-bento-100 dark:hover:bg-bento-700"
            >
              <span className="flex items-center gap-2">
                <span className={`badge ${statusColors[status]} !px-1.5 !py-0 text-[10px]`}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </span>
              </span>
              {status === app.status && <Check size={14} className="text-bento-600 dark:text-bento-300" />}
            </button>
          ))}
        </div>
      )}

      {error && (
        <p className="absolute left-0 top-full mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  )
}
