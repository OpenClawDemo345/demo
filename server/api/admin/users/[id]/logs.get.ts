import { ObjectId } from 'mongodb'
import { getDb } from '../../../../utils/db'
import { requireAdmin } from '../../../../utils/admin'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = getRouterParam(event, 'id') || ''
  if (!ObjectId.isValid(id)) throw createError({ statusCode: 400, statusMessage: 'Invalid user id' })
  const db = await getDb()
  const logs = await db.collection('user_logs').find({ userId: id }).sort({ createdAt: -1 }).limit(200).toArray()
  return { logs }
})
