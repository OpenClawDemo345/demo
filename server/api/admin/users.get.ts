import { getDb } from '../../utils/db'
import { requireAdmin } from '../../utils/admin'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const db = await getDb()
  const users = await db.collection('users').find({}, { projection: { passwordHash: 0 } }).sort({ createdAt: -1 }).toArray()
  return {
    users: users.map((u: any) => ({
      id: String(u._id),
      email: u.email,
      name: u.name,
      enabled: u.enabled !== false,
      createdAt: u.createdAt,
      providers: u.providers || []
    }))
  }
})
