import { NextResponse } from 'next/server'
import { getSonarrCalendar } from '@/lib/sonarr'
import { getRadarrCalendar } from '@/lib/radarr'
import { sendDailyDigest } from '@/lib/discord'

export async function POST() {
  const [episodes, movies] = await Promise.allSettled([
    getSonarrCalendar(7),
    getRadarrCalendar(30),
  ])
  const ok = await sendDailyDigest(
    episodes.status === 'fulfilled' ? episodes.value : [],
    movies.status === 'fulfilled' ? movies.value : []
  )
  return NextResponse.json({ ok })
}
