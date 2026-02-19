import { ObjectId } from 'mongodb'
import { getDb } from '../../utils/db'
import { readToken } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const bookId = String(getQuery(event).bookId || '').trim()
  if (!bookId) throw createError({ statusCode: 400, statusMessage: 'Missing bookId' })

  const db = await getDb()
  const items = await db.collection('book_reviews')
    .find({ bookId }, { projection: { _id: 0, userId: 0 } })
    .sort({ updatedAt: -1 })
    .limit(100)
    .toArray()

  let myReview: any = null
  const token: any = readToken(event)
  if (token?.uid && ObjectId.isValid(token.uid)) {
    const mine = await db.collection('book_reviews').findOne(
      { bookId, userId: new ObjectId(token.uid) },
      { projection: { _id: 0, userId: 0 } }
    )
    if (mine) myReview = mine
  }

  return { reviews: items, myReview }
})
