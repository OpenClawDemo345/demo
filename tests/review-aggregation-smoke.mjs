import assert from 'node:assert/strict'

const base = process.env.BASE_URL || 'http://127.0.0.1:3210'

function deriveBookId(book) {
  if (book?.bookId) return String(book.bookId)
  const link = String(book?.link || '')
  const m = link.match(/\/works\/[^/?#]+/)
  return m ? m[0] : ''
}

function mkClient() {
  let cookie = ''
  return {
    async req(path, opts = {}) {
      const headers = { ...(opts.headers || {}) }
      if (cookie) headers.cookie = cookie
      const res = await fetch(base + path, { ...opts, headers, redirect: 'manual' })
      const setCookie = res.headers.get('set-cookie')
      if (setCookie) cookie = setCookie.split(';')[0]
      return res
    }
  }
}

async function registerClient(tag) {
  const client = mkClient()
  const email = `review_${tag}_${Date.now()}@example.com`
  const password = 'TestPass123!'
  const r = await client.req('/api/auth/register', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name: `User ${tag}`, email, password })
  })
  assert.equal(r.status, 200, `register failed for ${tag}`)
  return client
}

async function getFirstBook() {
  const r = await fetch(base + '/api/trending')
  assert.equal(r.status, 200, 'trending failed')
  const books = await r.json()
  assert.ok(Array.isArray(books) && books.length > 0, 'no books in trending')
  const b = books[0]
  b.bookId = deriveBookId(b)
  assert.ok(b.bookId, 'bookId derivation failed')
  return b
}

async function postReview(client, book, rating, comment) {
  const r = await client.req('/api/books/reviews', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      bookId: book.bookId,
      title: book.title,
      author: book.author,
      rating,
      comment
    })
  })
  assert.equal(r.status, 200, `review post failed (${rating})`)
}

async function getStatsFromTrending(bookId) {
  const r = await fetch(base + '/api/trending')
  assert.equal(r.status, 200, 'trending reload failed')
  const books = await r.json()
  const found = books.find((b) => deriveBookId(b) === bookId)
  if (!found) throw new Error('book not found in trending after save')
  return {
    ratingsCount: Number(found.ratingsCount || 0),
    avgRating: Number(found.avgRating || 0)
  }
}

async function waitForDelta(bookId, beforeCount, expectedDelta, timeoutMs = 10000) {
  const started = Date.now()
  while (Date.now() - started < timeoutMs) {
    const now = await getStatsFromTrending(bookId)
    if (now.ratingsCount >= beforeCount + expectedDelta) return now
    await new Promise((r) => setTimeout(r, 500))
  }
  throw new Error(`ratingsCount did not increase for ${bookId}`)
}

const book = await getFirstBook()
const before = await getStatsFromTrending(book.bookId)

const c1 = await registerClient('a')
const c2 = await registerClient('b')
await postReview(c1, book, 5, 'Great book')
await postReview(c2, book, 3, 'Decent read')

const after = await waitForDelta(book.bookId, before.ratingsCount, 2)
assert.ok(after.ratingsCount >= before.ratingsCount + 2, 'ratingsCount not incremented by at least 2')
assert.ok(after.avgRating >= 1 && after.avgRating <= 5, 'avgRating out of bounds')

console.log('REVIEW_AGGREGATION_SMOKE_OK', { bookId: book.bookId, before, after })
