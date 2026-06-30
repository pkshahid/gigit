import { useState, useEffect, useRef } from 'react'
import { Modal } from './Modal'
import { api } from '../api/client'
import { Application, STATUS_OPTIONS, JOB_POST_SOURCE_OPTIONS, APPLIED_SOURCE_OPTIONS } from '../types'
import { Upload, Link as LinkIcon, Type, X, Plus } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
  onSaved: (app: Application) => void
  editApp?: Application | null
}

export function ApplicationFormModal({ open, onClose, onSaved, editApp }: Props) {
  const [form, setForm] = useState({
    company: '',
    position: '',
    job_description: '',
    job_post_source: '',
    applied_sources: [] as string[],
    resume_name: '',
    resume_type: 'name' as 'name' | 'url' | 'upload',
    resume_sent: false,
    status: 'applied',
    applied_date: new Date().toISOString().split('T')[0],
    notes: '',
    retry_gap_days: 0,
    skills: [] as string[],
  })
  const [saving, setSaving] = useState(false)
  const [skillInput, setSkillInput] = useState('')
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState('')

  useEffect(() => {
    if (editApp) {
      setForm({
        company: editApp.company,
        position: editApp.position,
        job_description: editApp.job_description,
        job_post_source: editApp.job_post_source || '',
        applied_sources: editApp.applied_sources || [],
        resume_name: editApp.resume_name,
        resume_type: (editApp.resume_type as 'name' | 'url' | 'upload') || 'name',
        resume_sent: editApp.resume_sent,
        status: editApp.status,
        applied_date: editApp.applied_date,
        notes: editApp.notes,
        retry_gap_days: editApp.retry_gap_days,
        skills: editApp.skills || [],
      })
      setFileName(editApp.resume_type === 'upload' ? editApp.resume_name : '')
    } else {
      setForm({
        company: '',
        position: '',
        job_description: '',
        job_post_source: '',
        applied_sources: [],
        resume_name: '',
        resume_type: 'name' as 'name' | 'url' | 'upload',
        resume_sent: false,
        status: 'applied',
        applied_date: new Date().toISOString().split('T')[0],
        notes: '',
        retry_gap_days: 0,
        skills: [],
      })
      setFileName('')
      setSkillInput('')
    }
    setError('')
  }, [editApp, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      let saved: Application
      if (editApp) {
        saved = await api.updateApplication(editApp.id, form)
      } else {
        saved = await api.createApplication(form)
      }
      onSaved(saved)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={editApp ? 'Edit Application' : 'New Application'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Company *</label>
            <input
              className="input"
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
              required
              placeholder="e.g. Google"
            />
          </div>
          <div>
            <label className="label">Position *</label>
            <input
              className="input"
              value={form.position}
              onChange={(e) => setForm({ ...form, position: e.target.value })}
              required
              placeholder="e.g. Senior Software Engineer"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Applied Date *</label>
            <input
              type="date"
              className="input"
              value={form.applied_date}
              onChange={(e) => setForm({ ...form, applied_date: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="label">Status</label>
            <select
              className="input"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="label">Job Description</label>
          <textarea
            className="input min-h-[120px] font-mono text-xs"
            value={form.job_description}
            onChange={(e) => setForm({ ...form, job_description: e.target.value })}
            placeholder="Paste the full job description here..."
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Job Post Source</label>
            <select
              className="input"
              value={form.job_post_source}
              onChange={(e) => setForm({ ...form, job_post_source: e.target.value })}
            >
              <option value="">Select a source...</option>
              {JOB_POST_SOURCE_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-bento-400">Where the job was posted (e.g. LinkedIn, Indeed).</p>
          </div>
          <div>
            <label className="label">Applied Sources</label>
            <div className="flex flex-wrap gap-2 rounded-bento-sm border border-bento-200 bg-bento-50 p-2 dark:border-bento-700 dark:bg-bento-800/50">
              {APPLIED_SOURCE_OPTIONS.map((src) => {
                const checked = form.applied_sources.includes(src)
                return (
                  <label key={src} className="flex cursor-pointer items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setForm({ ...form, applied_sources: [...form.applied_sources, src] })
                        } else {
                          setForm({ ...form, applied_sources: form.applied_sources.filter((s) => s !== src) })
                        }
                      }}
                      className="h-4 w-4 rounded border-bento-300 text-bento-900 focus:ring-bento-400 dark:border-bento-600 dark:bg-bento-800"
                    />
                    <span className="text-xs">{src}</span>
                  </label>
                )
              })}
            </div>
            <p className="mt-1 text-xs text-bento-400">How the application was submitted (can be multiple).</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Resume</label>
            <div className="flex gap-1 rounded-bento-sm border border-bento-200 bg-bento-50 p-1 dark:border-bento-700 dark:bg-bento-800/50">
              <button
                type="button"
                onClick={() => setForm({ ...form, resume_type: 'name', resume_name: form.resume_type === 'upload' ? '' : form.resume_name })}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-bento-sm px-3 py-1.5 text-xs font-medium transition-colors ${
                  form.resume_type === 'name'
                    ? 'bg-white text-bento-900 shadow-bento-sm dark:bg-bento-900 dark:text-bento-100'
                    : 'text-bento-500 hover:text-bento-700 dark:text-bento-400 dark:hover:text-bento-200'
                }`}
              >
                <Type size={14} /> Name
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, resume_type: 'url', resume_name: form.resume_type === 'upload' ? '' : form.resume_name })}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-bento-sm px-3 py-1.5 text-xs font-medium transition-colors ${
                  form.resume_type === 'url'
                    ? 'bg-white text-bento-900 shadow-bento-sm dark:bg-bento-900 dark:text-bento-100'
                    : 'text-bento-500 hover:text-bento-700 dark:text-bento-400 dark:hover:text-bento-200'
                }`}
              >
                <LinkIcon size={14} /> URL
              </button>
              <button
                type="button"
                onClick={() => {
                  setForm({ ...form, resume_type: 'upload' })
                  if (fileName) setForm((prev) => ({ ...prev, resume_name: fileName }))
                }}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-bento-sm px-3 py-1.5 text-xs font-medium transition-colors ${
                  form.resume_type === 'upload'
                    ? 'bg-white text-bento-900 shadow-bento-sm dark:bg-bento-900 dark:text-bento-100'
                    : 'text-bento-500 hover:text-bento-700 dark:text-bento-400 dark:hover:text-bento-200'
                }`}
              >
                <Upload size={14} /> Upload
              </button>
            </div>

            {form.resume_type === 'name' && (
              <input
                className="input mt-2"
                value={form.resume_name}
                onChange={(e) => setForm({ ...form, resume_name: e.target.value })}
                placeholder="e.g. resume_v3.pdf"
              />
            )}

            {form.resume_type === 'url' && (
              <input
                className="input mt-2"
                type="url"
                value={form.resume_name}
                onChange={(e) => setForm({ ...form, resume_name: e.target.value })}
                placeholder="https://example.com/my-resume.pdf"
              />
            )}

            {form.resume_type === 'upload' && (
              <div className="mt-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.txt,.md"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      setFileName(file.name)
                      setForm({ ...form, resume_name: file.name })
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex w-full items-center justify-center gap-2 rounded-bento-sm border-2 border-dashed border-bento-300 px-3 py-3 text-sm text-bento-500 transition-colors hover:border-bento-400 hover:text-bento-600 dark:border-bento-600 dark:text-bento-400 dark:hover:border-bento-500"
                >
                  <Upload size={16} />
                  {fileName ? fileName : 'Choose a file...'}
                </button>
              </div>
            )}
          </div>
          <div className="flex items-end">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={form.resume_sent}
                onChange={(e) => setForm({ ...form, resume_sent: e.target.checked })}
                className="h-4 w-4 rounded border-bento-300 text-bento-900 focus:ring-bento-400 dark:border-bento-600 dark:bg-bento-800"
              />
              <span className="text-sm">Resume sent</span>
            </label>
          </div>
        </div>

        <div>
          <label className="label">Skills Required</label>
          <div className="flex flex-wrap gap-2 rounded-bento-sm border border-bento-200 bg-bento-50 p-2 dark:border-bento-700 dark:bg-bento-800/50">
            {form.skills.map((skill) => (
              <span key={skill} className="inline-flex items-center gap-1 rounded-bento-sm bg-bento-200 px-2 py-1 text-xs font-medium text-bento-800 dark:bg-bento-700 dark:text-bento-200">
                {skill}
                <button
                  type="button"
                  onClick={() => setForm({ ...form, skills: form.skills.filter((s) => s !== skill) })}
                  className="text-bento-500 hover:text-red-600 dark:text-bento-400 dark:hover:text-red-400"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
            <div className="flex items-center gap-1">
              <input
                className="bg-transparent text-xs outline-none placeholder:text-bento-400"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault()
                    const trimmed = skillInput.trim()
                    if (trimmed && !form.skills.includes(trimmed)) {
                      setForm({ ...form, skills: [...form.skills, trimmed] })
                    }
                    setSkillInput('')
                  }
                }}
                placeholder="Add skill..."
              />
              {skillInput.trim() && (
                <button
                  type="button"
                  onClick={() => {
                    const trimmed = skillInput.trim()
                    if (trimmed && !form.skills.includes(trimmed)) {
                      setForm({ ...form, skills: [...form.skills, trimmed] })
                    }
                    setSkillInput('')
                  }}
                  className="text-bento-500 hover:text-bento-700 dark:text-bento-400 dark:hover:text-bento-200"
                >
                  <Plus size={14} />
                </button>
              )}
            </div>
          </div>
          <p className="mt-1 text-xs text-bento-400">Press Enter or comma to add a skill. e.g. Go, React, Python, AWS</p>
        </div>

        <div>\          <label className="label">Notes</label>
          <textarea
            className="input min-h-[60px]"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Any additional notes..."
          />
        </div>

        <div>
          <label className="label">Retry Gap (days)</label>
          <input
            type="number"
            min={0}
            className="input"
            value={form.retry_gap_days}
            onChange={(e) => setForm({ ...form, retry_gap_days: Number(e.target.value) })}
            placeholder="0"
          />
          <p className="mt-1 text-xs text-bento-400">Days to wait before re-applying if rejected. Set to 0 to disable re-apply.</p>
        </div>

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="btn btn-primary">
            {saving ? 'Saving...' : editApp ? 'Update' : 'Create'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
