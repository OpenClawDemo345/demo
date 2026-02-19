import { getDb } from './db'

export async function logAction(userId: string | null, email: string | null, action: string, meta: Record<string, any> = {}) {
  try {
    const db = await getDb()
    await db.collection('user_logs').insertOne({
      userId: userId || null,
      email: email || null,
      action,
      meta,
      createdAt: new Date()
    })
  } catch {}
}
