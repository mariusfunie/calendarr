export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return

  // webpackIgnore prevents bundling these Node.js-only modules for edge runtime
  const { default: cron } = await import(/* webpackIgnore: true */ 'node-cron' as string)
  const { existsSync, readFileSync } = await import(/* webpackIgnore: true */ 'node:fs' as string)
  const { join } = await import(/* webpackIgnore: true */ 'node:path' as string)

  cron.schedule('* * * * *', async () => {
    try {
      const settingsPath = join(process.cwd(), 'data', 'settings.json')
      if (!existsSync(settingsPath)) return

      const settings = JSON.parse(readFileSync(settingsPath, 'utf-8'))
      if (!settings?.discord?.dailyDigest || !settings?.discord?.webhookUrl) return

      const now = new Date()
      const hh = String(now.getHours()).padStart(2, '0')
      const mm = String(now.getMinutes()).padStart(2, '0')
      if (`${hh}:${mm}` !== (settings.discord.digestTime ?? '08:00')) return

      const port = process.env.PORT ?? '3000'
      await fetch(`http://127.0.0.1:${port}/api/notify`, { method: 'POST' })
    } catch (err) {
      console.error('[cron] digest error:', err)
    }
  })
}
