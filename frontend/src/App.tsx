import { Routes, Route, useNavigate, Navigate } from 'react-router-dom'
import { Layout } from './components/Layout'
import { DashboardPage } from './pages/DashboardPage'
import { ApplicationDetailPage } from './pages/ApplicationDetailPage'
import { CalendarPage } from './pages/CalendarPage'
import { UpcomingInterviewsPage } from './pages/UpcomingInterviewsPage'
import { AppliedJobsPage } from './pages/AppliedJobsPage'
import { OngoingInterviewsPage } from './pages/OngoingInterviewsPage'
import { RejectedInterviewsPage } from './pages/RejectedInterviewsPage'
import { ReApplyableJobsPage } from './pages/ReApplyableJobsPage'
import { FollowUpNeededPage } from './pages/FollowUpNeededPage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { useState } from 'react'
import { ApplicationFormModal } from './components/ApplicationFormModal'
import { ConfirmDialog } from './components/ConfirmDialog'
import { useAuth } from './context/AuthContext'
import { Application } from './types'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-bento-400">Loading...</p>
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  const navigate = useNavigate()
  const { user, loading } = useAuth()
  const [showAddModal, setShowAddModal] = useState(false)

  const handleAddApplication = () => setShowAddModal(true)

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-bento-400">Loading...</p>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to="/" replace /> : <RegisterPage />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
          <ConfirmDialog>
            <Layout onAddApplication={handleAddApplication}>
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/applications/:id" element={<ApplicationDetailPage />} />
                <Route path="/calendar" element={<CalendarPage />} />
                <Route path="/upcoming-interviews" element={<UpcomingInterviewsPage />} />
                <Route path="/applied" element={<AppliedJobsPage />} />
                <Route path="/ongoing" element={<OngoingInterviewsPage />} />
                <Route path="/rejected" element={<RejectedInterviewsPage />} />
                <Route path="/re-applyable" element={<ReApplyableJobsPage />} />
                <Route path="/follow-up-needed" element={<FollowUpNeededPage />} />
              </Routes>
            </Layout>
            <ApplicationFormModal
              open={showAddModal}
              onClose={() => setShowAddModal(false)}
              onSaved={(app: Application) => {
                setShowAddModal(false)
                navigate(`/applications/${app.id}`)
              }}
            />
          </ConfirmDialog>
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}
