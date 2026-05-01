import { getSettings } from './settings'
import type { SonarrEpisode } from './sonarr'
import type { RadarrMovie } from './radarr'
import { movieReleaseDate } from './radarr'

interface Embed {
  title?: string
  description?: string
  color?: number
  thumbnail?: { url: string }
  fields?: { name: string; value: string; inline?: boolean }[]
  footer?: { text: string }
  timestamp?: string
}

async function postWebhook(webhookUrl: string, payload: object): Promise<boolean> {
  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return res.ok || res.status === 204
}

export async function sendTestNotification(): Promise<boolean> {
  const { discord } = getSettings()
  if (!discord.webhookUrl) return false
  return postWebhook(discord.webhookUrl, {
    content: '✅ **Calendarr** — Discord connection is working!',
  })
}

export async function sendDailyDigest(
  episodes: SonarrEpisode[],
  movies: RadarrMovie[]
): Promise<boolean> {
  const { discord } = getSettings()
  if (!discord.webhookUrl) return false

  const dateLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  function relativeDay(dateStr: string): string {
    const target = new Date(dateStr.split('T')[0] + 'T00:00:00')
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const days = Math.round((target.getTime() - today.getTime()) / 86_400_000)
    const weekday = target.toLocaleDateString('en-US', { weekday: 'long' })
    if (days === 0) return 'Today'
    if (days === 1) return `Tomorrow (${weekday})`
    if (days < 0) return `${Math.abs(days)}d ago`
    return `${weekday}, in ${days}d`
  }

  const embeds: Embed[] = []

  if (episodes.length > 0) {
    const lines = episodes.slice(0, 12).map(ep => {
      const s = String(ep.seasonNumber).padStart(2, '0')
      const e = String(ep.episodeNumber).padStart(2, '0')
      const status = ep.hasFile ? '✅' : '⏳'
      return `${status} **${ep.series.title}** S${s}E${e} — ${ep.title} \`${relativeDay(ep.airDate)}\``
    })
    embeds.push({
      title: '📺 Upcoming Episodes (7 days)',
      description: lines.join('\n'),
      color: 0x6d28d9,
      footer: { text: `${episodes.length} episodes total` },
    })
  }

  if (movies.length > 0) {
    const lines = movies.slice(0, 12).map(movie => {
      const date = movieReleaseDate(movie)
      const status = movie.hasFile ? '✅' : '⏳'
      return `${status} **${movie.title}** (${movie.year}) \`${date ? relativeDay(date) : '—'}\``
    })
    embeds.push({
      title: '🎬 Upcoming Movies (30 days)',
      description: lines.join('\n'),
      color: 0x0e7490,
      footer: { text: `${movies.length} movies total` },
    })
  }

  if (embeds.length === 0) {
    embeds.push({
      title: '📅 Nothing upcoming',
      description: 'No episodes or movies scheduled in the selected period.',
      color: 0x374151,
    })
  }

  return postWebhook(discord.webhookUrl, {
    content: `📅 **Calendarr Digest** — ${dateLabel}`,
    embeds,
  })
}
