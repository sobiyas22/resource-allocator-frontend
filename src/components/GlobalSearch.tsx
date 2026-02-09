import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Search,
  DoorOpen,
  Calendar,
  Users,
  FileText
} from 'lucide-react'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'
import dayjs from 'dayjs'

interface SearchResult {
  type: 'resource' | 'booking' | 'user'
  id: number
  title: string
  subtitle: string
  url: string
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useKeyboardShortcuts([
    { key: 'k', ctrlKey: true, callback: () => setOpen(true), description: 'Open global search' },
    { key: 'k', metaKey: true, callback: () => setOpen(true), description: 'Open global search (Mac)' }
  ])

  useEffect(() => {
    if (query.length < 2) { setResults([]); return }
    const debounce = setTimeout(() => { performSearch(query) }, 300)
    return () => clearTimeout(debounce)
  }, [query])

  async function performSearch(searchQuery: string) {
    setLoading(true)
    try {
      const [resourcesRes, bookingsRes, usersRes] = await Promise.all([
        api.get<{ resources: any[] }>('/resources').catch(() => ({ resources: [] })),
        api.get<{ bookings: any[] }>('/bookings').catch(() => ({ bookings: [] })),
        api.get<{ users: any[] }>('/users').catch(() => ({ users: [] }))
      ])
      const searchResults: SearchResult[] = []
      const lowerQuery = searchQuery.toLowerCase()

      resourcesRes.resources
        .filter(r => r.name.toLowerCase().includes(lowerQuery) || r.location.toLowerCase().includes(lowerQuery))
        .forEach(r => { searchResults.push({ type: 'resource', id: r.id, title: r.name, subtitle: r.location, url: `/resources/${r.id}` }) })

      bookingsRes.bookings
        .filter(b => b.resource?.name.toLowerCase().includes(lowerQuery) || b.user?.name.toLowerCase().includes(lowerQuery))
        .forEach(b => { searchResults.push({ type: 'booking', id: b.id, title: `${b.resource?.name} - ${b.user?.name}`, subtitle: dayjs(b.start_time).format('MMM D, YYYY h:mm A'), url: `/bookings/${b.id}` }) })

      usersRes.users
        .filter(u => u.name.toLowerCase().includes(lowerQuery) || u.email.toLowerCase().includes(lowerQuery))
        .forEach(u => { searchResults.push({ type: 'user', id: u.id, title: u.name, subtitle: u.email, url: `/users/${u.id}` }) })

      setResults(searchResults.slice(0, 20))
    } catch (err) { console.error('Search failed:', err) }
    finally { setLoading(false) }
  }

  function handleSelect(result: SearchResult) { setOpen(false); navigate(result.url) }

  const getIcon = (type: string) => {
    switch (type) {
      case 'resource': return <DoorOpen className="w-4 h-4" />
      case 'booking': return <Calendar className="w-4 h-4" />
      case 'user': return <Users className="w-4 h-4" />
      default: return <FileText className="w-4 h-4" />
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors text-sm text-neutral-300"
      >
        <Search className="w-4 h-4" />
        <span>Search...</span>
        <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 bg-neutral-700 border border-neutral-600 rounded text-xs text-neutral-400">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Search resources, bookings, users..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {loading ? (
            <div className="p-4 text-center text-sm text-neutral-500">Searching...</div>
          ) : (
            <>
              <CommandEmpty>No results found.</CommandEmpty>

              {results.filter(r => r.type === 'resource').length > 0 && (
                <CommandGroup heading="Resources">
                  {results.filter(r => r.type === 'resource').map((result) => (
                    <CommandItem key={`${result.type}-${result.id}`} onSelect={() => handleSelect(result)} className="cursor-pointer">
                      {getIcon(result.type)}
                      <div className="ml-2">
                        <p className="font-medium text-neutral-900">{result.title}</p>
                        <p className="text-xs text-neutral-500">{result.subtitle}</p>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {results.filter(r => r.type === 'booking').length > 0 && (
                <CommandGroup heading="Bookings">
                  {results.filter(r => r.type === 'booking').map((result) => (
                    <CommandItem key={`${result.type}-${result.id}`} onSelect={() => handleSelect(result)} className="cursor-pointer">
                      {getIcon(result.type)}
                      <div className="ml-2">
                        <p className="font-medium text-neutral-900">{result.title}</p>
                        <p className="text-xs text-neutral-500">{result.subtitle}</p>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {results.filter(r => r.type === 'user').length > 0 && (
                <CommandGroup heading="Users">
                  {results.filter(r => r.type === 'user').map((result) => (
                    <CommandItem key={`${result.type}-${result.id}`} onSelect={() => handleSelect(result)} className="cursor-pointer">
                      {getIcon(result.type)}
                      <div className="ml-2">
                        <p className="font-medium text-neutral-900">{result.title}</p>
                        <p className="text-xs text-neutral-500">{result.subtitle}</p>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  )
}