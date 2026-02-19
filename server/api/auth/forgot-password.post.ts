import { getDb } from '../../utils/db'
import { randomToken } from '../../utils/auth'
import { sendResetEmail } from '../../utils/mail'
import { verifyTurnstile } from '../../utils/turnstile'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ email?: string; captchaToken?: string }>(event)
  const email = String(body?.email || '').trim().toLowerCase()
  await verifyTurnstile(event, String(body?.captchaToken || ''), 'forgot-password')

  const db = await getDb()
  const user: any = await db.collection('users').findOne({ email })
  if (!user) return { ok: true }

  const token = randomToken()
  const now = Date.now()
  await db.collection('password_resets').insertOne({
    userId: user._id,
    email,
    token,
    createdAt: new Date(now),
    expiresAt: new Date(now + 1000 * 60 * 60)
  })

  const proto = getHeader(event, 'x-forwarded-proto') || 'https'
  const host = getHeader(event, 'x-forwarded-host') || getHeader(event, 'host') || 'talks123.ro'
  const resetUrl = `${proto}://${host}/reset-password?token=${encodeURIComponent(token)}`

  await sendResetEmail(email, resetUrl)

  return { ok: true }
})
