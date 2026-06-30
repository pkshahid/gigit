import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Briefcase, Video, BellRing, X } from 'lucide-react'
import { api } from '../api/client'
import { SearchResult } from '../types'

export function GlobalSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [highlightIndex, setHighlightIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()
  const navigate = useNavigate()

  const doSearch = useCallback(async (q: string) => {
    if (q.trim().length === 0) {
      setResults([])
      setLoading(false)
      return
    }
    try {
      const res = await api.search(q.trim())
      setResults(res.results)
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (query.trim().length === 0) {
      setResults([])
      setLoading(false)
      return
    }
    setLoading(true)
    debounceRef.current = setTimeout(() => doSearch(query), 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, doSearch])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || results.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightIndex((prev) => (prev + 1) % results.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightIndex((prev) => (prev - 1 + results.length) % results.length)
    } else if (e.key === 'Enter' && highlightIndex >= 0) {
      e.preventDefault()
      const result = results[highlightIndex]
      navigate(`/applications/${result.application_id}`)
      setOpen(false)
      setQuery('')
      setHighlightIndex(-1)
    } else if (e.key === 'Escape') {
      setOpen(false)
      setHighlightIndex(-1)
    }
  }

  const handleResultClick = (result: SearchResult) => {
    navigate(`/applications/${result.application_id}`)
    setOpen(false)
    setQuery('')
    setHighlightIndex(-1)
  }

  const typeIcon = (type: string) => {
    if (type === 'interview') return <Video size={14} className="text-blue-500 dark:text-blue-400" />
    if (type === 'follow_up') return <BellRing size={14} className="text-amber-500 dark:text-amber-400" />
    return <Briefcase size={14} className="text-bento-500 dark:text-bento-400" />
  }

  const typeLabel = (type: string) => {
    if (type === 'interview') return 'Interview'
    if (type === 'follow_up') return 'Follow-up'
    return 'Application'
  }

  return (
    <div ref={containerRef} className="relative w-full sm:w-64 lg:w-80">
      <div className="relative">
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-bento-400 dark:text-bento-500"
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
            setHighlightIndex(-1)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search applications, interviews..."
          className="input pl-9 pr-8 py-2 text-sm"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('')
              setResults([])
              setOpen(false)
              inputRef.current?.focus()
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-bento-400 hover:text-bento-600 dark:hover:text-bento-300"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {open && (query.trim().length > 0) && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-96 overflow-y-auto rounded-bento-sm border border-bento-200 bg-white shadow-bento-md dark:border-bento-800 dark:bg-bento-900 dark:shadow-bento-dark-md">
          {loading ? (
            <div className="px-4 py-6 text-center text-sm text-bento-400">Searching...</div>
          ) : results.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-bento-400">
              No results found for "{query}"
            </div>
          ) : (
            <ul className="py-1">
              {results.map((result, idx) => (
                <li key={`${result.type}-${result.id}`}>
                  <button
                    onClick={() => handleResultClick(result)}
                    onMouseEnter={() => setHighlightIndex(idx)}
                    className={`flex w-full items-start gap-3 px-4 py-2.5 text-left transition-colors ${
                      idx === highlightIndex
                        ? 'bg-bento-100 dark:bg-bento-800'
                        : 'hover:bg-bento-50 dark:hover:bg-bento-800/50'
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">{typeIcon(result.type)}</div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-semibold text-bento-800 dark:text-bento-100">
                          {result.title}
                        </span>
                        <span className="shrink-0 rounded-full bg-bento-100 px-1.5 py-0.5 text-[10px] font-medium text-bento-500 dark:bg-bento-800 dark:text-bento-400">
                          {typeLabel(result.type)}
                        </span>
                      </div>
                      <p className="truncate text-xs text-bento-500 dark:text-bento-400">
                        {result.subtitle}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
