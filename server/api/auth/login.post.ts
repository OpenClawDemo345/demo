import { getDb } from '../../utils/db'
import { issueToken, setAuthCookie, verifyPassword } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ email?: string; password?: string }>(event)
  const email = String(body?.email || '').trim().toLowerCase()
  const password = String(body?.password || '')

  const db = await getDb()
  const user: any = await db.collection('users').findOne({ email })
  if (!user || !user.passwordHash || !verifyPassword(password, user.passwordHash)) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid credentials' })
  }

  const token = issueToken({ uid: String(user._id), email: user.email, name: user.name })
  setAuthCookie(event, token)
  return { ok: true, user: { id: String(user._id), email: user.email, name: user.name } }
})
