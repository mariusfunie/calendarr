import { NextResponse } from 'next/server'
import { getSonarrCalendar, sonarrPoster, type SonarrEpisode } from '@/lib/sonarr'
import { getRadarrCalendar, radarrPoster, movieReleaseDate, type RadarrMovie } from '@/lib/radarr'
import { enrichMovie, enrichSeries, type TmdbEnrichment } from '@/lib/tmdb'

export interface EnrichedEpisode extends SonarrEpisode {
  kind: 'episode'
  poster: string | null
  tmdb: TmdbEnrichment | null
  releaseDate: string
}

export interface EnrichedMovie extends RadarrMovie {
  kind: 'movie'
  poster: string | null
  tmdb: TmdbEnrichment | null
  releaseDate: string | null
}

export type CalendarItem = EnrichedEpisode | EnrichedMovie

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') ?? 'all'
  const days = Math.min(parseInt(searchParams.get('days') ?? '30'), 90)

  const [episodesResult, moviesResult] = await Promise.allSettled([
    type !== 'movies' ? getSonarrCalendar(days) : Promise.resolve([]),
    type !== 'series' ? getRadarrCalendar(days) : Promise.resolve([]),
  ])

  const rawEpisodes = episodesResult.status === 'fulfilled' ? episodesResult.value : []
  const rawMovies = moviesResult.status === 'fulfilled' ? moviesResult.value : []

  // Deduplicate series for TMDB lookup
  const seriesTvdbIds = [...new Set(rawEpisodes.map(e => e.series.tvdbId))]
  const tmdbSeriesMap = new Map<number, TmdbEnrichment | null>()
  await Promise.all(
    seriesTvdbIds.map(async id => {
      tmdbSeriesMap.set(id, await enrichSeries(id).catch(() => null))
    })
  )

  const episodes: EnrichedEpisode[] = rawEpisodes.map(ep => ({
    ...ep,
    kind: 'episode',
    poster: tmdbSeriesMap.get(ep.series.tvdbId)?.posterPath ?? sonarrPoster(ep),
    tmdb: tmdbSeriesMap.get(ep.series.tvdbId) ?? null,
    releaseDate: ep.airDate,
  }))

  const movies: EnrichedMovie[] = await Promise.all(
    rawMovies.map(async movie => {
      const tmdb = await enrichMovie(movie.tmdbId).catch(() => null)
      return {
        ...movie,
        kind: 'movie' as const,
        poster: tmdb?.posterPath ?? radarrPoster(movie),
        tmdb,
        releaseDate: movieReleaseDate(movie)?.split('T')[0] ?? null,
      }
    })
  )

  const sonarrError = episodesResult.status === 'rejected' ? episodesResult.reason?.message : null
  const radarrError = moviesResult.status === 'rejected' ? moviesResult.reason?.message : null

  return NextResponse.json({ episodes, movies, errors: { sonarr: sonarrError, radarr: radarrError } })
}
