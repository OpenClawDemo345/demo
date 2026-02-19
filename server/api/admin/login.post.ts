import { adminLogin } from '../../utils/admin'
import { verifyTurnstile } from '../../utils/turnstile'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ username?: string; password?: string; captchaToken?: string }>(event)
  await verifyTurnstile(event, String(body?.captchaToken || ''), 'admin-login')
  const username = String(body?.username || '').trim()
  const password = String(body?.password || '')
  const admin = await adminLogin(event, username, password)
  return { ok: true, admin }
})
