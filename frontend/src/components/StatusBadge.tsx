import { STATUS_OPTIONS } from '../types'

const statusColors: Record<string, string> = {
  applied: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  interview: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  offer: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  accepted: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
}

const interviewStatusColors: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  attended: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  passed: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  failed: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  cancelled: 'bg-bento-100 text-bento-600 dark:bg-bento-800 dark:text-bento-400',
}

export function StatusBadge({ status }: { status: string }) {
  const color = statusColors[status] || 'bg-bento-100 text-bento-600 dark:bg-bento-800 dark:text-bento-400'
  return <span className={`badge ${color}`}>{status}</span>
}

export function InterviewStatusBadge({ status }: { status: string }) {
  const color = interviewStatusColors[status] || 'bg-bento-100 text-bento-600 dark:bg-bento-800 dark:text-bento-400'
  return <span className={`badge ${color}`}>{status}</span>
}

export { STATUS_OPTIONS }
