import { ReactNode } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { Calendar, LayoutDashboard, LogOut, Plus, Video, Send, TrendingUp, XCircle, RefreshCw, BellRing } from 'lucide-react'
import { ThemeToggle } from './ThemeToggle'
import { GlobalSearch } from './GlobalSearch'
import { useAuth } from '../context/AuthContext'

interface LayoutProps {
  children: ReactNode
  onAddApplication?: () => void
}

export function Layout({ children, onAddApplication }: LayoutProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2 px-4 py-2.5 rounded-bento-sm text-sm font-semibold transition-all duration-200 ${
      isActive
        ? 'bg-bento-900 text-white shadow-bento-sm dark:bg-bento-100 dark:text-bento-900'
        : 'text-bento-500 hover:bg-bento-100 hover:text-bento-700 dark:text-bento-400 dark:hover:bg-bento-800 dark:hover:text-bento-200'
    }`

  const mobileNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex flex-col items-center gap-1 px-2 py-1.5 text-xs font-semibold transition-all duration-200 ${
      isActive
        ? 'text-bento-900 dark:text-bento-100'
        : 'text-bento-400 dark:text-bento-500'
    }`

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-bento-200 bg-white/80 backdrop-blur-md dark:border-bento-800 dark:bg-bento-950/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-4 py-3.5">
          <div className="flex shrink-0 items-center gap-2">
            <img src="/logo.png" alt="Gigit" className="h-9 w-9 rounded-bento-sm" />
            <span className="hidden text-lg font-bold text-bento-800 dark:text-bento-100 sm:inline">Gigit</span>
          </div>
          <div className="flex flex-1 justify-center px-2 sm:px-4">
            <GlobalSearch />
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            {onAddApplication && (
              <button onClick={onAddApplication} className="btn btn-primary btn-sm">
                <Plus size={16} /> <span className="hidden sm:inline">New Application</span>
              </button>
            )}
            {user && (
              <div className="flex items-center gap-2">
                <span className="hidden text-sm text-bento-500 dark:text-bento-400 lg:inline">
                  {user.email}
                </span>
                <button onClick={handleLogout} className="btn btn-secondary btn-sm" title="Sign out">
                  <LogOut size={16} />
                </button>
              </div>
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 pb-24 md:pb-6">
        <nav className="hidden w-56 shrink-0 md:block">
          <div className="space-y-2">
            <NavLink to="/" end className={navLinkClass}>
              <LayoutDashboard size={18} /> Dashboard
            </NavLink>
            <NavLink to="/calendar" className={navLinkClass}>
              <Calendar size={18} /> Calendar
            </NavLink>
            <NavLink to="/upcoming-interviews" className={navLinkClass}>
              <Video size={18} /> Upcoming Interviews
            </NavLink>
            <NavLink to="/applied" className={navLinkClass}>
              <Send size={18} /> Applied Jobs
            </NavLink>
            <NavLink to="/ongoing" className={navLinkClass}>
              <TrendingUp size={18} /> Ongoing
            </NavLink>
            <NavLink to="/rejected" className={navLinkClass}>
              <XCircle size={18} /> Rejected
            </NavLink>
            <NavLink to="/re-applyable" className={navLinkClass}>
              <RefreshCw size={18} /> Re-Applyable
            </NavLink>
            <NavLink to="/follow-up-needed" className={navLinkClass}>
              <BellRing size={18} /> Follow-up Needed
            </NavLink>
          </div>
        </nav>

        <main className="min-w-0 flex-1">{children}</main>
      </div>

      {/* Mobile bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-bento-200 bg-white/90 backdrop-blur-md dark:border-bento-800 dark:bg-bento-950/90 md:hidden">
        <div className="mx-auto flex max-w-7xl items-center justify-around px-2 py-1.5">
          <NavLink to="/" end className={mobileNavLinkClass}>
            <LayoutDashboard size={22} />
            <span>Home</span>
          </NavLink>
          <NavLink to="/upcoming-interviews" className={mobileNavLinkClass}>
            <Video size={22} />
            <span>Upcoming</span>
          </NavLink>
          {onAddApplication && (
            <button
              onClick={onAddApplication}
              className="flex flex-col items-center gap-1 rounded-bento-sm bg-bento-900 px-4 py-1.5 text-xs font-semibold text-white shadow-bento-sm dark:bg-bento-100 dark:text-bento-900"
            >
              <Plus size={22} />
              <span>Add</span>
            </button>
          )}
          <NavLink to="/applied" className={mobileNavLinkClass}>
            <Send size={22} />
            <span>Applied</span>
          </NavLink>
          <NavLink to="/re-applyable" className={mobileNavLinkClass}>
            <RefreshCw size={22} />
            <span>Re-Apply</span>
          </NavLink>
        </div>
      </nav>
    </div>
  )
}
