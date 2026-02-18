import { getDb } from '../../utils/db'
import { randomToken } from '../../utils/auth'

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

  // TODO: send email via SMTP; returned now for quick setup/testing
  return { ok: true, resetToken: token }
})
