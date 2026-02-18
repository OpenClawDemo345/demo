import { ObjectId } from 'mongodb'
import { getDb } from '../../utils/db'
import { hashPassword } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ token?: string; password?: string }>(event)
  const token = String(body?.token || '').trim()
  const password = String(body?.password || '')
  if (!token || password.length < 8) throw createError({ statusCode: 400, statusMessage: 'Invalid reset data' })

  const db = await getDb()
  const reset: any = await db.collection('password_resets').findOne({ token })
  if (!reset) throw createError({ statusCode: 400, statusMessage: 'Token invalid or expired' })

  await db.collection('users').updateOne({ _id: new ObjectId(reset.userId) }, { $set: { passwordHash: hashPassword(password), updatedAt: new Date() } })
  await db.collection('password_resets').deleteOne({ _id: reset._id })

  return { ok: true }
})
