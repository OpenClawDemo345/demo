export default defineEventHandler(async (event) => {
  const cfg = useRuntimeConfig(event)
  const clientId = cfg.googleClientId as string
  const baseUrl = (cfg.public.baseUrl as string || 'https://talks123.ro').replace(/\/$/, '')
  if (!clientId) throw createError({ statusCode: 500, statusMessage: 'Google auth not configured' })

  const redirectUri = `${baseUrl}/api/auth/google/callback`
  const state = Math.random().toString(36).slice(2)
  setCookie(event, 'oauth_state', state, { httpOnly: true, sameSite: 'lax', secure: true, path: '/', maxAge: 600 })

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    prompt: 'select_account'
  })
  return sendRedirect(event, `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`)
})
