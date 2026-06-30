import { useState, useRef, useEffect, type ReactNode } from 'react'
import { MoreVertical } from 'lucide-react'

export interface RowAction {
  icon?: ReactNode
  label: string
  onClick?: () => void
  href?: string
  className?: string
  disabled?: boolean
  showLabelOnDesktop?: boolean
}

export function RowActions({ actions }: { actions: RowAction[] }) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={menuRef} className="relative shrink-0 self-end sm:self-auto">
      {/* Desktop: inline buttons */}
      <div className="hidden gap-1 sm:flex">
        {actions.map((action, i) =>
          action.href ? (
            <a
              key={i}
              href={action.href}
              target="_blank"
              rel="noopener noreferrer"
              className={action.className || 'btn btn-secondary btn-sm'}
            >
              {action.icon}
              {action.showLabelOnDesktop && <span>{action.label}</span>}
            </a>
          ) : (
            <button
              key={i}
              onClick={action.onClick}
              disabled={action.disabled}
              className={action.className || 'btn btn-secondary btn-sm'}
              aria-label={action.label}
            >
              {action.icon}
              {action.showLabelOnDesktop && (
                <span>{action.disabled ? '...' : action.label}</span>
              )}
            </button>
          )
        )}
      </div>

      {/* Mobile: dropdown */}
      <div className="sm:hidden">
        <button
          onClick={() => setOpen(!open)}
          className="btn btn-secondary btn-sm"
          aria-label="Actions"
        >
          <MoreVertical size={16} />
        </button>
        {open && (
          <div className="absolute right-0 top-full z-20 mt-1 min-w-[140px] rounded-bento-sm border border-bento-200 bg-white py-1 shadow-bento-md dark:border-bento-800 dark:bg-bento-900">
            {actions.map((action, i) =>
              action.href ? (
                <a
                  key={i}
                  href={action.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-bento-700 hover:bg-bento-100 dark:text-bento-300 dark:hover:bg-bento-800"
                >
                  {action.icon}
                  <span>{action.label}</span>
                </a>
              ) : (
                <button
                  key={i}
                  onClick={() => {
                    setOpen(false)
                    action.onClick?.()
                  }}
                  disabled={action.disabled}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-bento-700 hover:bg-bento-100 disabled:opacity-50 dark:text-bento-300 dark:hover:bg-bento-800"
                >
                  {action.icon}
                  <span>{action.disabled ? '...' : action.label}</span>
                </button>
              )
            )}
          </div>
        )}
      </div>
    </div>
  )
}
