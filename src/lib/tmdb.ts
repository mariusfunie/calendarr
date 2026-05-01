import { getSettings } from './settings'

const BASE = 'https://api.themoviedb.org/3'
const IMG = 'https://image.tmdb.org/t/p'

export function tmdbImg(p: string | null, size = 'w342'): string | null {
  if (!p) return null
  return `${IMG}/${size}${p}`
}

export interface TmdbEnrichment {
  posterPath: string | null
  backdropPath: string | null
  rating: number
  overview: string
  genres: string[]
  runtime?: number
  trailerKey: string | null
}

function extractTrailerKey(videos: { results?: { site: string; type: string; key: string }[] }): string | null {
  const results = videos?.results ?? []
  const trailer = results.find(v => v.site === 'YouTube' && v.type === 'Trailer')
    ?? results.find(v => v.site === 'YouTube')
  return trailer?.key ?? null
}

export async function enrichMovie(tmdbId: number): Promise<TmdbEnrichment | null> {
  const { tmdb } = getSettings()
  if (!tmdb.apiKey || !tmdbId) return null

  const res = await fetch(
    `${BASE}/movie/${tmdbId}?api_key=${tmdb.apiKey}&append_to_response=videos`,
    { next: { revalidate: 3600 } }
  )
  if (!res.ok) return null
  const d = await res.json()
  return {
    posterPath: tmdbImg(d.poster_path),
    backdropPath: tmdbImg(d.backdrop_path, 'w780'),
    rating: d.vote_average ?? 0,
    overview: d.overview ?? '',
    genres: d.genres?.map((g: { name: string }) => g.name) ?? [],
    runtime: d.runtime,
    trailerKey: extractTrailerKey(d.videos),
  }
}

export async function enrichSeries(tvdbId: number): Promise<TmdbEnrichment | null> {
  const { tmdb } = getSettings()
  if (!tmdb.apiKey || !tvdbId) return null

  const findRes = await fetch(
    `${BASE}/find/${tvdbId}?api_key=${tmdb.apiKey}&external_source=tvdb_id`,
    { next: { revalidate: 3600 } }
  )
  if (!findRes.ok) return null
  const found = await findRes.json()
  const show = found.tv_results?.[0]
  if (!show) return null

  const detailRes = await fetch(
    `${BASE}/tv/${show.id}?api_key=${tmdb.apiKey}&append_to_response=videos`,
    { next: { revalidate: 3600 } }
  )
  const d = detailRes.ok ? await detailRes.json() : show
  return {
    posterPath: tmdbImg(d.poster_path),
    backdropPath: tmdbImg(d.backdrop_path, 'w780'),
    rating: d.vote_average ?? 0,
    overview: d.overview ?? '',
    genres: d.genres?.map((g: { name: string }) => g.name) ?? [],
    trailerKey: extractTrailerKey(d.videos ?? {}),
  }
}
