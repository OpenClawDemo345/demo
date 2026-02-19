import { ObjectId } from 'mongodb'
import { getDb } from '../../utils/db'
import { readToken } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const bookId = String(getQuery(event).bookId || '').trim()
  if (!bookId) throw createError({ statusCode: 400, statusMessage: 'Missing bookId' })

  const db = await getDb()
  const comments = await db.collection('book_comments')
    .find({ bookId }, { projection: { _id: 0, userId: 0 } })
    .sort({ createdAt: -1 })
    .limit(100)
    .toArray()

  let myRating = 0
  const token: any = readToken(event)
  if (token?.uid && ObjectId.isValid(token.uid)) {
    const mine: any = await db.collection('book_reviews').findOne(
      { bookId, userId: new ObjectId(token.uid) },
      { projection: { _id: 0, rating: 1 } }
    )
    myRating = Number(mine?.rating || 0)
  }

  return {
    reviews: comments.map((c: any) => ({
      userName: c.userName,
      rating: Number(c.ratingSnapshot || 0),
      comment: c.comment,
      createdAt: c.createdAt
    })),
    myRating
  }
})
