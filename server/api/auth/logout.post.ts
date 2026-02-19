import { clearAuthCookie, readToken } from '../../utils/auth'
import { logAction } from '../../utils/audit'

export default defineEventHandler(async (event) => {
  const token: any = readToken(event)
  if (token?.uid) await logAction(String(token.uid), token.email || null, 'logout')
  clearAuthCookie(event)
  return { ok: true }
})
