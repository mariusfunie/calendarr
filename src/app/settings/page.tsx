'use client'

import { useEffect, useState } from 'react'
import {
  Save, TestTube2, Send, CheckCircle2, XCircle, Loader2,
  Tv2, Film, Database, MessageSquare,
} from 'lucide-react'
import type { Settings } from '@/lib/settings'

type TestState = 'idle' | 'loading' | 'ok' | 'error'

interface TestResult {
  state: TestState
  message?: string
}

function Input({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  placeholder?: string
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-[#9090a8]">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-[#0d0d18] border border-[#1e1e32] rounded-lg px-3 py-2.5 text-sm text-[#e8e8f4] placeholder:text-[#3d3d55] focus:outline-none focus:border-[#4f46e5]/60 focus:ring-1 focus:ring-[#4f46e5]/30 transition-colors font-mono"
        spellCheck={false}
      />
    </div>
  )
}

function TestBadge({ result }: { result: TestResult }) {
  if (result.state === 'idle') return null
  if (result.state === 'loading')
    return <span className="flex items-center gap-1 text-xs text-[#6b6b8a]"><Loader2 size={12} className="animate-spin" /> Testing...</span>
  if (result.state === 'ok')
    return <span className="flex items-center gap-1 text-xs text-green-400"><CheckCircle2 size={12} /> {result.message ?? 'Connected'}</span>
  return <span className="flex items-center gap-1 text-xs text-red-400"><XCircle size={12} /> {result.message ?? 'Error'}</span>
}

function SectionCard({
  icon,
  title,
  accentColor,
  children,
}: {
  icon: React.ReactNode
  title: string
  accentColor: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-[#11111c] border border-[#1e1e32] rounded-2xl overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-[#1e1e32]" style={{ background: `${accentColor}08` }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${accentColor}20`, color: accentColor }}>
          {icon}
        </div>
        <h2 className="font-semibold text-[#e8e8f4]">{title}</h2>
      </div>
      <div className="p-6 space-y-4">{children}</div>
    </div>
  )
}

const defaultSettings: Settings = {
  sonarr: { url: '', apiKey: '' },
  radarr: { url: '', apiKey: '' },
  tmdb: { apiKey: '' },
  discord: { webhookUrl: '', dailyDigest: false, digestTime: '08:00' },
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(defaultSettings)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [digestSending, setDigestSending] = useState(false)
  const [digestSent, setDigestSent] = useState(false)

  const [sonarrTest, setSonarrTest] = useState<TestResult>({ state: 'idle' })
  const [radarrTest, setRadarrTest] = useState<TestResult>({ state: 'idle' })
  const [tmdbTest, setTmdbTest] = useState<TestResult>({ state: 'idle' })
  const [discordTest, setDiscordTest] = useState<TestResult>({ state: 'idle' })

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(data => setSettings(data))
      .catch(() => {})
  }, [])

  function patch<K extends keyof Settings>(key: K, value: Partial<Settings[K]>) {
    setSettings(prev => ({ ...prev, [key]: { ...(prev[key] as object), ...value } }))
  }

  async function save() {
    setSaving(true)
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  async function testConnection(type: string, extra?: object) {
    const setters: Record<string, (r: TestResult) => void> = {
      sonarr: setSonarrTest, radarr: setRadarrTest, tmdb: setTmdbTest, discord: setDiscordTest,
    }
    const set = setters[type]
    set({ state: 'loading' })
    const res = await fetch('/api/test-connection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, ...extra }),
    })
    const data = await res.json()
    set({ state: data.ok ? 'ok' : 'error', message: data.ok ? (data.version ? `v${data.version}` : 'OK') : data.error })
  }

  async function sendDigest() {
    setDigestSending(true)
    await fetch('/api/notify', { method: 'POST' })
    setDigestSending(false)
    setDigestSent(true)
    setTimeout(() => setDigestSent(false), 3000)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#e8e8f4]">Settings</h1>
        <p className="text-[#6b6b8a] mt-1">Configure your service connections</p>
      </div>

      {/* Sonarr */}
      <SectionCard icon={<Tv2 size={16} />} title="Sonarr" accentColor="#6d28d9">
        <Input
          label="URL"
          value={settings.sonarr.url}
          onChange={v => patch('sonarr', { url: v })}
          placeholder="http://192.168.1.100:8989"
        />
        <Input
          label="API Key"
          value={settings.sonarr.apiKey}
          onChange={v => patch('sonarr', { apiKey: v })}
          type="password"
          placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
        />
        <div className="flex items-center justify-between pt-1">
          <TestBadge result={sonarrTest} />
          <button
            onClick={() => testConnection('sonarr', { url: settings.sonarr.url, apiKey: settings.sonarr.apiKey })}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#6d28d9]/15 text-[#a78bfa] border border-[#6d28d9]/30 hover:bg-[#6d28d9]/25 transition-colors text-xs font-medium"
          >
            <TestTube2 size={12} /> Test connection
          </button>
        </div>
      </SectionCard>

      {/* Radarr */}
      <SectionCard icon={<Film size={16} />} title="Radarr" accentColor="#0e7490">
        <Input
          label="URL"
          value={settings.radarr.url}
          onChange={v => patch('radarr', { url: v })}
          placeholder="http://192.168.1.100:7878"
        />
        <Input
          label="API Key"
          value={settings.radarr.apiKey}
          onChange={v => patch('radarr', { apiKey: v })}
          type="password"
          placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
        />
        <div className="flex items-center justify-between pt-1">
          <TestBadge result={radarrTest} />
          <button
            onClick={() => testConnection('radarr', { url: settings.radarr.url, apiKey: settings.radarr.apiKey })}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0e7490]/15 text-[#22d3ee] border border-[#0e7490]/30 hover:bg-[#0e7490]/25 transition-colors text-xs font-medium"
          >
            <TestTube2 size={12} /> Test connection
          </button>
        </div>
      </SectionCard>

      {/* TMDB */}
      <SectionCard icon={<Database size={16} />} title="TMDB" accentColor="#f59e0b">
        <Input
          label="API Key (v3 auth)"
          value={settings.tmdb.apiKey}
          onChange={v => patch('tmdb', { apiKey: v })}
          type="password"
          placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
        />
        <p className="text-[#6b6b8a] text-xs">
          Get yours for free at{' '}
          <span className="text-[#818cf8]">themoviedb.org/settings/api</span>
        </p>
        <div className="flex items-center justify-between pt-1">
          <TestBadge result={tmdbTest} />
          <button
            onClick={() => testConnection('tmdb', { apiKey: settings.tmdb.apiKey })}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/25 transition-colors text-xs font-medium"
          >
            <TestTube2 size={12} /> Test connection
          </button>
        </div>
      </SectionCard>

      {/* Discord */}
      <SectionCard icon={<MessageSquare size={16} />} title="Discord" accentColor="#5865f2">
        <Input
          label="Webhook URL"
          value={settings.discord.webhookUrl}
          onChange={v => patch('discord', { webhookUrl: v })}
          placeholder="https://discord.com/api/webhooks/..."
        />

        <div className="flex items-center gap-3 bg-[#0d0d18] border border-[#1e1e32] rounded-lg px-3 py-2.5">
          <input
            id="daily-digest"
            type="checkbox"
            checked={settings.discord.dailyDigest}
            onChange={e => patch('discord', { dailyDigest: e.target.checked })}
            className="w-4 h-4 accent-[#4f46e5] cursor-pointer"
          />
          <label htmlFor="daily-digest" className="text-sm text-[#e8e8f4] cursor-pointer flex-1">
            Send daily digest automatically
          </label>
        </div>

        {settings.discord.dailyDigest && (
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#9090a8]">Send time</label>
            <input
              type="time"
              value={settings.discord.digestTime}
              onChange={e => patch('discord', { digestTime: e.target.value })}
              className="bg-[#0d0d18] border border-[#1e1e32] rounded-lg px-3 py-2.5 text-sm text-[#e8e8f4] focus:outline-none focus:border-[#4f46e5]/60 transition-colors font-mono"
            />
          </div>
        )}

        <div className="flex items-center justify-between gap-3 pt-1 flex-wrap">
          <div className="flex items-center gap-3">
            <TestBadge result={discordTest} />
            {digestSent && (
              <span className="flex items-center gap-1 text-xs text-green-400">
                <CheckCircle2 size={12} /> Sent!
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => testConnection('discord', { webhookUrl: settings.discord.webhookUrl })}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#5865f2]/15 text-[#818cf8] border border-[#5865f2]/30 hover:bg-[#5865f2]/25 transition-colors text-xs font-medium"
            >
              <TestTube2 size={12} /> Test
            </button>
            <button
              onClick={sendDigest}
              disabled={digestSending || !settings.discord.webhookUrl}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#5865f2]/15 text-[#818cf8] border border-[#5865f2]/30 hover:bg-[#5865f2]/25 transition-colors text-xs font-medium disabled:opacity-40"
            >
              {digestSending ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
              Send digest now
            </button>
          </div>
        </div>
      </SectionCard>

      {/* Save */}
      <div className="flex items-center justify-between pt-2">
        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-green-400">
            <CheckCircle2 size={15} /> Settings saved
          </span>
        )}
        <button
          onClick={save}
          disabled={saving}
          className="ml-auto flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#4f46e5] hover:bg-[#4338ca] text-white font-semibold text-sm transition-colors disabled:opacity-60"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Save settings
        </button>
      </div>
    </div>
  )
}
