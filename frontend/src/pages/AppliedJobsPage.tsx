import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { Application } from '../types'
import { StatusBadge } from '../components/StatusBadge'
import { ApplicationFormModal } from '../components/ApplicationFormModal'
import { FileText, Pencil, Trash2, Briefcase, Send } from 'lucide-react'
import { RowActions } from '../components/RowActions'
import { useConfirm } from '../components/ConfirmDialog'

export function AppliedJobsPage() {
  const [apps, setApps] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editApp, setEditApp] = useState<Application | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)

  const loadData = useCallback(async () => {
    try {
      const all = await api.listApplications()
      setApps(all.filter((a) => a.status === 'applied'))
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

  if (loading) return <div className="py-20 text-center text-bento-400">Loading...</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Applied Jobs</h1>
        <p className="mt-1 text-sm text-bento-500 dark:text-bento-400">
          Applications submitted but not yet in the interview stage.
        </p>
      </div>

      {error && (
        <div className="rounded-bento-sm border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800/50 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </div>
      )}

      {apps.length === 0 ? (
        <div className="card py-12 text-center text-bento-400">
          <Send size={40} className="mx-auto mb-3 opacity-40" />
          <p>No applications in "applied" status.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {apps.map((app) => (
            <div key={app.id} className="card flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Link to={`/applications/${app.id}`} className="min-w-0 flex-1">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-bento-sm bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                    <Briefcase size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate font-semibold">{app.company}</h3>
                      <StatusBadge status={app.status} />
                    </div>
                    <p className="truncate text-sm text-bento-500 dark:text-bento-400">{app.position}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-bento-400">
                      <span>Applied: {app.applied_date}</span>
                      {app.resume_sent && (
                        <span className="flex items-center gap-1">
                          <FileText size={12} /> Resume sent
                        </span>
                      )}
                      {app.retry_gap_days > 0 && (
                        <span className="text-amber-600 dark:text-amber-400">Retry gap: {app.retry_gap_days}d</span>
                      )}
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
          ))}
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
