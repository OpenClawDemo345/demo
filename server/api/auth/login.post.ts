import { getDb } from '../../utils/db'
import { issueToken, setAuthCookie, verifyPassword } from '../../utils/auth'
import { logAction } from '../../utils/audit'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ email?: string; password?: string }>(event)
  const email = String(body?.email || '').trim().toLowerCase()
  const password = String(body?.password || '')

  const db = await getDb()
  const user: any = await db.collection('users').findOne({ email })
  if (!user || !user.passwordHash || !verifyPassword(password, user.passwordHash)) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid credentials' })
  }
  if (user.enabled === false) {
    throw createError({ statusCode: 403, statusMessage: 'Account disabled' })
  }

  const token = issueToken({ uid: String(user._id), email: user.email, name: user.name })
  setAuthCookie(event, token)
  await logAction(String(user._id), user.email, 'login')
  return { ok: true, user: { id: String(user._id), email: user.email, name: user.name } }
})
