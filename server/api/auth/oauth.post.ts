import { getDb } from '../../utils/db'
import { issueToken, setAuthCookie } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ provider?: string; providerId?: string; email?: string; name?: string }>(event)
  const provider = String(body?.provider || '').trim().toLowerCase()
  const providerId = String(body?.providerId || '').trim()
  const email = String(body?.email || '').trim().toLowerCase()
  const name = String(body?.name || '').trim()

  if (!provider || !providerId || !email) throw createError({ statusCode: 400, statusMessage: 'Missing OAuth fields' })

  const db = await getDb()
  let user: any = await db.collection('users').findOne({ email })

  if (!user) {
    const now = new Date()
    const ins = await db.collection('users').insertOne({
      email,
      name: name || email.split('@')[0],
      providers: [{ provider, providerId }],
      createdAt: now,
      updatedAt: now
    })
    user = await db.collection('users').findOne({ _id: ins.insertedId })
  } else {
    const providers = Array.isArray(user.providers) ? user.providers : []
    if (!providers.find((p: any) => p.provider === provider && p.providerId === providerId)) {
      providers.push({ provider, providerId })
      await db.collection('users').updateOne({ _id: user._id }, { $set: { providers, updatedAt: new Date() } })
      user.providers = providers
    }
  }

  const token = issueToken({ uid: String(user._id), email: user.email, name: user.name })
  setAuthCookie(event, token)
  return { ok: true, user: { id: String(user._id), email: user.email, name: user.name, providers: user.providers || [] } }
})
