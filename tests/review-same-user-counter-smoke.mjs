import assert from 'node:assert/strict'

const base = process.env.BASE_URL || 'http://127.0.0.1:3210'

function deriveBookId(book) {
  if (book?.bookId) return String(book.bookId)
  const link = String(book?.link || '')
  const m = link.match(/\/works\/[^/?#]+/)
  return m ? m[0] : ''
}

let cookie = ''
async function req(path, opts = {}) {
  const headers = { ...(opts.headers || {}) }
  if (cookie) headers.cookie = cookie
  const res = await fetch(base + path, { ...opts, headers, redirect: 'manual' })
  const setCookie = res.headers.get('set-cookie')
  if (setCookie) cookie = setCookie.split(';')[0]
  return res
}

const email = `sameuser_${Date.now()}@example.com`
const password = 'TestPass123!'
let r = await req('/api/auth/register', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: 'Same User', email, password }) })
assert.equal(r.status, 200)

r = await fetch(base + '/api/trending')
const books = await r.json()
const book = books[0]
const bookId = deriveBookId(book)

async function stats() {
  const rr = await fetch(base + '/api/trending')
  const list = await rr.json()
  const f = list.find((b) => deriveBookId(b) === bookId)
  return { avg: Number(f?.avgRating || 0), count: Number(f?.ratingsCount || 0) }
}

const before = await stats()
await req('/api/books/reviews', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ bookId, title: book.title, author: book.author, rating: 5, comment: 'first' }) })
await req('/api/books/reviews', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ bookId, title: book.title, author: book.author, rating: 1, comment: 'second' }) })

const started = Date.now()
let after = before
while (Date.now() - started < 10000) {
  after = await stats()
  if (after.count >= before.count + 2) break
  await new Promise(r => setTimeout(r, 500))
}

assert.ok(after.count >= before.count + 2, `count not incremented: before=${before.count} after=${after.count}`)
assert.ok(after.avg >= 1 && after.avg <= 5, `avg invalid: ${after.avg}`)
console.log('REVIEW_SAME_USER_COUNTER_OK', { before, after })
