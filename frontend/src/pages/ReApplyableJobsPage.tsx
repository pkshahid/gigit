import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { Application } from '../types'
import { StatusBadge } from '../components/StatusBadge'
import { ApplicationFormModal } from '../components/ApplicationFormModal'
import { Pencil, Trash2, RefreshCw, CheckCircle, Calendar, Clock } from 'lucide-react'
import { RowActions } from '../components/RowActions'
import { useConfirm } from '../components/ConfirmDialog'

export function ReApplyableJobsPage() {
  const [apps, setApps] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editApp, setEditApp] = useState<Application | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [reApplying, setReApplying] = useState<number | null>(null)

  const loadData = useCallback(async () => {
    try {
      const all = await api.listApplications()
      const today = new Date().toISOString().split('T')[0]
      const reApplyable = all.filter((a) => {
        if (a.status !== 'rejected' || a.retry_gap_days <= 0) return false
        const applied = new Date(a.applied_date)
        applied.setDate(applied.getDate() + a.retry_gap_days)
        const reApplyDate = applied.toISOString().split('T')[0]
        return reApplyDate <= today
      })
      setApps(reApplyable)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const confirm = useConfirm()

  const handleDelete = async (id: number) => {
    confirm({
      title: 'Delete Application',
      message: 'Delete this application and all related interviews/follow-ups? This action cannot be undone.',
      confirmLabel: 'Delete',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await api.deleteApplication(id)
          await loadData()
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to delete')
        }
      },
    })
  }

  const handleReApply = async (app: Application) => {
    confirm({
      title: 'Re-Apply',
      message: `Re-apply to ${app.company} for ${app.position}? This will reset the status to "applied" and update the applied date to today.`,
      confirmLabel: 'Re-Apply',
      variant: 'primary',
      onConfirm: async () => {
        setReApplying(app.id)
        try {
          await api.updateApplication(app.id, {
            ...app,
            status: 'applied',
            applied_date: new Date().toISOString().split('T')[0],
          })
          await loadData()
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to re-apply')
        } finally {
          setReApplying(null)
        }
      },
    })
  }

  const computeDaysOverdue = (app: Application): number => {
    const applied = new Date(app.applied_date)
    applied.setDate(applied.getDate() + app.retry_gap_days)
    const today = new Date()
    return Math.floor((today.getTime() - applied.getTime()) / (1000 * 60 * 60 * 24))
  }

  if (loading) return <div className="py-20 text-center text-bento-400">Loading...</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Re-Applyable Jobs</h1>
        <p className="mt-1 text-sm text-bento-500 dark:text-bento-400">
          Rejected applications where the retry gap has elapsed. Click "Re-Apply" to reset the status.
        </p>
      </div>

      {error && (
        <div className="rounded-bento-sm border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800/50 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </div>
      )}

      {apps.length === 0 ? (
        <div className="card py-12 text-center text-bento-400">
          <RefreshCw size={40} className="mx-auto mb-3 opacity-40" />
          <p>No jobs are currently eligible for re-application.</p>
          <p className="mt-1 text-xs">Set a retry gap on rejected applications to make them appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {apps.map((app) => {
            const daysOverdue = computeDaysOverdue(app)
            return (
              <div key={app.id} className="card flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Link to={`/applications/${app.id}`} className="min-w-0 flex-1">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-bento-sm bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                      <RefreshCw size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate font-semibold">{app.company}</h3>
                        <StatusBadge status={app.status} />
                      </div>
                      <p className="truncate text-sm text-bento-500 dark:text-bento-400">{app.position}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-bento-400">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} /> Originally applied: {app.applied_date}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={12} /> Retry gap: {app.retry_gap_days}d
                        </span>
                        {daysOverdue === 0 ? (
                          <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                            <CheckCircle size={12} /> Eligible today
                          </span>
                        ) : (
                          <span className="text-amber-600 dark:text-amber-400">
                            {daysOverdue}d overdue
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
                <RowActions
                  actions={[
                    {
                      icon: <RefreshCw size={14} />,
                      label: 'Re-Apply',
                      onClick: () => handleReApply(app),
                      disabled: reApplying === app.id,
                      className: 'btn btn-primary btn-sm',
                      showLabelOnDesktop: true,
                    },
                    {
                      icon: <Pencil size={14} />,
                      label: 'Edit',
                      onClick: () => {
                        setEditApp(app)
                        setShowEditModal(true)
                      },
                    },
                    {
                      icon: <Trash2 size={14} />,
                      label: 'Delete',
                      onClick: () => handleDelete(app.id),
                      className: 'btn btn-secondary btn-sm text-red-600 hover:border-red-300 hover:bg-red-50 dark:hover:border-red-700 dark:hover:bg-red-950/40',
                    },
                  ]}
                />
              </div>
            )
          })}
        </div>
      )}

      <ApplicationFormModal
        open={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setEditApp(null)
        }}
        onSaved={async () => {
          setShowEditModal(false)
          setEditApp(null)
          await loadData()
        }}
        editApp={editApp}
      />
    </div>
  )
}
