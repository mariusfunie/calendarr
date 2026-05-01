'use client'

import { useEffect, useState } from 'react'
import { RefreshCw, AlertCircle } from 'lucide-react'
import MediaGrid, { SkeletonGrid } from '@/components/MediaGrid'
import RangeSelector, { type DayRange } from '@/components/RangeSelector'
import type { EnrichedMovie } from '../api/calendar/route'

type ReleaseFilter = 'all' | 'cinemas' | 'digital' | 'physical'

export default function MoviesPage() {
  const [movies, setMovies] = useState<EnrichedMovie[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [releaseFilter, setReleaseFilter] = useState<ReleaseFilter>('all')
  const [refreshing, setRefreshing] = useState(false)
  const [days, setDays] = useState<DayRange>(30)

  async function load(quiet = false) {
    if (!quiet) setLoading(true)
    else setRefreshing(true)
    setError(null)
    try {
      const res = await fetch(`/api/calendar?type=movies&days=${days}`)
      if (!res.ok) throw new Error('Server error')
      const data = await res.json()
      setMovies(data.movies ?? [])
      if (data.errors?.radarr) setError('Cannot connect to Radarr. Check your settings.')
    } catch {
      setError('Failed to load.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { load() }, [days])

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const filtered = movies.filter(m => {
    if (!m.releaseDate) return false
    const release = new Date(m.releaseDate + 'T00:00:00')
    if (release < today) return false
    if (releaseFilter === 'cinemas') return !!m.inCinemas
    if (releaseFilter === 'digital') return !!m.digitalRelease
    if (releaseFilter === 'physical') return !!m.physicalRelease
    return true
  })

  const tabs: { value: ReleaseFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'cinemas', label: '🎞️ Cinemas' },
    { value: 'digital', label: '💻 Digital' },
    { value: 'physical', label: '📦 Physical' },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-[#e8e8f4]">Movies</h1>
          <p className="text-[#6b6b8a] mt-1">Upcoming releases — {days} days</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <RangeSelector value={days} onChange={setDays} />
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#17172a] border border-[#1e1e32] text-[#6b6b8a] hover:text-[#e8e8f4] transition-colors text-sm disabled:opacity-50"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400">
          <AlertCircle size={18} />
          <p className="text-sm">{error}</p>
          <a href="/settings" className="ml-auto text-xs underline">Settings</a>
        </div>
      )}

      {/* Release type filter */}
      <div className="flex gap-1 bg-[#11111c] border border-[#1e1e32] rounded-xl p-1 w-fit flex-wrap">
        {tabs.map(tab => (
          <button
            key={tab.value}
            onClick={() => setReleaseFilter(tab.value)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              releaseFilter === tab.value
                ? 'bg-[#0e7490] text-white'
                : 'text-[#6b6b8a] hover:text-[#e8e8f4]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {!loading && (
        <p className="text-[#6b6b8a] text-sm">
          {filtered.length} movie{filtered.length !== 1 ? 's' : ''} —{' '}
          {filtered.filter(m => m.hasFile).length} downloaded
        </p>
      )}

      {loading ? (
        <SkeletonGrid count={10} />
      ) : (
        <MediaGrid items={filtered} groupByDate />
      )}
    </div>
  )
}
