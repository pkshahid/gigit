export interface User {
  id: number
  email: string
  created_at: string
}

export interface AuthResponse {
  token: string
  user: User
}

export interface Application {
  id: number
  user_id: number
  company: string
  position: string
  job_description: string
  job_post_source: string
  applied_sources: string[]
  skills: string[]
  resume_name: string
  resume_type: string
  resume_sent: boolean
  status: string
  applied_date: string
  notes: string
  retry_gap_days: number
  created_at: string
  updated_at: string
}

export interface Interview {
  id: number
  application_id: number
  round_number: number
  round_name: string
  scheduled_date: string
  scheduled_time: string
  status: string
  notes: string
  join_link: string
  created_at: string
}

export interface InterviewWithApp extends Interview {
  company: string
  position: string
}

export interface FollowUp {
  id: number
  application_id: number
  date: string
  follow_type: string
  notes: string
  created_at: string
}

export interface ApplicationDetail extends Application {
  interviews: Interview[]
  follow_ups: FollowUp[]
}

export interface SearchResult {
  type: 'application' | 'interview' | 'follow_up'
  id: number
  application_id: number
  company: string
  position: string
  status: string
  title: string
  subtitle: string
}

export interface SearchResponse {
  query: string
  results: SearchResult[]
}

export interface Stats {
  total: number
  applied: number
  interview: number
  offer: number
  rejected: number
  accepted: number
  upcoming_interviews: number
}

export const STATUS_OPTIONS = ['applied', 'interview', 'offer', 'rejected', 'accepted'] as const
export const INTERVIEW_STATUS_OPTIONS = ['scheduled', 'attended', 'passed', 'failed', 'cancelled'] as const
export const FOLLOWUP_TYPE_OPTIONS = ['email', 'call', 'message', 'other'] as const

export const JOB_POST_SOURCE_OPTIONS = [
  'LinkedIn', 'Indeed', 'Glassdoor', 'Company Website', 'AngelList',
  'Hacker News', 'Referral', 'Job Fair', 'Recruiter', 'Other',
] as const

export const APPLIED_SOURCE_OPTIONS = [
  'Company Portal', 'Email', 'LinkedIn', 'Referral', 'Recruiter',
  'Job Board', 'Direct', 'Other',
] as const
