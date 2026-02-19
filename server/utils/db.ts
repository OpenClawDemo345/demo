import { MongoClient } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://booksadmin:BooksMongo!2026@127.0.0.1:27017/?authSource=admin'
const MONGO_DB = process.env.MONGO_DB || 'booksapp'

let client: MongoClient | null = null

export async function getDb() {
  if (!client) {
    client = new MongoClient(MONGO_URI)
    await client.connect()
  }
  const db = client.db(MONGO_DB)
  await db.collection('users').createIndex({ email: 1 }, { unique: true })
  await db.collection('book_reviews').createIndex({ bookId: 1, createdAt: -1 })
  try { await db.collection('book_reviews').dropIndex('bookId_1_userId_1') } catch {}
  await db.collection('password_resets').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })
  return db
}
