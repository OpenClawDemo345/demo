import { getDb } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const bookId = String(getQuery(event).bookId || '').trim()
  if (!bookId) throw createError({ statusCode: 400, statusMessage: 'Missing bookId' })

  const db = await getDb()
  const items = await db.collection('book_reviews')
    .find({ bookId }, { projection: { _id: 0, userId: 0 } })
    .sort({ createdAt: -1 })
    .limit(100)
    .toArray()

  return { reviews: items }
})
