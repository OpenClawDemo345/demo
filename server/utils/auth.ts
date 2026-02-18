import crypto from 'node:crypto'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-jwt-secret'
const COOKIE_NAME = 'books_auth'

export function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(':')
  if (!salt || !hash) return false
  const check = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex')
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(check))
}

export function issueToken(payload: Record<string, any>) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '14d' })
}

export function readToken(event: any) {
  const token = getCookie(event, COOKIE_NAME)
  if (!token) return null
  try { return jwt.verify(token, JWT_SECRET) as any } catch { return null }
}

export function setAuthCookie(event: any, token: string) {
  const xfProto = getHeader(event, 'x-forwarded-proto') || ''
  const secure = xfProto.includes('https') || process.env.NODE_ENV === 'production'
  setCookie(event, COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    path: '/',
    maxAge: 60 * 60 * 24 * 14
  })
}

export function clearAuthCookie(event: any) {
  deleteCookie(event, COOKIE_NAME, { path: '/' })
}

export function randomToken() {
  return crypto.randomBytes(24).toString('hex')
}
