import { useEffect, useState, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { Application, InterviewWithApp, Stats } from '../types'
import { StatusBadge, InterviewStatusBadge } from '../components/StatusBadge'
import { Briefcase, Calendar, TrendingUp, CheckCircle, XCircle, Video, Send, Clock, Timer } from 'lucide-react'

interface Activity {
  id: string
  type: 'applied' | 'interview'
  date: string
  scheduledTime?: string
  company: string
  position: string
  status: string
  appId: number
  roundName?: string
}

export function DashboardPage() {
  const [apps, setApps] = useState<Application[]>([])
  const [interviews, setInterviews] = useState<InterviewWithApp[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const loadData = useCallback(async () => {
    try {
      const [appData, interviewData, statsData] = await Promise.all([
        api.listApplications(),
        api.listAllInterviews(),
        api.getStats(),
      ])
      setApps(appData)
      setInterviews(interviewData)
      setStats(statsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const activities = useMemo<Activity[]>(() => {
    const items: Activity[] = []

    for (const app of apps) {
      items.push({
        id: `app-${app.id}`,
        type: 'applied',
        date: app.applied_date || app.updated_at,
        company: app.company,
        position: app.position,
        status: app.status,
        appId: app.id,
      })
    }

    for (const iv of interviews) {
      items.push({
        id: `iv-${iv.id}`,
        type: 'interview',
        date: iv.scheduled_date || iv.created_at,
        scheduledTime: iv.scheduled_time || undefined,
        company: iv.company,
        position: iv.position,
        status: iv.status,
        appId: iv.application_id,
        roundName: iv.round_name,
      })
    }

    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 15)
  }, [apps, interviews])

  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  const upcomingInterviews = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    return interviews
      .filter((i) => i.status === 'scheduled' && i.scheduled_date.split('T')[0] >= today)
      .sort((a, b) => {
        const da = new Date(a.scheduled_date + (a.scheduled_time ? `T${a.scheduled_time}` : 'T00:00')).getTime()
        const db = new Date(b.scheduled_date + (b.scheduled_time ? `T${b.scheduled_time}` : 'T00:00')).getTime()
        return da - db
      })
      .slice(0, 5)
  }, [interviews])

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-bento-400">Loading...</div>
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-bento-sm border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800/50 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard icon={<Briefcase size={18} />} label="Total" value={stats?.total ?? 0} color="indigo" to="/applied" />
        <StatCard icon={<TrendingUp size={18} />} label="Interviews" value={stats?.interview ?? 0} color="yellow" to="/ongoing" />
        <StatCard icon={<CheckCircle size={18} />} label="Offers" value={stats?.offer ?? 0} color="green" to="/ongoing" />
        <StatCard icon={<CheckCircle size={18} />} label="Accepted" value={stats?.accepted ?? 0} color="emerald" to="/ongoing" />
        <StatCard icon={<XCircle size={18} />} label="Rejected" value={stats?.rejected ?? 0} color="red" to="/rejected" />
        <StatCard icon={<Calendar size={18} />} label="Upcoming" value={stats?.upcoming_interviews ?? 0} color="blue" to="/upcoming-interviews" />
      </div>

      {/* Nearest 5 Interviews Countdown */}
      {upcomingInterviews.length > 0 && (
        <div>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-bento-800 dark:text-bento-100">
            <Timer size={18} className="text-blue-600 dark:text-blue-400" />
            Upcoming Interview Countdown
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {upcomingInterviews.map((iv) => {
              const target = new Date(
                iv.scheduled_date + (iv.scheduled_time ? `T${iv.scheduled_time}` : 'T00:00'),
              ).getTime()
              const diff = Math.max(0, target - now)
              const days = Math.floor(diff / (1000 * 60 * 60 * 24))
              const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
              const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
              const seconds = Math.floor((diff % (1000 * 60)) / 1000)
              const isToday = new Date(iv.scheduled_date).toDateString() === new Date().toDateString()
              return (
                <Link
                  key={iv.id}
                  to={`/applications/${iv.application_id}`}
                  className="card flex flex-col gap-2 transition-all hover:shadow-bento-md hover:border-blue-300 active:scale-[0.97] dark:hover:shadow-bento-dark-md dark:hover:border-blue-700"
                >
                  <div className="flex items-center justify-between">
                    <span className="truncate text-sm font-semibold text-bento-800 dark:text-bento-100">
                      {iv.company}
                    </span>
                    <InterviewStatusBadge status={iv.status} />
                  </div>
                  <p className="truncate text-xs text-bento-500 dark:text-bento-400">{iv.position}</p>
                  <div className="flex items-center gap-1.5 text-xs text-bento-400">
                    <Video size={12} />
                    <span>
                      Round {iv.round_number}
                      {iv.round_name && ` · ${iv.round_name}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-bento-400">
                    <Clock size={12} />
                    <span>
                      {new Date(iv.scheduled_date).toLocaleDateString('en', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                      {iv.scheduled_time && ` at ${iv.scheduled_time}`}
                    </span>
                  </div>
                  <div
                    className={`mt-1 rounded-bento-sm px-2 py-1.5 text-center ${
                      isToday
                        ? 'bg-red-100 dark:bg-red-900/30'
                        : 'bg-blue-100 dark:bg-blue-900/30'
                    }`}
                  >
                    <div
                      className={`text-xs font-medium ${
                        isToday
                          ? 'text-red-700 dark:text-red-300'
                          : 'text-blue-700 dark:text-blue-300'
                      }`}
                    >
                      {isToday ? 'Today!' : 'Starts in'}
                    </div>
                    <div
                      className={`font-mono text-lg font-bold tabular-nums ${
                        isToday
                          ? 'text-red-800 dark:text-red-200'
                          : 'text-blue-800 dark:text-blue-200'
                      }`}
                    >
                      {days > 0 ? `${days}d ` : ''}
                      {String(hours).padStart(2, '0')}h {String(minutes).padStart(2, '0')}m{' '}
                      {String(seconds).padStart(2, '0')}s
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Recent Activities */}
      <div>
        <h2 className="mb-3 text-lg font-bold text-bento-800 dark:text-bento-100">Recent Activities</h2>
        {activities.length === 0 ? (
          <div className="card text-center py-12 text-bento-400">
            No activities yet. Click "New Application" to get started.
          </div>
        ) : (
          <div className="card divide-y divide-bento-100 dark:divide-bento-800">
            {activities.map((activity) => (
              <Link
                key={activity.id}
                to={`/applications/${activity.appId}`}
                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-bento-50 dark:hover:bg-bento-900/40"
              >
                <div className="flex shrink-0 items-center justify-center rounded-bento-sm bg-bento-100 p-2 dark:bg-bento-800">
                  {activity.type === 'applied' ? (
                    <Send size={16} className="text-bento-600 dark:text-bento-300" />
                  ) : (
                    <Video size={16} className="text-bento-600 dark:text-bento-300" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate font-semibold text-bento-800 dark:text-bento-100">
                      {activity.company}
                    </span>
                    {activity.type === 'applied' ? (
                      <StatusBadge status={activity.status} />
                    ) : (
                      <InterviewStatusBadge status={activity.status} />
                    )}
                  </div>
                  <p className="truncate text-sm text-bento-500 dark:text-bento-400">
                    {activity.type === 'applied' ? (
                      <>Applied for {activity.position}</>
                    ) : (
                      <>
                        {activity.roundName ? `${activity.roundName} — ` : ''}Interview for {activity.position}
                      </>
                    )}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1 text-xs text-bento-400">
                  <Clock size={12} />
                  <span>{formatDate(activity.date)}{activity.type === 'interview' && activity.scheduledTime ? ` at ${activity.scheduledTime}` : ''}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function StatCard({
  icon,
  label,
  value,
  color,
  to,
}: {
  icon: React.ReactNode
  label: string
  value: number
  color: string
  to: string
}) {
  const colorClasses: Record<string, string> = {
    indigo: 'text-bento-700 dark:text-bento-200 bg-bento-100 dark:bg-bento-800',
    yellow: 'text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/30',
    green: 'text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/30',
    emerald: 'text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/30',
    red: 'text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/30',
    blue: 'text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/30',
  }
  return (
    <Link
      to={to}
      className="card flex items-center gap-3 transition-all hover:shadow-bento-md hover:border-bento-300 active:scale-[0.97] dark:hover:shadow-bento-dark-md dark:hover:border-bento-700"
    >
      <div className={`shrink-0 rounded-bento-sm p-2.5 ${colorClasses[color]}`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-xl font-bold text-bento-800 dark:text-bento-100 sm:text-2xl">{value}</p>
        <p className="truncate text-xs text-bento-500 dark:text-bento-400">{label}</p>
      </div>
    </Link>
  )
}
