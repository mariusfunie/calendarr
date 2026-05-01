'use client'

import { useState } from 'react'
import { Star, CheckCircle2, Clock, EyeOff } from 'lucide-react'
import clsx from 'clsx'
import type { EnrichedEpisode, EnrichedMovie } from '@/app/api/calendar/route'
import MediaModal from './MediaModal'

type Item = EnrichedEpisode | EnrichedMovie

function daysUntil(dateStr: string): number {
  const d = new Date(dateStr + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((d.getTime() - today.getTime()) / 86_400_000)
}

function countdown(days: number) {
  if (days < 0) return { label: `${Math.abs(days)}d ago`, cls: 'bg-slate-700 text-slate-300' }
  if (days === 0) return { label: 'TODAY', cls: 'bg-red-500 text-white' }
  if (days === 1) return { label: 'TOMORROW', cls: 'bg-orange-500 text-white' }
  if (days <= 7) return { label: `${days}d`, cls: 'bg-amber-500 text-black' }
  return { label: `${days}d`, cls: 'bg-[#1e1e32] text-[#6b6b8a]' }
}

function DownloadBadge({ hasFile, monitored }: { hasFile: boolean; monitored: boolean }) {
  if (hasFile)
    return (
      <span className="flex items-center gap-1 bg-green-500/20 text-green-400 border border-green-500/30 text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
        <CheckCircle2 size={10} /> Downloaded
      </span>
    )
  if (monitored)
    return (
      <span className="flex items-center gap-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
        <Clock size={10} /> Monitored
      </span>
    )
  return (
    <span className="flex items-center gap-1 bg-slate-700/50 text-slate-400 border border-slate-600/30 text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
      <EyeOff size={10} /> Unmonitored
    </span>
  )
}

export default function MediaCard({ item }: { item: Item }) {
  const [imgErr, setImgErr] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const isEp = item.kind === 'episode'

  const title = isEp ? item.series.title : item.title
  const subtitle = isEp
    ? `S${String(item.seasonNumber).padStart(2, '0')}E${String(item.episodeNumber).padStart(2, '0')} — ${item.title}`
    : String(item.year)

  const releaseDate = item.releaseDate ?? ''
  const days = releaseDate ? daysUntil(releaseDate) : null
  const cd = days !== null ? countdown(days) : null

  const rating = item.tmdb?.rating ?? 0
  const genres = item.tmdb?.genres?.slice(0, 2) ?? []
  const overview = item.tmdb?.overview ?? (isEp ? item.overview : item.overview) ?? ''

  const accentColor = isEp ? '#6d28d9' : '#0e7490'
  const accentBg = isEp ? 'bg-[#6d28d9]/80' : 'bg-[#0e7490]/80'

  return (
    <>
    {modalOpen && <MediaModal item={item} onClose={() => setModalOpen(false)} />}
    <div
      onClick={() => setModalOpen(true)}
      className="group relative bg-[#11111c] rounded-xl overflow-hidden border border-[#1e1e32] hover:border-[#4f46e5]/60 transition-all duration-300 hover:shadow-xl hover:shadow-[#4f46e5]/10 hover:-translate-y-0.5 flex flex-col cursor-pointer"
      style={{ '--accent': accentColor } as React.CSSProperties}
    >
      {/* Poster */}
      <div className="relative aspect-[2/3] bg-[#0d0d18] overflow-hidden">
        {item.poster && !imgErr ? (
          <img
            src={item.poster}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setImgErr(true)}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-5xl opacity-20">{isEp ? '📺' : '🎬'}</span>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-[#11111c] via-[#11111c]/20 to-transparent" />

        {/* Top badges */}
        <div className="absolute top-2 left-2 right-2 flex justify-between items-start gap-1">
          {cd && (
            <span className={clsx('text-[10px] font-bold px-2 py-0.5 rounded-md', cd.cls)}>
              {cd.label}
            </span>
          )}
          <span className={clsx('ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full text-white', accentBg)}>
            {isEp ? '📺' : '🎬'}
          </span>
        </div>

        {/* Rating */}
        {rating > 0 && (
          <div className="absolute bottom-2 right-2">
            <span className="flex items-center gap-0.5 bg-amber-400/90 text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              <Star size={9} fill="currentColor" />
              {rating.toFixed(1)}
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col flex-1 p-3 gap-1.5">
        <h3
          className="font-bold text-[#e8e8f4] text-sm leading-snug line-clamp-1"
          title={title}
        >
          {title}
        </h3>
        <p className="text-[#6b6b8a] text-xs line-clamp-1" title={subtitle}>
          {subtitle}
        </p>

        {releaseDate && (
          <p className="text-[#818cf8] text-xs font-medium">
            {new Date(releaseDate + 'T00:00:00').toLocaleDateString('en-US', {
              day: 'numeric', month: 'short', year: 'numeric',
            })}
          </p>
        )}

        {overview && (
          <p className="text-[#6b6b8a] text-[11px] leading-relaxed line-clamp-2 mt-0.5">
            {overview}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 mt-auto pt-2">
          <DownloadBadge hasFile={item.hasFile} monitored={item.monitored} />
          {genres.length > 0 && (
            <div className="flex gap-1">
              {genres.map(g => (
                <span key={g} className="text-[10px] text-[#6b6b8a] bg-[#17172a] px-1.5 py-0.5 rounded">
                  {g}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  )
}
