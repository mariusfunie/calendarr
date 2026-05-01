'use client'

import { useEffect, useState } from 'react'
import { RefreshCw, AlertCircle, LayoutGrid, List } from 'lucide-react'
import MediaGrid, { SkeletonGrid } from '@/components/MediaGrid'
import MediaCard from '@/components/MediaCard'
import RangeSelector, { type DayRange } from '@/components/RangeSelector'
import type { EnrichedEpisode } from '../api/calendar/route'

type GroupMode = 'date' | 'series'

interface SeriesGroup {
  title: string
  poster: string | null
  episodes: EnrichedEpisode[]
}

export default function SeriesPage() {
  const [episodes, setEpisodes] = useState<EnrichedEpisode[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [groupMode, setGroupMode] = useState<GroupMode>('date')
  const [refreshing, setRefreshing] = useState(false)
  const [days, setDays] = useState<DayRange>(30)

  async function load(quiet = false) {
    if (!quiet) setLoading(true)
    else setRefreshing(true)
    setError(null)
    try {
      const res = await fetch(`/api/calendar?type=series&days=${days}`)
      if (!res.ok) throw new Error('Eroare server')
      const data = await res.json()
      setEpisodes(data.episodes ?? [])
      if (data.errors?.sonarr) setError('Cannot connect to Sonarr. Check your settings.')
    } catch {
      setError('Failed to load.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { load() }, [days])

  const bySeriesGroups = (): SeriesGroup[] => {
    const map = new Map<string, SeriesGroup>()
    for (const ep of episodes) {
      const key = ep.series.title
      if (!map.has(key)) {
        map.set(key, { title: key, poster: ep.poster, episodes: [] })
      }
      map.get(key)!.episodes.push(ep)
    }
    return [...map.values()].sort((a, b) => a.title.localeCompare(b.title))
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#e8e8f4]">Series</h1>
          <p className="text-[#6b6b8a] mt-1">Upcoming episodes — {days} days</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <RangeSelector value={days} onChange={setDays} />
          <div className="flex gap-1 bg-[#11111c] border border-[#1e1e32] rounded-xl p-1">
            <button
              onClick={() => setGroupMode('date')}
              title="Group by date"
              className={`p-1.5 rounded-lg transition-colors ${groupMode === 'date' ? 'bg-[#4f46e5] text-white' : 'text-[#6b6b8a] hover:text-[#e8e8f4]'}`}
            >
              <LayoutGrid size={15} />
            </button>
            <button
              onClick={() => setGroupMode('series')}
              title="Group by series"
              className={`p-1.5 rounded-lg transition-colors ${groupMode === 'series' ? 'bg-[#4f46e5] text-white' : 'text-[#6b6b8a] hover:text-[#e8e8f4]'}`}
            >
              <List size={15} />
            </button>
          </div>
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

      {loading ? (
        <SkeletonGrid count={10} />
      ) : groupMode === 'date' ? (
        <MediaGrid items={episodes} groupByDate />
      ) : (
        <div className="space-y-10">
          {bySeriesGroups().map(group => (
            <section key={group.title}>
              <div className="flex items-center gap-3 mb-4">
                {group.poster && (
                  <img
                    src={group.poster}
                    alt={group.title}
                    className="w-8 h-12 object-cover rounded"
                  />
                )}
                <h2 className="text-base font-semibold text-[#e8e8f4]">{group.title}</h2>
                <span className="text-xs text-[#6b6b8a] bg-[#17172a] px-2 py-0.5 rounded-full">
                  {group.episodes.length} ep
                </span>
                <div className="flex-1 h-px bg-[#1e1e32]" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {group.episodes.map(ep => (
                  <MediaCard key={ep.id} item={ep} />
                ))}
              </div>
            </section>
          ))}
          {bySeriesGroups().length === 0 && (
            <div className="flex flex-col items-center py-20 text-[#6b6b8a]">
              <span className="text-5xl mb-4">📺</span>
              <p>No upcoming episodes.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
