import { changeAdminPassword, requireAdmin } from '../../utils/admin'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const body = await readBody<{ password?: string }>(event)
  await changeAdminPassword(String(body?.password || ''))
  return { ok: true }
})
