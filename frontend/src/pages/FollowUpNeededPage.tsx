import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { Application } from '../types'
import { StatusBadge } from '../components/StatusBadge'
import { ApplicationFormModal } from '../components/ApplicationFormModal'
import { Pencil, Trash2, BellRing, Clock, Calendar } from 'lucide-react'
import { RowActions } from '../components/RowActions'
import { useConfirm } from '../components/ConfirmDialog'

export function FollowUpNeededPage() {
  const [apps, setApps] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editApp, setEditApp] = useState<Application | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)

  const loadData = useCallback(async () => {
    try {
      const data = await api.getFollowUpNeeded()
      setApps(data)
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

  const computeDaysSinceUpdate = (app: Application): number => {
    const updated = new Date(app.updated_at)
    const now = new Date()
    return Math.floor((now.getTime() - updated.getTime()) / (1000 * 60 * 60 * 24))
  }

  if (loading) return <div className="py-20 text-center text-bento-400">Loading...</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Follow-up Needed</h1>
        <p className="mt-1 text-sm text-bento-500 dark:text-bento-400">
          Applications where you attended an interview but haven't had any updates in 2+ days.
        </p>
      </div>

      {error && (
        <div className="rounded-bento-sm border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800/50 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </div>
      )}

      {apps.length === 0 ? (
        <div className="card py-12 text-center text-bento-400">
          <BellRing size={40} className="mx-auto mb-3 opacity-40" />
          <p>No follow-ups needed right now.</p>
          <p className="mt-1 text-xs">Applications with attended interviews and no activity for 2+ days will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {apps.map((app) => {
            const daysSince = computeDaysSinceUpdate(app)
            return (
              <div key={app.id} className="card flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Link to={`/applications/${app.id}`} className="min-w-0 flex-1">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-bento-sm bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
                      <BellRing size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate font-semibold">{app.company}</h3>
                        <StatusBadge status={app.status} />
                      </div>
                      <p className="truncate text-sm text-bento-500 dark:text-bento-400">{app.position}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-bento-400">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} /> Applied: {app.applied_date}
                        </span>
                        <span className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
                          <Clock size={12} /> {daysSince}d since last update
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
                <RowActions
                  actions={[
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
