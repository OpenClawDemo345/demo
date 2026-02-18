import assert from 'node:assert/strict'

const base = process.env.BASE_URL || 'http://127.0.0.1:3210'
const email = `test_${Date.now()}@example.com`
const password = 'TestPass123!'

let cookie = ''

async function req(path, opts = {}) {
  const headers = { ...(opts.headers || {}) }
  if (cookie) headers.cookie = cookie
  const res = await fetch(base + path, { ...opts, headers, redirect: 'manual' })
  const setCookie = res.headers.get('set-cookie')
  if (setCookie) cookie = setCookie.split(';')[0]
  return res
}

let r = await req('/api/auth/register', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: 'Smoke', email, password }) })
assert.equal(r.status, 200, 'register failed')

r = await req('/api/auth/me')
const me = await r.json()
assert.ok(me.user?.email === email, 'me after register failed')

await req('/api/auth/logout', { method: 'POST' })
r = await req('/api/auth/me')
const me2 = await r.json()
assert.equal(me2.user, null, 'logout failed')

r = await req('/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password }) })
assert.equal(r.status, 200, 'login failed')

r = await req('/api/auth/me')
const me3 = await r.json()
assert.ok(me3.user?.email === email, 'me after login failed')

console.log('AUTH_SMOKE_OK')
