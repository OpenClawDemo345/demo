import { ObjectId } from 'mongodb'
import { getDb } from '../../../../utils/db'
import { hashPassword } from '../../../../utils/auth'
import { requireAdmin } from '../../../../utils/admin'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = getRouterParam(event, 'id') || ''
  const body = await readBody<{ password?: string }>(event)
  const password = String(body?.password || '')
  if (!ObjectId.isValid(id)) throw createError({ statusCode: 400, statusMessage: 'Invalid user id' })
  if (password.length < 8) throw createError({ statusCode: 400, statusMessage: 'Password must be at least 8 chars' })
  const db = await getDb()
  await db.collection('users').updateOne({ _id: new ObjectId(id) }, { $set: { passwordHash: hashPassword(password), updatedAt: new Date() } })
  return { ok: true }
})
