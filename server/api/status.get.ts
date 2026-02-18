import { getDb } from '../utils/db'

export default defineEventHandler(async () => {
  const out: any = { ok: true, app: 'up', db: 'down', auth: 'ok', googleAuth: 'not_configured' }
  try {
    const db = await getDb()
    await db.command({ ping: 1 })
    out.db = 'up'
  } catch {
    out.ok = false
  }
  const cfg = useRuntimeConfig()
  if (cfg.googleClientId && cfg.googleClientSecret) out.googleAuth = 'configured'
  return out
})
