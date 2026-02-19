import { ObjectId } from 'mongodb'
import { getDb } from '../../../../utils/db'
import { requireAdmin } from '../../../../utils/admin'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = getRouterParam(event, 'id') || ''
  if (!ObjectId.isValid(id)) throw createError({ statusCode: 400, statusMessage: 'Invalid user id' })
  const db = await getDb()
  await db.collection('users').deleteOne({ _id: new ObjectId(id) })
  await db.collection('book_reviews').deleteMany({ userId: new ObjectId(id) })
  await db.collection('user_logs').deleteMany({ userId: id })
  return { ok: true }
})
