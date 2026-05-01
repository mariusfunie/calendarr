'use client'

import MediaCard from './MediaCard'
import type { EnrichedEpisode, EnrichedMovie } from '@/app/api/calendar/route'

type Item = EnrichedEpisode | EnrichedMovie

function getDate(item: Item): string {
  return item.releaseDate ?? ''
}

function formatDateHeader(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  if (d.getTime() === today.getTime()) return 'Today'
  if (d.getTime() === tomorrow.getTime()) return 'Tomorrow'
  return d.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })
}

export function SkeletonCard() {
  return (
    <div className="bg-[#11111c] rounded-xl border border-[#1e1e32] overflow-hidden">
      <div className="aspect-[2/3] skeleton" />
      <div className="p-3 space-y-2">
        <div className="h-4 skeleton rounded w-3/4" />
        <div className="h-3 skeleton rounded w-1/2" />
        <div className="h-3 skeleton rounded w-1/3" />
      </div>
    </div>
  )
}

export function SkeletonGrid({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}

interface Props {
  items: Item[]
  groupByDate?: boolean
  emptyMessage?: string
}

export default function MediaGrid({ items, groupByDate = true, emptyMessage = 'Nothing to show.' }: Props) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <span className="text-5xl mb-4">🍿</span>
        <p className="text-[#6b6b8a] text-lg">{emptyMessage}</p>
      </div>
    )
  }

  if (!groupByDate) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {items.map(item => (
          <MediaCard key={`${item.kind}-${item.id}`} item={item} />
        ))}
      </div>
    )
  }

  // Group by date
  const groups = new Map<string, Item[]>()
  for (const item of items) {
    const date = getDate(item)
    if (!date) continue
    if (!groups.has(date)) groups.set(date, [])
    groups.get(date)!.push(item)
  }

  const sorted = [...groups.entries()].sort(([a], [b]) => a.localeCompare(b))

  return (
    <div className="space-y-10">
      {sorted.map(([date, group]) => (
        <section key={date}>
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-base font-semibold text-[#e8e8f4] capitalize">
              {formatDateHeader(date)}
            </h2>
            <span className="text-xs text-[#6b6b8a] bg-[#17172a] px-2 py-0.5 rounded-full">
              {group.length}
            </span>
            <div className="flex-1 h-px bg-[#1e1e32]" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {group.map(item => (
              <MediaCard key={`${item.kind}-${item.id}`} item={item} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
