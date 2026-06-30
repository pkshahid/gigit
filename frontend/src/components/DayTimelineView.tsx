import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import { InterviewWithApp } from '../types'
import { InterviewStatusBadge } from './StatusBadge'
import { Modal } from './Modal'
import { Clock, Building2, Briefcase, Calendar, FileText, Layers, ExternalLink, Video } from 'lucide-react'

interface DayTimelineViewProps {
  date: Date
  interviews: InterviewWithApp[]
}

interface TimeBlock {
  interview: InterviewWithApp
  startMinutes: number
  endMinutes: number
  column: number
  totalColumns: number
}

const HOUR_HEIGHT = 56 // px per hour
const TIMELINE_START = 0 // 00:00
const TIMELINE_END = 24 // 24:00

function parseTimeToMinutes(time: string): number | null {
  const match = time.match(/^(\d{1,2}):(\d{2})$/)
  if (!match) return null
  const [, h, m] = match
  return parseInt(h, 10) * 60 + parseInt(m, 10)
}

export function DayTimelineView({ date, interviews }: DayTimelineViewProps) {
  const [selectedInterview, setSelectedInterview] = useState<InterviewWithApp | null>(null)

  const hours = useMemo(() => {
    const arr: number[] = []
    for (let h = TIMELINE_START; h < TIMELINE_END; h++) arr.push(h)
    return arr
  }, [])

  const blocks = useMemo<TimeBlock[]>(() => {
    const parsed = interviews
      .map((iv) => {
        const startMinutes = iv.scheduled_time
          ? parseTimeToMinutes(iv.scheduled_time)
          : 0
        if (startMinutes === null) return null
        // Default 1-hour duration if no end time available
        const endMinutes = Math.min(startMinutes + 60, TIMELINE_END * 60)
        return { interview: iv, startMinutes, endMinutes }
      })
      .filter((x): x is { interview: InterviewWithApp; startMinutes: number; endMinutes: number } => x !== null)
      .sort((a, b) => a.startMinutes - b.startMinutes)

    // Assign columns for overlapping events
    const result: TimeBlock[] = []
    const columnEnds: number[] = []

    for (const item of parsed) {
      let assigned = -1
      for (let c = 0; c < columnEnds.length; c++) {
        if (columnEnds[c] <= item.startMinutes) {
          assigned = c
          break
        }
      }
      if (assigned === -1) {
        assigned = columnEnds.length
        columnEnds.push(item.endMinutes)
      } else {
        columnEnds[assigned] = item.endMinutes
      }
      result.push({
        ...item,
        column: assigned,
        totalColumns: 0, // will be set below
      })
    }

    // Calculate total columns per overlap group
    for (let i = 0; i < result.length; i++) {
      let maxCol = result[i].column
      for (let j = 0; j < result.length; j++) {
        if (i === j) continue
        const overlap =
          result[i].startMinutes < result[j].endMinutes &&
          result[j].startMinutes < result[i].endMinutes
        if (overlap) {
          maxCol = Math.max(maxCol, result[j].column)
        }
      }
      const totalCols = maxCol + 1
      result[i].totalColumns = totalCols
      // Also set for all overlapping siblings
      for (let j = 0; j < result.length; j++) {
        if (i === j) continue
        const overlap =
          result[i].startMinutes < result[j].endMinutes &&
          result[j].startMinutes < result[i].endMinutes
        if (overlap) {
          result[j].totalColumns = Math.max(result[j].totalColumns, totalCols)
        }
      }
    }

    return result
  }, [interviews])

  const now = new Date()
  const isToday = format(date, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd')
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  const showNowLine = isToday && currentMinutes >= 0 && currentMinutes < TIMELINE_END * 60

  return (
    <div className="flex max-h-[600px] flex-col">
      {/* Header */}
      <div className="mb-3 flex items-center gap-2 border-b border-bento-200 pb-3 dark:border-bento-800">
        <Clock className="text-bento-500 dark:text-bento-400" size={18} />
        <h3 className="text-lg font-semibold">
          {format(date, 'EEEE, MMMM d, yyyy')}
        </h3>
        <span className="ml-auto text-sm text-bento-400">
          {interviews.length} {interviews.length === 1 ? 'event' : 'events'}
        </span>
      </div>

      {/* Scrollable timeline */}
      <div className="relative overflow-y-auto">
        <div className="relative" style={{ height: (TIMELINE_END - TIMELINE_START) * HOUR_HEIGHT }}>
          {/* Hour grid lines & labels */}
          {hours.map((h) => (
            <div
              key={h}
              className="relative flex"
              style={{ height: HOUR_HEIGHT }}
            >
              {/* Time label */}
              <div className="sticky left-0 w-16 shrink-0 pr-2 text-right">
                <span className="text-xs font-medium text-bento-400">
                  {h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`}
                </span>
              </div>
              {/* Grid line + half-hour line */}
              <div className="relative flex-1 border-t border-bento-100 dark:border-bento-800/60">
                <div
                  className="absolute inset-x-0 top-1/2 border-t border-dashed border-bento-100 dark:border-bento-800/40"
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          ))}

          {/* Current time indicator */}
          {showNowLine && (
            <div
              className="absolute left-16 right-0 z-20 flex items-center"
              style={{ top: (currentMinutes - TIMELINE_START * 60) * (HOUR_HEIGHT / 60) }}
            >
              <div className="absolute -left-1 h-3 w-3 rounded-full bg-red-500" />
              <div className="h-0.5 flex-1 bg-red-500" />
              <span className="ml-1 shrink-0 rounded bg-red-500 px-1 text-[10px] font-semibold text-white">
                {format(now, 'h:mm a')}
              </span>
            </div>
          )}

          {/* Event blocks */}
          {blocks.map((block) => {
            const top = (block.startMinutes - TIMELINE_START * 60) * (HOUR_HEIGHT / 60)
            const height = Math.max(
              (block.endMinutes - block.startMinutes) * (HOUR_HEIGHT / 60) - 2,
              24,
            )
            const widthPercent = 100 / block.totalColumns
            const leftPercent = block.column * widthPercent

            return (
              <button
                key={block.interview.id}
                onClick={() => setSelectedInterview(block.interview)}
                className="absolute z-10 flex flex-col overflow-hidden rounded-bento-sm border-l-4 border-bento-500 bg-bento-100 p-2 text-left shadow-bento-sm transition-all hover:z-30 hover:shadow-bento-md dark:border-bento-400 dark:bg-bento-800"
                style={{
                  top,
                  height,
                  left: `calc(4rem + ${leftPercent}% * (100% - 4rem) / 100%)`,
                  width: `calc(${widthPercent}% * (100% - 4rem) / 100% - 4px)`,
                }}
              >
                <div className="flex items-start justify-between gap-1">
                  <span className="truncate text-xs font-bold text-bento-800 dark:text-bento-100">
                    {block.interview.company}
                  </span>
                </div>
                <span className="truncate text-[10px] text-bento-600 dark:text-bento-300">
                  {block.interview.scheduled_time
                    ? format(parseISO(`2000-01-01T${block.interview.scheduled_time}`), 'h:mm a')
                    : 'All day'}
                  {' · '}
                  R{block.interview.round_number}
                </span>
                {height > 50 && (
                  <span className="mt-0.5 truncate text-[10px] text-bento-500 dark:text-bento-400">
                    {block.interview.position}
                  </span>
                )}
                {height > 70 && (
                  <div className="mt-auto flex items-center justify-between pt-1">
                    <InterviewStatusBadge status={block.interview.status} />
                    {block.interview.join_link && (
                      <a
                        href={block.interview.join_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          window.open(block.interview.join_link, '_blank', 'noopener,noreferrer')
                        }}
                        className="flex items-center gap-1 rounded-bento-sm bg-bento-600 px-1.5 py-0.5 text-[10px] font-semibold text-white transition-colors hover:bg-bento-700 dark:bg-bento-500 dark:hover:bg-bento-400"
                      >
                        <Video size={10} /> Join
                      </a>
                    )}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Interview detail modal */}
      <Modal
        open={selectedInterview !== null}
        onClose={() => setSelectedInterview(null)}
        title="Interview Details"
      >
        {selectedInterview && (
          <div className="space-y-4">
            {/* Company & Position */}
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-bento bg-bento-900 dark:bg-bento-100">
                <Building2 className="text-white dark:text-bento-900" size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-bold text-bento-800 dark:text-bento-100">
                  {selectedInterview.company}
                </h3>
                <p className="flex items-center gap-1.5 text-sm text-bento-500 dark:text-bento-400">
                  <Briefcase size={14} />
                  {selectedInterview.position}
                </p>
              </div>
              <InterviewStatusBadge status={selectedInterview.status} />
            </div>

            {/* Details grid */}
            <div className="grid gap-3 sm:grid-cols-2">
              {/* Round info */}
              <div className="card-sm">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase text-bento-400">
                  <Layers size={14} />
                  Round
                </div>
                <p className="mt-1 text-sm font-medium text-bento-700 dark:text-bento-200">
                  Round {selectedInterview.round_number}
                  {selectedInterview.round_name ? ` — ${selectedInterview.round_name}` : ''}
                </p>
              </div>

              {/* Schedule */}
              <div className="card-sm">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase text-bento-400">
                  <Calendar size={14} />
                  Scheduled
                </div>
                <p className="mt-1 text-sm font-medium text-bento-700 dark:text-bento-200">
                  {format(parseISO(selectedInterview.scheduled_date), 'EEEE, MMM d, yyyy')}
                  {selectedInterview.scheduled_time && (
                    <span className="block text-bento-500 dark:text-bento-400">
                      {format(parseISO(`2000-01-01T${selectedInterview.scheduled_time}`), 'h:mm a')}
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Notes */}
            {selectedInterview.notes && (
              <div className="card-sm">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase text-bento-400">
                  <FileText size={14} />
                  Notes
                </div>
                <p className="mt-1 whitespace-pre-wrap text-sm text-bento-600 dark:text-bento-300">
                  {selectedInterview.notes}
                </p>
              </div>
            )}

            {/* Action */}
            <div className="flex justify-end gap-2 pt-2">
              {selectedInterview.join_link && (
                <a
                  href={selectedInterview.join_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary btn-sm"
                >
                  <Video size={14} /> Join
                </a>
              )}
              <Link
                to={`/applications/${selectedInterview.application_id}`}
                className="btn btn-secondary btn-sm"
                onClick={() => setSelectedInterview(null)}
              >
                <ExternalLink size={14} />
                View Application
              </Link>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
