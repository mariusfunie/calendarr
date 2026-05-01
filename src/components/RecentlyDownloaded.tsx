'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, Tv2, Film } from 'lucide-react'
import type { HistoryItem } from '@/app/api/history/route'

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

export default function RecentlyDownloaded() {
  const [items, setItems] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/history')
      .then(r => r.json())
      .then(d => setItems(d.items ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (!loading && items.length === 0) return null

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <CheckCircle2 size={16} className="text-green-400" />
        <h2 className="text-base font-semibold text-[#e8e8f4]">Recently Downloaded</h2>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex-shrink-0 w-24 space-y-1.5">
                <div className="w-24 h-36 skeleton rounded-xl" />
                <div className="h-3 skeleton rounded w-4/5" />
                <div className="h-2.5 skeleton rounded w-3/5" />
              </div>
            ))
          : items.map(item => (
              <div key={`${item.kind}-${item.id}`} className="flex-shrink-0 w-24 group">
                <div className="relative w-24 h-36 rounded-xl overflow-hidden border border-[#2a2a44] bg-[#11111c]">
                  {item.poster ? (
                    <img src={item.poster} alt={item.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#6b6b8a]">
                      {item.kind === 'episode' ? <Tv2 size={24} /> : <Film size={24} />}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <span className="absolute bottom-1.5 left-1.5 right-1.5 text-[9px] text-green-400 font-semibold">
                    {timeAgo(item.downloadedAt)}
                  </span>
                  <span className={`absolute top-1.5 left-1.5 text-[9px] font-semibold px-1.5 py-0.5 rounded-full text-white ${item.kind === 'episode' ? 'bg-[#6d28d9]/80' : 'bg-[#0e7490]/80'}`}>
                    {item.kind === 'episode' ? 'EP' : 'MV'}
                  </span>
                </div>
                <p className="text-[11px] text-[#e8e8f4] font-medium mt-1.5 leading-tight line-clamp-2">{item.title}</p>
                {item.subtitle && (
                  <p className="text-[10px] text-[#6b6b8a] leading-tight line-clamp-1 mt-0.5">{item.subtitle}</p>
                )}
              </div>
            ))}
      </div>
    </div>
  )
}
