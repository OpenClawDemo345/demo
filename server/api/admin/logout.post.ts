import { clearAdminCookie } from '../../utils/admin'

export default defineEventHandler(async (event) => {
  clearAdminCookie(event)
  return { ok: true }
})
