import { ObjectId } from 'mongodb'
import { getDb } from '../../utils/db'
import { readToken } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const token: any = readToken(event)
  if (!token?.uid) return { user: null }
  const db = await getDb()
  const user: any = await db.collection('users').findOne({ _id: new ObjectId(token.uid) }, { projection: { passwordHash: 0 } })
  if (!user) return { user: null }
  return { user: { id: String(user._id), email: user.email, name: user.name, providers: user.providers || [] } }
})
