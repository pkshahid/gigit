import { useState } from 'react'
import { api } from '../api/client'
import { Application } from '../types'
import { StatusSelect } from './StatusSelect'
import { useConfirm } from './ConfirmDialog'
import {
  Send, Video, Gift, CheckCircle, XCircle, RefreshCw,
} from 'lucide-react'

const STEPS = [
  { key: 'applied', label: 'Applied', icon: Send },
  { key: 'interview', label: 'Interview', icon: Video },
  { key: 'offer', label: 'Offer', icon: Gift },
  { key: 'accepted', label: 'Accepted', icon: CheckCircle },
] as const

const STEP_COLORS: Record<string, string> = {
  applied: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700',
  interview: 'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700',
  offer: 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700',
  accepted: 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-700',
}

const DONE_COLOR = 'text-white bg-bento-900 dark:text-bento-900 dark:bg-bento-100 border-bento-900 dark:border-bento-100'
const PENDING_COLOR = 'text-bento-400 bg-bento-100 dark:bg-bento-800 dark:text-bento-500 border-bento-200 dark:border-bento-700'

interface Props {
  app: Application
  onUpdated: () => void
}

export function WorkflowStepper({ app, onUpdated }: Props) {
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState('')
  const confirm = useConfirm()

  const currentIndex = STEPS.findIndex((s) => s.key === app.status)
  const isRejected = app.status === 'rejected'

  const handleStatusChange = async (newStatus: string) => {
    setUpdating(true)
    setError('')
    try {
      await api.updateApplication(app.id, { ...app, status: newStatus })
      onUpdated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status')
    } finally {
      setUpdating(false)
    }
  }

  const confirmStatusChange = (newStatus: string, opts: {
    title: string
    message: string
    confirmLabel: string
    variant: 'danger' | 'warning' | 'primary'
  }) => {
    confirm({
      ...opts,
      onConfirm: () => handleStatusChange(newStatus),
    })
  }

  return (
    <div className="card">
      <h2 className="mb-4 text-lg font-semibold">Application Workflow</h2>

      {/* Stepper */}
      <div className="flex items-center">
        {STEPS.map((step, i) => {
          const isDone = currentIndex >= 0 && i < currentIndex
          const isCurrent = i === currentIndex
          const Icon = step.icon

          return (
            <div key={step.key} className="flex flex-1 items-center last:flex-none">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                    isCurrent
                      ? STEP_COLORS[step.key]
                      : isDone
                      ? DONE_COLOR
                      : PENDING_COLOR
                  } ${isCurrent ? 'scale-110 shadow-bento-md' : ''}`}
                >
                  <Icon size={18} />
                </div>
                <span
                  className={`text-xs font-semibold ${
                    isCurrent
                      ? 'text-bento-800 dark:text-bento-100'
                      : isDone
                      ? 'text-bento-600 dark:text-bento-300'
                      : 'text-bento-400 dark:text-bento-500'
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`mx-1 h-0.5 flex-1 rounded-full transition-all duration-300 sm:mx-2 ${
                    currentIndex > i ? 'bg-bento-900 dark:bg-bento-100' : 'bg-bento-200 dark:bg-bento-700'
                  }`}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Rejected banner */}
      {isRejected && (
        <div className="mt-4 flex items-center gap-2 rounded-bento-sm border border-red-200 bg-red-50 px-4 py-2.5 dark:border-red-800/50 dark:bg-red-950/40">
          <XCircle size={18} className="text-red-600 dark:text-red-400" />
          <span className="text-sm font-semibold text-red-700 dark:text-red-300">
            This application was rejected
          </span>
          {app.retry_gap_days > 0 && (
            <span className="ml-auto text-xs text-red-500 dark:text-red-400">
              Re-apply eligible after {app.retry_gap_days} days
            </span>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {/* Action buttons */}
      <div className="mt-4 flex flex-wrap gap-2 border-t border-bento-200 pt-4 dark:border-bento-800">
        {app.status === 'applied' && (
          <button
            onClick={() => handleStatusChange('interview')}
            disabled={updating}
            className="btn btn-primary btn-sm"
          >
            <Video size={14} /> Mark as Interview
          </button>
        )}

        {app.status === 'interview' && (
          <>
            <button
              onClick={() => handleStatusChange('offer')}
              disabled={updating}
              className="btn btn-primary btn-sm"
            >
              <Gift size={14} /> Mark as Offer
            </button>
            <button
              onClick={() => confirmStatusChange('rejected', {
                title: 'Reject Application',
                message: `Mark this application as rejected? This will move it to the "Rejected" status.`,
                confirmLabel: 'Reject',
                variant: 'danger',
              })}
              disabled={updating}
              className="btn btn-secondary btn-sm text-red-600 hover:border-red-300 hover:bg-red-50 dark:hover:border-red-700 dark:hover:bg-red-950/40"
            >
              <XCircle size={14} /> Reject
            </button>
          </>
        )}

        {app.status === 'offer' && (
          <>
            <button
              onClick={() => handleStatusChange('accepted')}
              disabled={updating}
              className="btn btn-primary btn-sm"
            >
              <CheckCircle size={14} /> Accept Offer
            </button>
            <button
              onClick={() => confirmStatusChange('rejected', {
                title: 'Decline Offer',
                message: `Decline this offer? This will mark the application as rejected.`,
                confirmLabel: 'Decline',
                variant: 'danger',
              })}
              disabled={updating}
              className="btn btn-secondary btn-sm text-red-600 hover:border-red-300 hover:bg-red-50 dark:hover:border-red-700 dark:hover:bg-red-950/40"
            >
              <XCircle size={14} /> Decline
            </button>
          </>
        )}

        {app.status === 'rejected' && (
          <button
            onClick={() => confirmStatusChange('applied', {
              title: 'Re-Apply',
              message: `Re-apply to ${app.company} for ${app.position}? This will reset the status to "applied".`,
              confirmLabel: 'Re-Apply',
              variant: 'primary',
            })}
            disabled={updating}
            className="btn btn-primary btn-sm"
          >
            <RefreshCw size={14} /> Re-Apply
          </button>
        )}

        {app.status === 'accepted' && (
          <div className="flex items-center gap-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
            <CheckCircle size={16} /> Offer accepted — congratulations!
          </div>
        )}

        {/* Direct status changer */}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-bento-400">Status:</span>
          <StatusSelect app={app} onUpdated={onUpdated} />
        </div>
      </div>

      {/* Auto-transition hint */}
      <p className="mt-3 text-xs text-bento-400">
        Status auto-updates based on interview outcomes (e.g., failed interview → rejected, all passed → offer).
      </p>
    </div>
  )
}
