import { ObjectId } from 'mongodb'
import { getDb } from '../../utils/db'
import { readToken } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const token: any = readToken(event)
  if (!token?.uid) throw createError({ statusCode: 401, statusMessage: 'Login required' })

  const body = await readBody<{ bookId?: string; title?: string; author?: string; rating?: number; comment?: string }>(event)
  const bookId = String(body?.bookId || '').trim()
  const title = String(body?.title || '').trim() || 'Unknown title'
  const author = String(body?.author || '').trim() || 'Unknown author'
  const comment = String(body?.comment || '').trim()
  const rating = Math.round(Number(body?.rating || 0))

  if (!bookId || Number.isNaN(rating) || rating < 1 || rating > 5) {
    throw createError({ statusCode: 400, statusMessage: `Invalid review payload (bookId/rating). bookId=${bookId || 'empty'} rating=${String(body?.rating)}` })
  }

  const db = await getDb()
  const user: any = await db.collection('users').findOne({ _id: new ObjectId(token.uid) })
  if (!user) throw createError({ statusCode: 401, statusMessage: 'User not found' })

  await db.collection('book_reviews').insertOne({
    bookId,
    title,
    author,
    rating,
    comment,
    userId: user._id,
    userName: user.name || user.email,
    createdAt: new Date(),
    updatedAt: new Date()
  })

  return { ok: true }
})
