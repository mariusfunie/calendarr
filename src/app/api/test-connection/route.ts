import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const body = await req.json()
  const { type, url, apiKey, webhookUrl } = body

  try {
    if (type === 'sonarr' || type === 'radarr') {
      const base = (url as string).replace(/\/$/, '')
      const res = await fetch(`${base}/api/v3/system/status`, {
        headers: { 'X-Api-Key': apiKey },
        signal: AbortSignal.timeout(8000),
      })
      if (!res.ok) return NextResponse.json({ ok: false, error: `HTTP ${res.status}` })
      const data = await res.json()
      return NextResponse.json({ ok: true, version: data.version })
    }

    if (type === 'tmdb') {
      const res = await fetch(
        `https://api.themoviedb.org/3/authentication?api_key=${apiKey}`,
        { signal: AbortSignal.timeout(8000) }
      )
      if (!res.ok) return NextResponse.json({ ok: false, error: 'Invalid API key' })
      return NextResponse.json({ ok: true })
    }

    if (type === 'discord') {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: '✅ **Calendarr** — test conexiune reusit!' }),
        signal: AbortSignal.timeout(8000),
      })
      if (!res.ok && res.status !== 204)
        return NextResponse.json({ ok: false, error: `HTTP ${res.status}` })
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ ok: false, error: 'Unknown type' })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ ok: false, error: msg })
  }
}
