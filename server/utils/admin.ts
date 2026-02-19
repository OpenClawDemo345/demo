import jwt from 'jsonwebtoken'
import { getCookie, setCookie, deleteCookie, getHeader, createError } from 'h3'
import { getDb } from './db'
import { hashPassword, verifyPassword } from './auth'

const ADMIN_COOKIE = 'books_admin'
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET || 'change-this-admin-secret'

function issueAdminToken(payload: Record<string, any>) {
  return jwt.sign(payload, ADMIN_JWT_SECRET, { expiresIn: '14d' })
}

function readAdminToken(event: any) {
  const token = getCookie(event, ADMIN_COOKIE)
  if (!token) return null
  try { return jwt.verify(token, ADMIN_JWT_SECRET) as any } catch { return null }
}

function setAdminCookie(event: any, token: string) {
  const xfProto = getHeader(event, 'x-forwarded-proto') || ''
  const secure = xfProto.includes('https') || process.env.NODE_ENV === 'production'
  setCookie(event, ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    path: '/',
    maxAge: 60 * 60 * 24 * 14
  })
}

export function clearAdminCookie(event: any) {
  deleteCookie(event, ADMIN_COOKIE, { path: '/' })
}

export async function ensureAdminBootstrap() {
  const db = await getDb()
  const col = db.collection('admin_settings')
  let doc: any = await col.findOne({ key: 'primary' })
  if (!doc) {
    doc = {
      key: 'primary',
      username: 'admin',
      passwordHash: hashPassword('admin'),
      forcePasswordChange: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    await col.insertOne(doc)
  }
  return doc
}

export async function adminLogin(event: any, username: string, password: string) {
  const cfg: any = await ensureAdminBootstrap()
  if (username !== cfg.username || !verifyPassword(password, cfg.passwordHash)) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid admin credentials' })
  }
  const token = issueAdminToken({ role: 'admin', username: cfg.username })
  setAdminCookie(event, token)
  return { username: cfg.username, mustChangePassword: !!cfg.forcePasswordChange }
}

export async function requireAdmin(event: any) {
  const token: any = readAdminToken(event)
  if (!token?.role || token.role !== 'admin') {
    throw createError({ statusCode: 401, statusMessage: 'Admin login required' })
  }
  const cfg: any = await ensureAdminBootstrap()
  return { username: cfg.username, mustChangePassword: !!cfg.forcePasswordChange }
}

export async function changeAdminPassword(newPassword: string) {
  if (!newPassword || newPassword.length < 8) {
    throw createError({ statusCode: 400, statusMessage: 'Password must be at least 8 chars' })
  }
  const db = await getDb()
  await db.collection('admin_settings').updateOne(
    { key: 'primary' },
    { $set: { passwordHash: hashPassword(newPassword), forcePasswordChange: false, updatedAt: new Date() } },
    { upsert: true }
  )
}
