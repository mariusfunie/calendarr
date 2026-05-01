'use client'

import { useEffect, useState } from 'react'
import { Tv2, Film, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react'
import MediaGrid, { SkeletonGrid } from '@/components/MediaGrid'
import MediaModal from '@/components/MediaModal'
import NextUpWidget from '@/components/NextUpWidget'
import RecentlyDownloaded from '@/components/RecentlyDownloaded'
import RangeSelector, { type DayRange } from '@/components/RangeSelector'
import type { EnrichedEpisode, EnrichedMovie } from './api/calendar/route'

type Filter = 'all' | 'series' | 'movies'
type Item = EnrichedEpisode | EnrichedMovie


interface Stats {
  episodes: number
  movies: number
  downloaded: number
  total: number
}

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: number; sub?: string }) {
  return (
    <div className="bg-[#11111c] border border-[#1e1e32] rounded-xl p-4 flex items-center gap-4">
      <div className="w-10 h-10 rounded-lg bg-[#17172a] flex items-center justify-center text-[#818cf8]">
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-[#e8e8f4]">{value}</p>
        <p className="text-xs text-[#6b6b8a]">{label}</p>
        {sub && <p className="text-[10px] text-[#4f46e5] mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [episodes, setEpisodes] = useState<EnrichedEpisode[]>([])
  const [movies, setMovies] = useState<EnrichedMovie[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>('all')
  const [refreshing, setRefreshing] = useState(false)
  const [days, setDays] = useState<DayRange>(30)
  const [selected, setSelected] = useState<Item | null>(null)

  async function load(quiet = false) {
    if (!quiet) setLoading(true)
    else setRefreshing(true)
    setError(null)
    try {
      const res = await fetch(`/api/calendar?type=all&days=${days}`)
      if (!res.ok) throw new Error('Server error')
      const data = await res.json()
      setEpisodes(data.episodes ?? [])
      setMovies(data.movies ?? [])
      if (data.errors?.sonarr && data.errors?.radarr) {
        setError('Cannot connect to Sonarr or Radarr. Check your settings.')
      }
    } catch {
      setError('Failed to load. Check your settings.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { load() }, [days])

  const allItems = [
    ...(filter !== 'movies' ? episodes : []),
    ...(filter !== 'series' ? movies : []),
  ].sort((a, b) => (a.releaseDate ?? '').localeCompare(b.releaseDate ?? ''))

  const stats: Stats = {
    episodes: episodes.length,
    movies: movies.length,
    downloaded: [...episodes, ...movies].filter(i => i.hasFile).length,
    total: episodes.length + movies.length,
  }

  const downloadPct = stats.total > 0 ? Math.round((stats.downloaded / stats.total) * 100) : 0

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Hero */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-[#e8e8f4]">Upcoming Media</h1>
          <p className="text-[#6b6b8a] mt-1">Next {days} days</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <RangeSelector value={days} onChange={setDays} />
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#17172a] border border-[#1e1e32] text-[#6b6b8a] hover:text-[#e8e8f4] hover:border-[#4f46e5]/40 transition-colors text-sm disabled:opacity-50"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400">
          <AlertCircle size={18} />
          <p className="text-sm">{error}</p>
          <a href="/settings" className="ml-auto text-xs underline">Settings</a>
        </div>
      )}

      {/* Next Up */}
      {!loading && allItems.length > 0 && (
        <NextUpWidget items={allItems} onSelect={setSelected} />
      )}

      {/* Stats */}
      {!loading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard icon={<Tv2 size={18} />} label="Episodes" value={stats.episodes} />
          <StatCard icon={<Film size={18} />} label="Movies" value={stats.movies} />
          <StatCard
            icon={<CheckCircle2 size={18} />}
            label="Downloaded"
            value={stats.downloaded}
            sub={`${downloadPct}% of total`}
          />
          <StatCard icon={<span className="text-base">📅</span>} label="Total" value={stats.total} />
        </div>
      )}

      {/* Recently Downloaded */}
      <RecentlyDownloaded />

      {/* Filter tabs */}
      <div className="flex gap-1 bg-[#11111c] border border-[#1e1e32] rounded-xl p-1 w-fit">
        {(['all', 'series', 'movies'] as Filter[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-[#4f46e5] text-white'
                : 'text-[#6b6b8a] hover:text-[#e8e8f4]'
            }`}
          >
            {f === 'all' ? 'All' : f === 'series' ? 'Series' : 'Movies'}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <SkeletonGrid count={12} />
      ) : (
        <MediaGrid items={allItems} groupByDate />
      )}

      {/* Modal for NextUpWidget */}
      {selected && <MediaModal item={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
