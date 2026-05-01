import { NextResponse } from 'next/server'
import { getSettings } from '@/lib/settings'
import { tmdbImg } from '@/lib/tmdb'

export interface HistoryItem {
  id: number
  kind: 'episode' | 'movie'
  title: string
  subtitle: string
  poster: string | null
  downloadedAt: string
}

async function getSonarrHistory(url: string, apiKey: string): Promise<HistoryItem[]> {
  const res = await fetch(
    `${url.replace(/\/$/, '')}/api/v3/history?pageSize=20&eventType=downloadFolderImported&includeSeries=true`,
    { headers: { 'X-Api-Key': apiKey }, next: { revalidate: 60 } }
  )
  if (!res.ok) return []
  const data = await res.json()
  const records = data.records ?? []
  return records.map((r: {
    id: number
    series?: { title: string; images?: { coverType: string; remoteUrl: string }[] }
    episode?: { seasonNumber: number; episodeNumber: number; title: string }
    date: string
  }) => {
    const poster = r.series?.images?.find((i: { coverType: string; remoteUrl: string }) => i.coverType === 'poster')?.remoteUrl ?? null
    return {
      id: r.id,
      kind: 'episode' as const,
      title: r.series?.title ?? 'Unknown',
      subtitle: r.episode
        ? `S${String(r.episode.seasonNumber).padStart(2, '0')}E${String(r.episode.episodeNumber).padStart(2, '0')} — ${r.episode.title}`
        : '',
      poster,
      downloadedAt: r.date,
    }
  })
}

async function getRadarrHistory(url: string, apiKey: string): Promise<HistoryItem[]> {
  const res = await fetch(
    `${url.replace(/\/$/, '')}/api/v3/history?pageSize=20&eventType=downloadFolderImported&includeMovie=true`,
    { headers: { 'X-Api-Key': apiKey }, next: { revalidate: 60 } }
  )
  if (!res.ok) return []
  const data = await res.json()
  const records = data.records ?? []
  return records.map((r: {
    id: number
    movie?: { title: string; year: number; tmdbId: number; images?: { coverType: string; remoteUrl: string }[] }
    date: string
  }) => {
    const rawPoster = r.movie?.images?.find((i: { coverType: string; remoteUrl: string }) => i.coverType === 'poster')?.remoteUrl ?? null
    return {
      id: r.id,
      kind: 'movie' as const,
      title: r.movie?.title ?? 'Unknown',
      subtitle: String(r.movie?.year ?? ''),
      poster: rawPoster,
      downloadedAt: r.date,
    }
  })
}

export async function GET() {
  const { sonarr, radarr } = getSettings()

  const [epResult, mvResult] = await Promise.allSettled([
    sonarr.url && sonarr.apiKey ? getSonarrHistory(sonarr.url, sonarr.apiKey) : Promise.resolve([]),
    radarr.url && radarr.apiKey ? getRadarrHistory(radarr.url, radarr.apiKey) : Promise.resolve([]),
  ])

  const episodes = epResult.status === 'fulfilled' ? epResult.value : []
  const movies = mvResult.status === 'fulfilled' ? mvResult.value : []

  const combined = [...episodes, ...movies]
    .sort((a, b) => new Date(b.downloadedAt).getTime() - new Date(a.downloadedAt).getTime())
    .slice(0, 30)

  return NextResponse.json({ items: combined })
}
