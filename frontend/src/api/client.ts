import {
  Application,
  ApplicationDetail,
  Interview,
  InterviewWithApp,
  FollowUp,
  Stats,
  AuthResponse,
  User,
  SearchResponse,
} from '../types'

const BASE = '/api'
const TOKEN_KEY = 'auth_token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  const res = await fetch(`${BASE}${url}`, {
    headers,
    ...options,
  })
  if (res.status === 401) {
    clearToken()
    window.location.href = '/login'
    throw new Error('Session expired')
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || 'Request failed')
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

export const api = {
  // Auth
  register: (email: string, password: string) =>
    request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  login: (email: string, password: string) =>
    request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  getMe: () => request<User>('/auth/me'),

  // Applications
  listApplications: () => request<Application[]>('/applications'),
  getApplication: (id: number) => request<ApplicationDetail>(`/applications/${id}`),
  createApplication: (data: Partial<Application>) =>
    request<Application>('/applications', { method: 'POST', body: JSON.stringify(data) }),
  updateApplication: (id: number, data: Partial<Application>) =>
    request<Application>(`/applications/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteApplication: (id: number) =>
    request<void>(`/applications/${id}`, { method: 'DELETE' }),
  getStats: () => request<Stats>('/applications/stats'),
  getFollowUpNeeded: () => request<Application[]>('/applications/follow-up-needed'),

  // Interviews
  listAllInterviews: () => request<InterviewWithApp[]>('/interviews'),
  createInterview: (appId: number, data: Partial<Interview>) =>
    request<Interview>(`/applications/${appId}/interviews`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateInterview: (appId: number, id: number, data: Partial<Interview>) =>
    request<Interview>(`/applications/${appId}/interviews/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteInterview: (appId: number, id: number) =>
    request<void>(`/applications/${appId}/interviews/${id}`, { method: 'DELETE' }),

  // Follow-ups
  createFollowUp: (appId: number, data: Partial<FollowUp>) =>
    request<FollowUp>(`/applications/${appId}/follow-ups`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateFollowUp: (appId: number, id: number, data: Partial<FollowUp>) =>
    request<FollowUp>(`/applications/${appId}/follow-ups/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteFollowUp: (appId: number, id: number) =>
    request<void>(`/applications/${appId}/follow-ups/${id}`, { method: 'DELETE' }),

  // Search
  search: (q: string) =>
    request<SearchResponse>(`/search?q=${encodeURIComponent(q)}`),
}
