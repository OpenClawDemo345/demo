import { getDb } from '../../utils/db'
import { randomToken } from '../../utils/auth'
import { sendResetEmail } from '../../utils/mail'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ email?: string }>(event)
  const email = String(body?.email || '').trim().toLowerCase()
  if (!email) throw createError({ statusCode: 400, statusMessage: 'Email required' })

  const db = await getDb()
  const user: any = await db.collection('users').findOne({ email })
  if (!user) return { ok: true }

  const token = randomToken()
  await db.collection('password_resets').insertOne({
    userId: user._id,
    email,
    token,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 1000 * 60 * 30)
  })

  const host = getHeader(event, 'host') || 'talks123.ro'
  const proto = (getHeader(event, 'x-forwarded-proto') || 'https').split(',')[0]
  const resetUrl = `${proto}://${host}/reset-password?token=${encodeURIComponent(token)}`

  try {
    await sendResetEmail(email, resetUrl)
  } catch (e: any) {
    console.error('forgot-password email send failed', e?.message || e)
    throw createError({ statusCode: 500, statusMessage: 'Could not send reset email' })
  }

  return { ok: true }
})
