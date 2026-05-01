'use client'

import { useEffect, useState } from 'react'
import { X, Star, CheckCircle2, Clock, EyeOff, Tv2, Film, Calendar, ExternalLink, Play } from 'lucide-react'
import type { EnrichedEpisode, EnrichedMovie } from '@/app/api/calendar/route'

type Item = EnrichedEpisode | EnrichedMovie

interface Props {
  item: Item
  onClose: () => void
}

function daysUntil(dateStr: string): number {
  const d = new Date(dateStr + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((d.getTime() - today.getTime()) / 86_400_000)
}

function countdownLabel(days: number): string {
  if (days < 0) return `${Math.abs(days)} days ago`
  if (days === 0) return 'Today!'
  if (days === 1) return 'Tomorrow'
  return `In ${days} days`
}

export default function MediaModal({ item, onClose }: Props) {
  const isEp = item.kind === 'episode'
  const [arrLink, setArrLink] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(s => {
        const base = isEp ? s.sonarr?.url : s.radarr?.url
        const slug = isEp ? item.series.titleSlug : item.titleSlug
        if (base && slug) {
          setArrLink(`${base.replace(/\/$/, '')}/${isEp ? 'series' : 'movie'}/${slug}`)
        }
      })
      .catch(() => {})
  }, [isEp])

  const title = isEp ? item.series.title : item.title
  const subtitle = isEp
    ? `Season ${item.seasonNumber}, Episode ${item.episodeNumber} — ${item.title}`
    : String(item.year)

  const releaseDate = item.releaseDate ?? ''
  const days = releaseDate ? daysUntil(releaseDate) : null
  const overview = item.tmdb?.overview ?? (isEp ? item.overview : item.overview) ?? ''
  const rating = item.tmdb?.rating ?? 0
  const genres = item.tmdb?.genres ?? []
  const runtime = item.kind === 'movie' ? item.tmdb?.runtime : undefined
  const backdrop = item.tmdb?.backdropPath
  const network = isEp ? item.series.network : undefined

  const releaseLabel = isEp
    ? 'Air date'
    : item.kind === 'movie' && item.digitalRelease
    ? 'Digital release'
    : item.kind === 'movie' && item.physicalRelease
    ? 'Physical release'
    : 'In cinemas'

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop blur overlay */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl border border-[#2a2a44] shadow-2xl shadow-black/60 flex flex-col"
        style={{ background: '#11111c' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Backdrop image header */}
        <div className="relative h-44 overflow-hidden flex-shrink-0 bg-[#0d0d18]">
          {backdrop ? (
            <img
              src={backdrop}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : item.poster ? (
            <img
              src={item.poster}
              alt=""
              className="w-full h-full object-cover scale-110 blur-sm opacity-40"
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-[#11111c] via-[#11111c]/50 to-transparent" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 hover:bg-black/80 flex items-center justify-center text-white transition-colors"
          >
            <X size={16} />
          </button>

          {/* Type badge */}
          <div className="absolute top-3 left-3">
            <span className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full text-white ${isEp ? 'bg-[#6d28d9]/80' : 'bg-[#0e7490]/80'}`}>
              {isEp ? <Tv2 size={11} /> : <Film size={11} />}
              {isEp ? 'Series' : 'Movie'}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex gap-5 p-5 overflow-y-auto flex-1">
          {/* Poster */}
          {item.poster && (
            <div className="flex-shrink-0 w-28">
              <img
                src={item.poster}
                alt={title}
                className="w-full rounded-xl shadow-lg border border-[#2a2a44] -mt-16 relative z-10"
              />
            </div>
          )}

          {/* Details */}
          <div className="flex-1 min-w-0 space-y-3">
            {/* Title */}
            <div>
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-xl font-bold text-[#e8e8f4] leading-snug">{title}</h2>
                {arrLink && (
                  <a
                    href={arrLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex-shrink-0 flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-colors ${
                      isEp
                        ? 'bg-[#6d28d9]/15 text-[#a78bfa] border-[#6d28d9]/30 hover:bg-[#6d28d9]/30'
                        : 'bg-[#0e7490]/15 text-[#22d3ee] border-[#0e7490]/30 hover:bg-[#0e7490]/30'
                    }`}
                  >
                    <ExternalLink size={11} />
                    {isEp ? 'Sonarr' : 'Radarr'}
                  </a>
                )}
              </div>
              <p className="text-sm text-[#6b6b8a] mt-0.5">{subtitle}</p>
              {network && <p className="text-xs text-[#4f46e5] mt-0.5">{network}</p>}
            </div>

            {/* Meta row */}
            <div className="flex flex-wrap gap-3 items-center">
              {rating > 0 && (
                <span className="flex items-center gap-1 text-amber-400 font-semibold text-sm">
                  <Star size={14} fill="currentColor" />
                  {rating.toFixed(1)}
                  <span className="text-[#6b6b8a] font-normal text-xs">/10</span>
                </span>
              )}
              {runtime && (
                <span className="text-xs text-[#6b6b8a]">{runtime} min</span>
              )}
              {item.hasFile ? (
                <span className="flex items-center gap-1 text-green-400 text-xs font-semibold">
                  <CheckCircle2 size={13} /> Downloaded
                </span>
              ) : item.monitored ? (
                <span className="flex items-center gap-1 text-amber-400 text-xs font-semibold">
                  <Clock size={13} /> Monitored
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[#6b6b8a] text-xs">
                  <EyeOff size={13} /> Unmonitored
                </span>
              )}
            </div>

            {/* Release date */}
            {releaseDate && (
              <div className="flex items-center gap-2 bg-[#17172a] rounded-lg px-3 py-2 w-fit">
                <Calendar size={13} className="text-[#4f46e5]" />
                <div>
                  <p className="text-xs text-[#6b6b8a]">{releaseLabel}</p>
                  <p className="text-sm font-semibold text-[#e8e8f4]">
                    {new Date(releaseDate + 'T00:00:00').toLocaleDateString('en-US', {
                      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                    })}
                  </p>
                  {days !== null && (
                    <p className={`text-xs font-medium mt-0.5 ${days === 0 ? 'text-red-400' : days <= 3 ? 'text-orange-400' : 'text-[#4f46e5]'}`}>
                      {countdownLabel(days)}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Genres */}
            {genres.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {genres.map(g => (
                  <span key={g} className="text-xs text-[#9090b8] bg-[#17172a] border border-[#2a2a44] px-2.5 py-0.5 rounded-full">
                    {g}
                  </span>
                ))}
              </div>
            )}

            {/* Trailer button */}
            {item.tmdb?.trailerKey && (
              <a
                href={`https://www.youtube.com/watch?v=${item.tmdb.trailerKey}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600/20 border border-red-600/30 text-red-400 hover:bg-red-600/30 transition-colors text-sm font-semibold w-fit"
              >
                <Play size={13} fill="currentColor" />
                Watch Trailer
              </a>
            )}

            {/* Overview */}
            {overview && (
              <div>
                <p className="text-xs font-semibold text-[#6b6b8a] uppercase tracking-wider mb-1.5">Overview</p>
                <p className="text-sm text-[#b0b0c8] leading-relaxed">{overview}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
