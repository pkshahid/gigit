import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addDays, addMonths, format, isSameDay, isSameMonth, parseISO,
} from 'date-fns'
import { api } from '../api/client'
import { InterviewWithApp } from '../types'
import { InterviewStatusBadge } from '../components/StatusBadge'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Video } from 'lucide-react'
import { DayTimelineView } from '../components/DayTimelineView'

export function CalendarPage() {
  const [interviews, setInterviews] = useState<InterviewWithApp[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  useEffect(() => {
    api.listAllInterviews()
      .then((data) => setInterviews(data))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load interviews'))
      .finally(() => setLoading(false))
  }, [])

  const interviewsByDate = useMemo(() => {
    const map: Record<string, InterviewWithApp[]> = {}
    for (const iv of interviews) {
      const dateKey = iv.scheduled_date.split('T')[0]
      if (!map[dateKey]) map[dateKey] = []
      map[dateKey].push(iv)
    }
    return map
  }, [interviews])

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const startDate = startOfWeek(monthStart)
    const endDate = endOfWeek(monthEnd)

    const days: Date[] = []
    let day = startDate
    while (day <= endDate) {
      days.push(day)
      day = addDays(day, 1)
    }
    return days
  }, [currentDate])

  const selectedDateInterviews = useMemo(() => {
    if (!selectedDate) return []
    const dateKey = format(selectedDate, 'yyyy-MM-dd')
    return interviewsByDate[dateKey] || []
  }, [selectedDate, interviewsByDate])

  const today = new Date()

  if (loading) return <div className="py-20 text-center text-bento-400">Loading...</div>

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-bento-sm border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800/50 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Calendar header */}
      <div className="card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-xl font-bold">
            <CalendarIcon className="text-bento-700 dark:text-bento-300" size={22} />
            {format(currentDate, 'MMMM yyyy')}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentDate(addMonths(currentDate, -1))}
              className="btn btn-secondary btn-sm"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => {
                setCurrentDate(new Date())
                setSelectedDate(new Date())
              }}
              className="btn btn-secondary btn-sm"
            >
              Today
            </button>
            <button
              onClick={() => setCurrentDate(addMonths(currentDate, 1))}
              className="btn btn-secondary btn-sm"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Day headers */}
        <div className="mb-2 grid grid-cols-7 gap-1">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div key={d} className="py-2 text-center text-xs font-semibold text-bento-400">
              <span className="hidden sm:inline">{d}</span>
              <span className="sm:hidden">{d.charAt(0)}</span>
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day) => {
            const dateKey = format(day, 'yyyy-MM-dd')
            const dayInterviews = interviewsByDate[dateKey] || []
            const isToday = isSameDay(day, today)
            const isCurrentMonth = isSameMonth(day, currentDate)
            const isSelected = selectedDate && isSameDay(day, selectedDate)

            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDate(day)}
                className={`min-h-[60px] rounded-bento-sm border p-1.5 text-left transition-all duration-200 sm:min-h-[80px] sm:p-2 ${
                  isSelected
                    ? 'border-bento-400 bg-bento-100 dark:border-bento-500 dark:bg-bento-800'
                    : isToday
                    ? 'border-bento-300 bg-bento-50 dark:border-bento-600 dark:bg-bento-800/50'
                    : 'border-bento-200 bg-white hover:border-bento-300 hover:shadow-bento-sm dark:border-bento-800 dark:bg-bento-900 dark:hover:border-bento-700'
                } ${!isCurrentMonth ? 'opacity-40' : ''}`}
              >
                <div className={`text-sm font-semibold ${isToday ? 'text-bento-900 dark:text-bento-100' : 'text-bento-700 dark:text-bento-200'}`}>
                  {format(day, 'd')}
                </div>
                <div className="mt-1 space-y-1">
                  {dayInterviews.slice(0, 2).map((iv) => (
                    <div
                      key={iv.id}
                      className="truncate rounded-bento-sm bg-bento-100 px-1.5 py-0.5 text-xs font-medium text-bento-600 dark:bg-bento-800 dark:text-bento-300"
                    >
                      {iv.company} - R{iv.round_number}
                    </div>
                  ))}
                  {dayInterviews.length > 2 && (
                    <div className="text-xs text-bento-400">+{dayInterviews.length - 2} more</div>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Selected date 24-hour timeline */}
      {selectedDate && (
        <div className="card">
          <DayTimelineView date={selectedDate} interviews={selectedDateInterviews} />
        </div>
      )}

      {/* Upcoming interviews list */}
      <div className="card">
        <h3 className="mb-4 text-lg font-semibold">All Upcoming Interviews</h3>
        {interviews.filter((iv) => {
          const ivDate = parseISO(iv.scheduled_date)
          return ivDate >= today && iv.status === 'scheduled'
        }).length === 0 ? (
          <p className="py-4 text-center text-sm text-bento-400">No upcoming scheduled interviews.</p>
        ) : (
          <div className="space-y-2">
            {interviews
              .filter((iv) => {
                const ivDate = parseISO(iv.scheduled_date)
                return ivDate >= today && iv.status === 'scheduled'
              })
              .sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date))
              .map((iv) => (
                <Link
                  key={iv.id}
                  to={`/applications/${iv.application_id}`}
                  className="flex items-center justify-between rounded-bento-sm border border-bento-200 bg-white p-3 transition-all hover:border-bento-300 hover:shadow-bento-md dark:border-bento-800 dark:bg-bento-900 dark:hover:border-bento-700 dark:hover:shadow-bento-dark-md"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-bento-sm bg-bento-900 dark:bg-bento-100">
                      <span className="text-xs font-medium text-white dark:text-bento-900">
                        {format(parseISO(iv.scheduled_date), 'MMM')}
                      </span>
                      <span className="text-lg font-bold text-white dark:text-bento-900">
                        {format(parseISO(iv.scheduled_date), 'd')}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{iv.company}</p>
                      <p className="truncate text-sm text-bento-500 dark:text-bento-400">
                        Round {iv.round_number}{iv.round_name ? ` - ${iv.round_name}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {iv.join_link && (
                      <a
                        href={iv.join_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="btn btn-primary btn-sm"
                      >
                        <Video size={14} /> Join
                      </a>
                    )}
                    <InterviewStatusBadge status={iv.status} />
                  </div>
                </Link>
              ))}
          </div>
        )}
      </div>
    </div>
  )
}
