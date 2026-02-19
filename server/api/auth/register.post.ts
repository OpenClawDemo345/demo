import { getDb } from '../../utils/db'
import { hashPassword, issueToken, setAuthCookie } from '../../utils/auth'
import { logAction } from '../../utils/audit'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ name?: string; email?: string; password?: string }>(event)
  const name = String(body?.name || '').trim()
  const email = String(body?.email || '').trim().toLowerCase()
  const password = String(body?.password || '')

  if (!email || !password || password.length < 8) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid registration data' })
  }

  const db = await getDb()
  const exists = await db.collection('users').findOne({ email })
  if (exists) throw createError({ statusCode: 409, statusMessage: 'Email already exists' })

  const now = new Date()
  const user = {
    email,
    name: name || email.split('@')[0],
    passwordHash: hashPassword(password),
    providers: [],
    enabled: true,
    createdAt: now,
    updatedAt: now
  }

  const res = await db.collection('users').insertOne(user)
  const token = issueToken({ uid: String(res.insertedId), email, name: user.name })
  setAuthCookie(event, token)
  await logAction(String(res.insertedId), email, 'register')
  return { ok: true, user: { id: String(res.insertedId), email, name: user.name } }
})
