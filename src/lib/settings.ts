import fs from 'fs'
import path from 'path'

const SETTINGS_PATH = path.join(process.cwd(), 'data', 'settings.json')

export interface Settings {
  sonarr: { url: string; apiKey: string }
  radarr: { url: string; apiKey: string }
  tmdb: { apiKey: string }
  discord: {
    webhookUrl: string
    dailyDigest: boolean
    digestTime: string
  }
}

const defaults: Settings = {
  sonarr: { url: '', apiKey: '' },
  radarr: { url: '', apiKey: '' },
  tmdb: { apiKey: '' },
  discord: { webhookUrl: '', dailyDigest: false, digestTime: '08:00' },
}

export function getSettings(): Settings {
  try {
    if (!fs.existsSync(SETTINGS_PATH)) return structuredClone(defaults)
    const raw = fs.readFileSync(SETTINGS_PATH, 'utf-8')
    const parsed = JSON.parse(raw)
    return {
      sonarr: { ...defaults.sonarr, ...parsed.sonarr },
      radarr: { ...defaults.radarr, ...parsed.radarr },
      tmdb: { ...defaults.tmdb, ...parsed.tmdb },
      discord: { ...defaults.discord, ...parsed.discord },
    }
  } catch {
    return structuredClone(defaults)
  }
}

export function saveSettings(settings: Settings): void {
  const dir = path.dirname(SETTINGS_PATH)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2))
}
