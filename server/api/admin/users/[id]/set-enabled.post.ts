import { ObjectId } from 'mongodb'
import { getDb } from '../../../../utils/db'
import { requireAdmin } from '../../../../utils/admin'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = getRouterParam(event, 'id') || ''
  const body = await readBody<{ enabled?: boolean }>(event)
  if (!ObjectId.isValid(id)) throw createError({ statusCode: 400, statusMessage: 'Invalid user id' })
  const enabled = body?.enabled !== false
  const db = await getDb()
  await db.collection('users').updateOne({ _id: new ObjectId(id) }, { $set: { enabled, updatedAt: new Date() } })
  return { ok: true }
})
