import { ObjectId } from 'mongodb'
import { getDb } from '../../utils/db'
import { readToken } from '../../utils/auth'
import { logAction } from '../../utils/audit'

export default defineEventHandler(async (event) => {
  const token: any = readToken(event)
  if (!token?.uid) throw createError({ statusCode: 401, statusMessage: 'Login required' })

  const body = await readBody<{ bookId?: string; title?: string; author?: string; rating?: number | null; comment?: string }>(event)
  const bookId = String(body?.bookId || '').trim()
  const title = String(body?.title || '').trim() || 'Unknown title'
  const author = String(body?.author || '').trim() || 'Unknown author'
  const comment = String(body?.comment || '').trim()
  const rawRating = body?.rating
  const rating = rawRating === null || rawRating === undefined || rawRating === '' ? 0 : Math.round(Number(rawRating))

  if (!bookId) throw createError({ statusCode: 400, statusMessage: 'Missing bookId' })
  if (!Number.isFinite(rating) || rating < 0 || rating > 5) throw createError({ statusCode: 400, statusMessage: 'Invalid rating' })
  if (!comment && rating < 1) throw createError({ statusCode: 400, statusMessage: 'Provide rating or comment' })

  const db = await getDb()
  const user: any = await db.collection('users').findOne({ _id: new ObjectId(token.uid) })
  if (!user) throw createError({ statusCode: 401, statusMessage: 'User not found' })
  if (user.enabled === false) throw createError({ statusCode: 403, statusMessage: 'Account disabled' })

  let effectiveRating = 0

  if (rating > 0) {
    effectiveRating = rating
    await db.collection('book_reviews').updateOne(
      { bookId, userId: user._id },
      {
        $set: {
          title,
          author,
          rating,
          userName: user.name || user.email,
          updatedAt: new Date()
        },
        $setOnInsert: { createdAt: new Date() }
      },
      { upsert: true }
    )
  } else {
    const existing: any = await db.collection('book_reviews').findOne({ bookId, userId: user._id })
    effectiveRating = Number(existing?.rating || 0)
  }

  if (comment) {
    await db.collection('book_comments').insertOne({
      bookId,
      title,
      author,
      comment,
      userId: user._id,
      userName: user.name || user.email,
      ratingSnapshot: effectiveRating,
      createdAt: new Date()
    })
  }

  await logAction(String(user._id), user.email, 'review', { bookId, title, rating: effectiveRating, hasComment: !!comment })
  return { ok: true }
})
