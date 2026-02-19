export async function verifyTurnstile(event: any, token: string, action: string) {
  const cfg = useRuntimeConfig(event)
  const secret = String((cfg as any).turnstileSecretKey || '').trim()
  if (!secret) return

  const t = String(token || '').trim()
  if (!t) throw createError({ statusCode: 400, statusMessage: 'Captcha required' })

  const ipRaw = getHeader(event, 'x-forwarded-for') || ''
  const remoteip = String(ipRaw).split(',')[0].trim()
  const form = new URLSearchParams({ secret, response: t })
  if (remoteip) form.set('remoteip', remoteip)

  const res: any = await $fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: form.toString(),
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  })

  if (!res?.success) {
    throw createError({ statusCode: 400, statusMessage: 'Captcha verification failed' })
  }
  if (res?.action && String(res.action) !== action) {
    throw createError({ statusCode: 400, statusMessage: 'Captcha action mismatch' })
  }
}
