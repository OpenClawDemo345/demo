import { adminLogin } from '../../utils/admin'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ username?: string; password?: string }>(event)
  const username = String(body?.username || '').trim()
  const password = String(body?.password || '')
  const admin = await adminLogin(event, username, password)
  return { ok: true, admin }
})
