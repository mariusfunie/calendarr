'use client'

import { useEffect, useState } from 'react'
import { Tv2, Film, Clock } from 'lucide-react'
import type { EnrichedEpisode, EnrichedMovie } from '@/app/api/calendar/route'

type Item = EnrichedEpisode | EnrichedMovie

function useCountdown(targetDate: string | null) {
  const [label, setLabel] = useState('')

  useEffect(() => {
    if (!targetDate) return
    function tick() {
      const target = new Date(targetDate + 'T00:00:00').getTime()
      const now = Date.now()
      const diff = target - now
      if (diff <= 0) { setLabel('Today!'); return }
      const days = Math.floor(diff / 86_400_000)
      const hrs = Math.floor((diff % 86_400_000) / 3_600_000)
      const mins = Math.floor((diff % 3_600_000) / 60_000)
      if (days > 0) setLabel(`${days}d ${hrs}h ${mins}m`)
      else setLabel(`${hrs}h ${mins}m`)
    }
    tick()
    const id = setInterval(tick, 30_000)
    return () => clearInterval(id)
  }, [targetDate])

  return label
}

interface Props {
  items: Item[]
  onSelect: (item: Item) => void
}

export default function NextUpWidget({ items, onSelect }: Props) {
  const next = items.find(i => {
    const d = i.releaseDate
    if (!d) return false
    return new Date(d + 'T00:00:00') >= new Date(new Date().toDateString())
  })

  const countdown = useCountdown(next?.releaseDate ?? null)

  if (!next) return null

  const isEp = next.kind === 'episode'
  const title = isEp ? (next as EnrichedEpisode).series.title : (next as EnrichedMovie).title
  const subtitle = isEp
    ? `S${String((next as EnrichedEpisode).seasonNumber).padStart(2, '0')}E${String((next as EnrichedEpisode).episodeNumber).padStart(2, '0')} — ${next.title}`
    : `${(next as EnrichedMovie).year}`
  const backdrop = next.tmdb?.backdropPath
  const poster = next.poster

  return (
    <div
      className="relative rounded-2xl overflow-hidden border border-[#2a2a44] cursor-pointer group"
      style={{ minHeight: 160 }}
      onClick={() => onSelect(next)}
    >
      {/* Background */}
      {backdrop ? (
        <img src={backdrop} alt="" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
      ) : poster ? (
        <img src={poster} alt="" className="absolute inset-0 w-full h-full object-cover scale-110 blur-sm opacity-30" />
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-transparent" />

      {/* Content */}
      <div className="relative z-10 flex items-center gap-5 p-5">
        {poster && (
          <img
            src={poster}
            alt={title}
            className="w-16 h-24 object-cover rounded-xl shadow-xl border border-[#2a2a44] flex-shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full text-white ${isEp ? 'bg-[#6d28d9]/80' : 'bg-[#0e7490]/80'}`}>
              {isEp ? <Tv2 size={9} /> : <Film size={9} />}
              {isEp ? 'Next Episode' : 'Next Movie'}
            </span>
          </div>
          <h3 className="text-xl font-bold text-white leading-tight truncate">{title}</h3>
          <p className="text-sm text-white/60 mt-0.5 truncate">{subtitle}</p>

          <div className="flex items-center gap-1.5 mt-3">
            <Clock size={13} className="text-[#818cf8]" />
            <span className="text-sm font-semibold text-[#818cf8]">{countdown || 'Soon'}</span>
            <span className="text-xs text-white/40 ml-1">
              {next.releaseDate && new Date(next.releaseDate + 'T00:00:00').toLocaleDateString('en-US', {
                weekday: 'short', month: 'short', day: 'numeric',
              })}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
