import { getDb } from '../../../utils/db'
import { issueToken, setAuthCookie } from '../../../utils/auth'
import { logAction } from '../../../utils/audit'

export default defineEventHandler(async (event) => {
  const cfg = useRuntimeConfig(event)
  const clientId = cfg.googleClientId as string
  const clientSecret = cfg.googleClientSecret as string
  const baseUrl = (cfg.public.baseUrl as string || 'https://talks123.ro').replace(/\/$/, '')
  const redirectUri = `${baseUrl}/api/auth/google/callback`

  const q = getQuery(event)
  const code = String(q.code || '')
  const state = String(q.state || '')
  const cookieState = getCookie(event, 'oauth_state') || ''
  deleteCookie(event, 'oauth_state', { path: '/' })

  if (!clientId || !clientSecret) throw createError({ statusCode: 500, statusMessage: 'Google auth not configured' })
  if (!code || !state || state !== cookieState) throw createError({ statusCode: 400, statusMessage: 'Invalid oauth state' })

  const tokenResp: any = await $fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, grant_type: 'authorization_code' }).toString(),
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  })

  const profile: any = await $fetch('https://openidconnect.googleapis.com/v1/userinfo', {
    headers: { Authorization: `Bearer ${tokenResp.access_token}` }
  })

  const email = String(profile.email || '').toLowerCase()
  if (!email) throw createError({ statusCode: 400, statusMessage: 'Google profile missing email' })

  const db = await getDb()
  let user: any = await db.collection('users').findOne({ email })
  const provider = { provider: 'google', providerId: String(profile.sub || email) }

  if (!user) {
    const ins = await db.collection('users').insertOne({
      email,
      name: String(profile.name || email.split('@')[0]),
      providers: [provider],
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date()
    })
    user = await db.collection('users').findOne({ _id: ins.insertedId })
    await logAction(String(ins.insertedId), email, 'register', { provider: 'google' })
  } else {
    const providers = Array.isArray(user.providers) ? user.providers : []
    if (!providers.find((p: any) => p.provider === 'google' && p.providerId === provider.providerId)) {
      providers.push(provider)
      await db.collection('users').updateOne({ _id: user._id }, { $set: { providers, updatedAt: new Date() } })
      user.providers = providers
    }
  }

  if (user.enabled === false) {
    throw createError({ statusCode: 403, statusMessage: 'Account disabled' })
  }

  const token = issueToken({ uid: String(user._id), email: user.email, name: user.name })
  setAuthCookie(event, token)
  await logAction(String(user._id), user.email, 'login', { provider: 'google' })
  return sendRedirect(event, `${baseUrl}/`)
})
