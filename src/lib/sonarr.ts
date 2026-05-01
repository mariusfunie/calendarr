import { getSettings } from './settings'

export interface SonarrImage {
  coverType: 'poster' | 'banner' | 'fanart'
  remoteUrl: string
  url: string
}

export interface SonarrEpisode {
  id: number
  seriesId: number
  episodeFileId: number
  seasonNumber: number
  episodeNumber: number
  title: string
  overview?: string
  airDate: string
  airDateUtc: string
  hasFile: boolean
  monitored: boolean
  series: {
    id: number
    title: string
    titleSlug: string
    tvdbId: number
    imdbId?: string
    network?: string
    overview?: string
    status: string
    images: SonarrImage[]
  }
}

export async function getSonarrCalendar(days = 30): Promise<SonarrEpisode[]> {
  const { sonarr } = getSettings()
  if (!sonarr.url || !sonarr.apiKey) return []

  const start = new Date().toISOString().split('T')[0]
  const end = new Date(Date.now() + days * 86_400_000).toISOString().split('T')[0]

  const res = await fetch(
    `${sonarr.url.replace(/\/$/, '')}/api/v3/calendar?start=${start}&end=${end}&includeSeries=true`,
    { headers: { 'X-Api-Key': sonarr.apiKey }, next: { revalidate: 300 } }
  )
  if (!res.ok) throw new Error(`Sonarr ${res.status}`)
  return res.json()
}

export function sonarrPoster(episode: SonarrEpisode): string | null {
  return episode.series.images.find(i => i.coverType === 'poster')?.remoteUrl ?? null
}
