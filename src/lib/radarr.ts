import { getSettings } from './settings'

export interface RadarrImage {
  coverType: 'poster' | 'banner' | 'fanart'
  remoteUrl: string
  url: string
}

export interface RadarrMovie {
  id: number
  title: string
  titleSlug: string
  year: number
  tmdbId: number
  imdbId?: string
  overview?: string
  inCinemas?: string
  physicalRelease?: string
  digitalRelease?: string
  hasFile: boolean
  monitored: boolean
  status: string
  images: RadarrImage[]
  genres?: string[]
  runtime?: number
  ratings?: {
    tmdb?: { value: number; votes: number }
    imdb?: { value: number; votes: number }
  }
}

export async function getRadarrCalendar(days = 30): Promise<RadarrMovie[]> {
  const { radarr } = getSettings()
  if (!radarr.url || !radarr.apiKey) return []

  const start = new Date().toISOString().split('T')[0]
  const end = new Date(Date.now() + days * 86_400_000).toISOString().split('T')[0]

  const res = await fetch(
    `${radarr.url.replace(/\/$/, '')}/api/v3/calendar?start=${start}&end=${end}`,
    { headers: { 'X-Api-Key': radarr.apiKey }, next: { revalidate: 300 } }
  )
  if (!res.ok) throw new Error(`Radarr ${res.status}`)
  return res.json()
}

export function radarrPoster(movie: RadarrMovie): string | null {
  return movie.images.find(i => i.coverType === 'poster')?.remoteUrl ?? null
}

export function movieReleaseDate(movie: RadarrMovie): string | null {
  const today = new Date().toISOString().split('T')[0]
  const all = [movie.digitalRelease, movie.physicalRelease, movie.inCinemas]
    .filter(Boolean)
    .map(d => d!.split('T')[0])

  const future = all.filter(d => d >= today).sort()
  if (future.length > 0) return future[0]

  // fallback: most recent past date
  return all.sort().reverse()[0] ?? null
}
