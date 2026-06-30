import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { api } from '../api/client'
import { ApplicationDetail, Interview, FollowUp, INTERVIEW_STATUS_OPTIONS, FOLLOWUP_TYPE_OPTIONS } from '../types'
import { StatusBadge, InterviewStatusBadge } from '../components/StatusBadge'
import { StatusSelect } from '../components/StatusSelect'
import { ApplicationFormModal } from '../components/ApplicationFormModal'
import { WorkflowStepper } from '../components/WorkflowStepper'
import { Modal } from '../components/Modal'
import {
  ArrowLeft, Pencil, Plus, Trash2, FileText, Calendar, Mail,
  Phone, MessageSquare, Video, CheckCircle, XCircle, Link as LinkIcon, Upload,
  Briefcase, Send, Tags,
} from 'lucide-react'
import { RowActions } from '../components/RowActions'
import { useConfirm } from '../components/ConfirmDialog'

export function ApplicationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [detail, setDetail] = useState<ApplicationDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showEditModal, setShowEditModal] = useState(false)
  const [showInterviewModal, setShowInterviewModal] = useState(false)
  const [showFollowUpModal, setShowFollowUpModal] = useState(false)
  const [editingInterview, setEditingInterview] = useState<Interview | null>(null)
  const [editingFollowUp, setEditingFollowUp] = useState<FollowUp | null>(null)

  const loadDetail = useCallback(async () => {
    if (!id) return
    try {
      const data = await api.getApplication(Number(id))
      setDetail(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadDetail()
  }, [loadDetail])

  const confirm = useConfirm()

  const handleDeleteInterview = async (iv: Interview) => {
    confirm({
      title: 'Delete Interview Round',
      message: 'Delete this interview round? This action cannot be undone.',
      confirmLabel: 'Delete',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await api.deleteInterview(iv.application_id, iv.id)
          await loadDetail()
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to delete')
        }
      },
    })
  }

  const handleDeleteFollowUp = async (f: FollowUp) => {
    confirm({
      title: 'Delete Follow-up',
      message: 'Delete this follow-up? This action cannot be undone.',
      confirmLabel: 'Delete',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await api.deleteFollowUp(f.application_id, f.id)
          await loadDetail()
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to delete')
        }
      },
    })
  }

  if (loading) return <div className="py-20 text-center text-bento-400">Loading...</div>
  if (error && !detail)
    return <div className="rounded-bento-sm border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800/50 dark:bg-red-950/40 dark:text-red-300">{error}</div>
  if (!detail) return <div className="py-20 text-center text-bento-400">Application not found</div>

  const passedRounds = detail.interviews.filter((i) => i.status === 'passed').length
  const failedRounds = detail.interviews.filter((i) => i.status === 'failed').length

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/" className="btn btn-secondary btn-sm">
          <ArrowLeft size={16} /> Back
        </Link>
        <button onClick={() => setShowEditModal(true)} className="btn btn-secondary btn-sm">
          <Pencil size={16} /> Edit
        </button>
      </div>

      {error && (
        <div className="rounded-bento-sm border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800/50 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Header */}
      <div className="card">
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-bold sm:text-2xl">{detail.company}</h1>
              <StatusSelect app={detail} onUpdated={loadDetail} />
            </div>
            <p className="mt-1 text-base text-bento-600 dark:text-bento-400 sm:text-lg">{detail.position}</p>
            <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-bento-500 dark:text-bento-400">
              <span className="flex items-center gap-1">
                <Calendar size={14} /> Applied: {detail.applied_date}
              </span>
              {detail.resume_sent && (
                <span className="flex items-center gap-1">
                  <FileText size={14} /> Resume: {detail.resume_name || 'sent'}
                  {detail.resume_type === 'url' && detail.resume_name && (
                    <a href={detail.resume_name} target="_blank" rel="noopener noreferrer" className="text-bento-500 underline hover:text-bento-700 dark:text-bento-400 dark:hover:text-bento-200">
                      <LinkIcon size={12} className="inline" />
                    </a>
                  )}
                </span>
              )}
              {detail.job_post_source && (
                <span className="flex items-center gap-1">
                  <Briefcase size={14} /> Job Post: {detail.job_post_source}
                </span>
              )}
              {detail.applied_sources && detail.applied_sources.length > 0 && (
                <span className="flex items-center gap-1">
                  <Send size={14} /> Applied via: {detail.applied_sources.join(', ')}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Skills */}
      {detail.skills && detail.skills.length > 0 && (
        <div className="card">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
            <Tags size={18} className="text-bento-500 dark:text-bento-400" /> Skills Required
          </h2>
          <div className="flex flex-wrap gap-2">
            {detail.skills.map((skill) => (
              <span key={skill} className="badge bg-bento-100 text-bento-700 dark:bg-bento-800 dark:text-bento-300">
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Workflow stepper */}
      <WorkflowStepper app={detail} onUpdated={loadDetail} />

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <div className="card flex items-center gap-3 transition-shadow hover:shadow-bento-md dark:hover:shadow-bento-dark-md">
          <div className="rounded-bento-sm bg-blue-100 p-2.5 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
            <Calendar size={18} />
          </div>
          <div>
            <p className="text-2xl font-bold text-bento-800 dark:text-bento-100">{detail.interviews.length}</p>
            <p className="text-xs text-bento-500 dark:text-bento-400">Total Rounds</p>
          </div>
        </div>
        <div className="card flex items-center gap-3 transition-shadow hover:shadow-bento-md dark:hover:shadow-bento-dark-md">
          <div className="rounded-bento-sm bg-green-100 p-2.5 text-green-600 dark:bg-green-900/30 dark:text-green-400">
            <CheckCircle size={18} />
          </div>
          <div>
            <p className="text-2xl font-bold text-bento-800 dark:text-bento-100">{passedRounds}</p>
            <p className="text-xs text-bento-500 dark:text-bento-400">Passed</p>
          </div>
        </div>
        <div className="card flex items-center gap-3 transition-shadow hover:shadow-bento-md dark:hover:shadow-bento-dark-md">
          <div className="rounded-bento-sm bg-red-100 p-2.5 text-red-600 dark:bg-red-900/30 dark:text-red-400">
            <XCircle size={18} />
          </div>
          <div>
            <p className="text-2xl font-bold text-bento-800 dark:text-bento-100">{failedRounds}</p>
            <p className="text-xs text-bento-500 dark:text-bento-400">Failed</p>
          </div>
        </div>
      </div>

      {/* JD and Resume */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="mb-3 text-lg font-semibold">Job Description</h2>
          {detail.job_description ? (
            <pre className="whitespace-pre-wrap text-sm text-bento-700 dark:text-bento-300">
              {detail.job_description}
            </pre>
          ) : (
            <p className="text-sm text-bento-400">No job description recorded.</p>
          )}
        </div>
        <div className="card">
          <h2 className="mb-3 text-lg font-semibold">Resume</h2>
          {detail.resume_sent ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                {detail.resume_type === 'url' ? (
                  <LinkIcon size={16} className="text-bento-600 dark:text-bento-400" />
                ) : detail.resume_type === 'upload' ? (
                  <Upload size={16} className="text-bento-600 dark:text-bento-400" />
                ) : (
                  <FileText size={16} className="text-bento-600 dark:text-bento-400" />
                )}
                {detail.resume_type === 'url' && detail.resume_name ? (
                  <a href={detail.resume_name} target="_blank" rel="noopener noreferrer" className="font-medium text-bento-700 underline hover:text-bento-900 dark:text-bento-200 dark:hover:text-bento-100">
                    {detail.resume_name}
                  </a>
                ) : (
                  <span className="font-medium text-bento-700 dark:text-bento-200">{detail.resume_name || 'Resume sent'}</span>
                )}
                <StatusBadge status="accepted" />
              </div>
              <p className="text-xs text-bento-500">Resume was sent with this application</p>
            </div>
          ) : (
            <p className="text-sm text-bento-400">No resume recorded as sent.</p>
          )}
          {detail.notes && (
            <div className="mt-4 border-t border-bento-200 pt-3 dark:border-bento-800">
              <h3 className="mb-1 text-sm font-semibold text-bento-600 dark:text-bento-300">Notes</h3>
              <p className="text-sm text-bento-600 dark:text-bento-400">{detail.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Interviews */}
      <div className="card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Interview Rounds</h2>
          <button
            onClick={() => {
              setEditingInterview(null)
              setShowInterviewModal(true)
            }}
            className="btn btn-primary btn-sm"
          >
            <Plus size={16} /> Add Round
          </button>
        </div>
        {detail.interviews.length === 0 ? (
          <p className="py-6 text-center text-sm text-bento-400">No interview rounds recorded yet.</p>
        ) : (
          <div className="space-y-3">
            {detail.interviews.map((iv) => (
              <div
                key={iv.id}
                className="flex flex-col gap-3 rounded-bento-sm border border-bento-200 bg-white p-4 transition-all hover:border-bento-300 hover:shadow-bento-sm dark:border-bento-800 dark:bg-bento-900 dark:hover:border-bento-700 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-bento-sm bg-bento-900 text-sm font-bold text-white dark:bg-bento-100 dark:text-bento-900">
                    {iv.round_number}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{iv.round_name || `Round ${iv.round_number}`}</span>
                      <InterviewStatusBadge status={iv.status} />
                    </div>
                    <p className="mt-1 text-sm text-bento-500 dark:text-bento-400">
                      Scheduled: {iv.scheduled_date}{iv.scheduled_time ? ` at ${iv.scheduled_time}` : ''}
                    </p>
                    {iv.notes && (
                      <p className="mt-1 text-sm text-bento-600 dark:text-bento-400">{iv.notes}</p>
                    )}
                  </div>
                </div>
                <RowActions
                  actions={[
                    ...(iv.join_link
                      ? [{
                          icon: <Video size={14} />,
                          label: 'Join',
                          href: iv.join_link,
                          className: 'btn btn-primary btn-sm',
                          showLabelOnDesktop: true,
                        }]
                      : []),
                    {
                      icon: <Pencil size={14} />,
                      label: 'Edit',
                      onClick: () => {
                        setEditingInterview(iv)
                        setShowInterviewModal(true)
                      },
                    },
                    {
                      icon: <Trash2 size={14} />,
                      label: 'Delete',
                      onClick: () => handleDeleteInterview(iv),
                      className: 'btn btn-secondary btn-sm text-red-600 hover:border-red-300 hover:bg-red-50 dark:hover:border-red-700 dark:hover:bg-red-950/40',
                    },
                  ]}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Follow-ups */}
      <div className="card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Follow-ups</h2>
          <button
            onClick={() => {
              setEditingFollowUp(null)
              setShowFollowUpModal(true)
            }}
            className="btn btn-primary btn-sm"
          >
            <Plus size={16} /> Add Follow-up
          </button>
        </div>
        {detail.follow_ups.length === 0 ? (
          <p className="py-6 text-center text-sm text-bento-400">No follow-ups recorded yet.</p>
        ) : (
          <div className="space-y-3">
            {detail.follow_ups.map((f) => (
              <div
                key={f.id}
                className="flex flex-col gap-3 rounded-bento-sm border border-bento-200 bg-white p-4 transition-all hover:border-bento-300 hover:shadow-bento-sm dark:border-bento-800 dark:bg-bento-900 dark:hover:border-bento-700 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 shrink-0 text-bento-400">
                    {f.follow_type === 'email' && <Mail size={18} />}
                    {f.follow_type === 'call' && <Phone size={18} />}
                    {f.follow_type === 'message' && <MessageSquare size={18} />}
                    {f.follow_type === 'other' && <Video size={18} />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium capitalize text-bento-700 dark:text-bento-200">{f.follow_type}</span>
                      <span className="text-sm text-bento-500">{f.date}</span>
                    </div>
                    {f.notes && (
                      <p className="mt-1 text-sm text-bento-600 dark:text-bento-400">{f.notes}</p>
                    )}
                  </div>
                </div>
                <RowActions
                  actions={[
                    {
                      icon: <Pencil size={14} />,
                      label: 'Edit',
                      onClick: () => {
                        setEditingFollowUp(f)
                        setShowFollowUpModal(true)
                      },
                    },
                    {
                      icon: <Trash2 size={14} />,
                      label: 'Delete',
                      onClick: () => handleDeleteFollowUp(f),
                      className: 'btn btn-secondary btn-sm text-red-600 hover:border-red-300 hover:bg-red-50 dark:hover:border-red-700 dark:hover:bg-red-950/40',
                    },
                  ]}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <ApplicationFormModal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSaved={async () => {
          setShowEditModal(false)
          await loadDetail()
        }}
        editApp={detail}
      />

      <InterviewFormModal
        open={showInterviewModal}
        onClose={() => {
          setShowInterviewModal(false)
          setEditingInterview(null)
        }}
        onSaved={async () => {
          setShowInterviewModal(false)
          setEditingInterview(null)
          await loadDetail()
        }}
        appId={detail.id}
        editInterview={editingInterview}
      />

      <FollowUpFormModal
        open={showFollowUpModal}
        onClose={() => {
          setShowFollowUpModal(false)
          setEditingFollowUp(null)
        }}
        onSaved={async () => {
          setShowFollowUpModal(false)
          setEditingFollowUp(null)
          await loadDetail()
        }}
        appId={detail.id}
        editFollowUp={editingFollowUp}
      />
    </div>
  )
}

// ---------- Interview Form Modal ----------

function InterviewFormModal({
  open,
  onClose,
  onSaved,
  appId,
  editInterview,
}: {
  open: boolean
  onClose: () => void
  onSaved: () => void
  appId: number
  editInterview: Interview | null
}) {
  const [form, setForm] = useState({
    round_number: 1,
    round_name: '',
    scheduled_date: new Date().toISOString().split('T')[0],
    scheduled_time: '',
    status: 'scheduled',
    notes: '',
    join_link: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (editInterview) {
      setForm({
        round_number: editInterview.round_number,
        round_name: editInterview.round_name,
        scheduled_date: editInterview.scheduled_date.split('T')[0],
        scheduled_time: editInterview.scheduled_time || '',
        status: editInterview.status,
        notes: editInterview.notes,
        join_link: editInterview.join_link || '',
      })
    } else {
      setForm({
        round_number: 0,
        round_name: '',
        scheduled_date: new Date().toISOString().split('T')[0],
        scheduled_time: '',
        status: 'scheduled',
        notes: '',
        join_link: '',
      })
    }
    setError('')
  }, [editInterview, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      if (editInterview) {
        await api.updateInterview(appId, editInterview.id, form)
      } else {
        await api.createInterview(appId, form)
      }
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={editInterview ? 'Edit Interview Round' : 'Add Interview Round'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Round Number</label>
            <input
              type="number"
              min={1}
              className="input"
              value={form.round_number || ''}
              onChange={(e) => setForm({ ...form, round_number: Number(e.target.value) })}
              placeholder="Auto"
            />
            <p className="mt-1 text-xs text-bento-400">Leave as 0 for auto-increment</p>
          </div>
          <div>
            <label className="label">Round Name</label>
            <input
              className="input"
              value={form.round_name}
              onChange={(e) => setForm({ ...form, round_name: e.target.value })}
              placeholder="e.g. Technical, HR, System Design"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Scheduled Date *</label>
            <input
              type="date"
              className="input"
              value={form.scheduled_date}
              onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="label">Scheduled Time</label>
            <input
              type="time"
              className="input"
              value={form.scheduled_time}
              onChange={(e) => setForm({ ...form, scheduled_time: e.target.value })}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Status</label>
            <select
              className="input"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              {INTERVIEW_STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="label">Join Link</label>
          <input
            className="input"
            value={form.join_link}
            onChange={(e) => setForm({ ...form, join_link: e.target.value })}
            placeholder="Paste meeting link (e.g. Teams, Zoom, Google Meet)"
          />
          <p className="mt-1 text-xs text-bento-400">Paste the interview meeting link to enable a Join button</p>
        </div>
        <div>
          <label className="label">Notes</label>
          <textarea
            className="input min-h-[80px]"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Interview details, feedback, etc..."
          />
        </div>
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="btn btn-primary">
            {saving ? 'Saving...' : editInterview ? 'Update' : 'Add'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ---------- Follow-up Form Modal ----------

function FollowUpFormModal({
  open,
  onClose,
  onSaved,
  appId,
  editFollowUp,
}: {
  open: boolean
  onClose: () => void
  onSaved: () => void
  appId: number
  editFollowUp: FollowUp | null
}) {
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    follow_type: 'email',
    notes: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (editFollowUp) {
      setForm({
        date: editFollowUp.date.split('T')[0],
        follow_type: editFollowUp.follow_type,
        notes: editFollowUp.notes,
      })
    } else {
      setForm({
        date: new Date().toISOString().split('T')[0],
        follow_type: 'email',
        notes: '',
      })
    }
    setError('')
  }, [editFollowUp, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      if (editFollowUp) {
        await api.updateFollowUp(appId, editFollowUp.id, form)
      } else {
        await api.createFollowUp(appId, form)
      }
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={editFollowUp ? 'Edit Follow-up' : 'Add Follow-up'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Date *</label>
            <input
              type="date"
              className="input"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="label">Type</label>
            <select
              className="input"
              value={form.follow_type}
              onChange={(e) => setForm({ ...form, follow_type: e.target.value })}
            >
              {FOLLOWUP_TYPE_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="label">Notes</label>
          <textarea
            className="input min-h-[80px]"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="What was discussed, any response received..."
          />
        </div>
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="btn btn-primary">
            {saving ? 'Saving...' : editFollowUp ? 'Update' : 'Add'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
