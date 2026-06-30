import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { InterviewWithApp } from '../types'
import { InterviewStatusBadge } from '../components/StatusBadge'
import { Calendar, Clock, Video, MapPin } from 'lucide-react'

export function UpcomingInterviewsPage() {
  const [interviews, setInterviews] = useState<InterviewWithApp[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadData = useCallback(async () => {
    try {
      const all = await api.listAllInterviews()
      const today = new Date().toISOString().split('T')[0]
      const upcoming = all
        .filter((i) => i.status === 'scheduled' && i.scheduled_date.split('T')[0] >= today)
        .sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date))
      setInterviews(upcoming)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  if (loading) return <div className="py-20 text-center text-bento-400">Loading...</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Upcoming Interviews</h1>
        <p className="mt-1 text-sm text-bento-500 dark:text-bento-400">
          Scheduled interviews approaching in the coming days.
        </p>
      </div>

      {error && (
        <div className="rounded-bento-sm border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800/50 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </div>
      )}

      {interviews.length === 0 ? (
        <div className="card py-12 text-center text-bento-400">
          <Calendar size={40} className="mx-auto mb-3 opacity-40" />
          <p>No upcoming interviews scheduled.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {interviews.map((iv) => {
            const daysUntil = Math.ceil(
              (new Date(iv.scheduled_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
            )
            return (
              <Link
                key={iv.id}
                to={`/applications/${iv.application_id}`}
                className="card flex flex-col gap-3 transition-all hover:shadow-bento-md hover:dark:shadow-bento-dark-md sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-bento-sm bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                    <span className="text-lg font-bold">{new Date(iv.scheduled_date).getDate()}</span>
                    <span className="text-[10px] uppercase">
                      {new Date(iv.scheduled_date).toLocaleString('en', { month: 'short' })}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">{iv.company}</span>
                      <InterviewStatusBadge status={iv.status} />
                    </div>
                    <p className="truncate text-sm text-bento-500 dark:text-bento-400">{iv.position}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-bento-400">
                      <span className="flex items-center gap-1">
                        <Video size={12} /> Round {iv.round_number}
                        {iv.round_name && ` · ${iv.round_name}`}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {new Date(iv.scheduled_date).toLocaleDateString('en', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}
                        {iv.scheduled_time && ` at ${iv.scheduled_time}`}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="shrink-0 self-end sm:self-auto">
                  {daysUntil === 0 ? (
                    <span className="badge bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">Today</span>
                  ) : daysUntil === 1 ? (
                    <span className="badge bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">Tomorrow</span>
                  ) : (
                    <span className="badge bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                      In {daysUntil} days
                    </span>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
