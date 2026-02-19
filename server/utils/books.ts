import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { getDb } from './db'

type Book = {
  rank: number
  title: string
  author: string
  type: string
  link: string
  coverUrl: string
  resume: string[]
  bookId: string
  avgRating: number
  ratingsCount: number
  commentsCount: number
}

type CacheEntry<T> = { expiresAt: number; value: T }
type DiskCache = {
  updatedAt: number
  trending?: { updatedAt: number; data: Book[] }
  searches?: Record<string, { updatedAt: number; data: Book[] }>
  resumes?: Record<string, { updatedAt: number; data: string[] }>
}

const memCache = new Map<string, CacheEntry<any>>()
const CACHE_FILE = resolve(process.cwd(), '.cache/books-cache.json')

const TTL = { trending: 60 * 60 * 1000, search: 60 * 60 * 1000, resume: 24 * 60 * 60 * 1000 }

function cacheGet<T>(key: string): T | null {
  const hit = memCache.get(key)
  if (!hit) return null
  if (Date.now() > hit.expiresAt) { memCache.delete(key); return null }
  return hit.value as T
}
function cacheSet<T>(key: string, value: T, ttlMs: number) { memCache.set(key, { value, expiresAt: Date.now() + ttlMs }) }

function readDiskCache(): DiskCache {
  try {
    if (!existsSync(CACHE_FILE)) return { updatedAt: Date.now(), searches: {}, resumes: {} }
    const raw = readFileSync(CACHE_FILE, 'utf8')
    const parsed = JSON.parse(raw)
    return { updatedAt: parsed.updatedAt || Date.now(), trending: parsed.trending, searches: parsed.searches || {}, resumes: parsed.resumes || {} }
  } catch { return { updatedAt: Date.now(), searches: {}, resumes: {} } }
}
function writeDiskCache(next: DiskCache) {
  try {
    const dir = dirname(CACHE_FILE)
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
    writeFileSync(CACHE_FILE, JSON.stringify(next, null, 2), 'utf8')
  } catch {}
}

function classifyType(text = '') {
  const t = text.toLowerCase()
  const has = (...w: string[]) => w.some((x) => t.includes(x))
  if (has('programming', 'software', 'code', 'algorithm', 'machine learning', ' ai ', 'data', 'java', 'python', 'devops', 'cloud')) return 'Technical'
  if (has('history', 'biography', 'memoir', 'economics', 'finance', 'business', 'politics', 'psychology', 'self-help', 'philosophy', 'science')) return 'Non-fiction'
  if (has('novel', 'fiction', 'romance', 'fantasy', 'thriller', 'mystery', 'poetry', 'literature', 'classic')) return 'Literature'
  return 'General'
}

function splitSentences(s = '') { return s.split(/(?<=[.!?])\s+/).map((x) => x.trim()).filter(Boolean) }
function defaultResume(title: string, type: string) {
  return [
    `After reading "${title}", I learned to focus on one core principle and apply it consistently.`,
    'I learned that progress comes from small repeatable actions, not one-time motivation.',
    type === 'Technical' ? 'I learned to translate ideas into a simple system I can test, measure, and improve.' : 'I learned to reflect on the story/ideas and turn them into concrete decisions in daily life.'
  ]
}

async function buildResume(workKey: string, title: string, type: string) {
  const resumeKey = `resume:${workKey}`
  const cached = cacheGet<string[]>(resumeKey)
  if (cached) return cached

  const disk = readDiskCache()
  const diskResume = disk.resumes?.[workKey]
  if (diskResume && Date.now() - diskResume.updatedAt < TTL.resume) { cacheSet(resumeKey, diskResume.data, TTL.resume); return diskResume.data }

  try {
    const j: any = await $fetch(`https://openlibrary.org${workKey}.json`, { timeout: 4000 })
    const desc = typeof j.description === 'string' ? j.description : j.description?.value
    const points: string[] = []
    if (desc) {
      for (const s of splitSentences(String(desc))) {
        if (s.length > 35) { points.push(`After reading it, I learned: ${s.slice(0, 220)}`); if (points.length >= 2) break }
      }
    }
    if (Array.isArray(j.subjects) && j.subjects.length) points.push(`My key themes from the book are: ${j.subjects.slice(0, 4).join(', ')}.`)

    const fb = defaultResume(title, type)
    while (points.length < 3) points.push(fb[points.length])
    const result = points.slice(0, 3)
    cacheSet(resumeKey, result, TTL.resume)
    disk.resumes = disk.resumes || {}
    disk.resumes[workKey] = { updatedAt: Date.now(), data: result }
    disk.updatedAt = Date.now()
    writeDiskCache(disk)
    return result
  } catch {
    const fallback = defaultResume(title, type)
    cacheSet(resumeKey, fallback, 60 * 60 * 1000)
    return fallback
  }
}


function deriveBookIdFromAny(book: any) {
  if (book?.bookId) return String(book.bookId)
  const link = String(book?.link || '')
  const m = link.match(/\/works\/[^/?#]+/)
  return m ? m[0] : ''
}

async function enrichWithRatings(books: Book[]) {
  if (!books.length) return books
  const ids = books.map((b: any) => deriveBookIdFromAny(b)).filter(Boolean)
  const db = await getDb()
  const ratingStats = await db.collection('book_reviews').aggregate([
    { $match: { bookId: { $in: ids } } },
    { $group: { _id: '$bookId', avgRating: { $avg: '$rating' }, ratingsCount: { $sum: { $cond: [{ $gt: ['$rating', 0] }, 1, 0] } } } }
  ]).toArray()
  const commentStats = await db.collection('book_comments').aggregate([
    { $match: { bookId: { $in: ids } } },
    { $group: { _id: '$bookId', commentsCount: { $sum: 1 } } }
  ]).toArray()
  const byId = new Map(ratingStats.map((s: any) => [String(s._id), s]))
  const commentsById = new Map(commentStats.map((s: any) => [String(s._id), Number(s.commentsCount || 0)]))
  return books.map((b) => {
    const bookId = deriveBookIdFromAny(b)
    const s: any = byId.get(bookId)
    return {
      ...b,
      bookId,
      avgRating: s ? Number(s.avgRating.toFixed(1)) : 0,
      ratingsCount: s?.ratingsCount || 0,
      commentsCount: commentsById.get(bookId) || 0
    }
  })
}

async function normalizeItems(items: any[]): Promise<Book[]> {
  const base = items.filter((item) => item?.key && item?.title && (Array.isArray(item.author_name) ? item.author_name[0] : item.author_name)).slice(0, 10).map((item) => {
    const key = item.key
    const title = item.title
    const author = Array.isArray(item.author_name) ? item.author_name[0] : item.author_name
    const cover = item.cover_i ? `https://covers.openlibrary.org/b/id/${item.cover_i}-L.jpg` : ''
    const workKey = key.startsWith('/works/') ? key : String(key).replace('/books/', '/works/')
    const type = classifyType(`${title} ${JSON.stringify(item)}`)
    return { title, author, type, workKey, link: `https://openlibrary.org${workKey}`, coverUrl: cover }
  })

  const resumes = await Promise.all(base.map((b) => buildResume(b.workKey, b.title, b.type)))
  const books: Book[] = base.map((b, i) => ({
    rank: i + 1, title: b.title, author: b.author, type: b.type, link: b.link, coverUrl: b.coverUrl, resume: resumes[i],
    bookId: b.workKey, avgRating: 0, ratingsCount: 0, commentsCount: 0
  }))
  return await enrichWithRatings(books)
}

export async function getTrendingBooks() {
  const key = 'trending:list'
  const cached = cacheGet<Book[]>(key)
  if (cached) return await enrichWithRatings(cached)
  const disk = readDiskCache()
  const diskTrending = disk.trending
  if (diskTrending && diskTrending.data?.length) { cacheSet(key, diskTrending.data, TTL.trending); return await enrichWithRatings(diskTrending.data) }

  try {
    const j: any = await $fetch('https://openlibrary.org/trending/daily.json', { timeout: 15000 })
    let result = await normalizeItems(j.works || [])
    if (!result.length) { const j2: any = await $fetch('https://openlibrary.org/trending/daily.json', { timeout: 15000 }); result = await normalizeItems(j2.works || []) }
    cacheSet(key, result, TTL.trending)
    disk.trending = { updatedAt: Date.now(), data: result }
    disk.updatedAt = Date.now(); writeDiskCache(disk)
    return result
  } catch {
    if (diskTrending?.data?.length) return await enrichWithRatings(diskTrending.data)
    return []
  }
}

export async function searchBooks(topic: string) {
  const normalized = topic.trim().toLowerCase()
  const key = `search:${normalized}`
  const cached = cacheGet<Book[]>(key)
  if (cached) return await enrichWithRatings(cached)

  const disk = readDiskCache()
  const diskSearch = disk.searches?.[normalized]
  if (diskSearch?.data?.length) { cacheSet(key, diskSearch.data, TTL.search); return await enrichWithRatings(diskSearch.data) }

  try {
    const q = `https://openlibrary.org/search.json?q=${encodeURIComponent(topic)}&limit=10`
    const j: any = await $fetch(q, { timeout: 12000 })
    let result = await normalizeItems(j.docs || [])
    if (!result.length) { const j2: any = await $fetch(q, { timeout: 12000 }); result = await normalizeItems(j2.docs || []) }
    cacheSet(key, result, TTL.search)
    disk.searches = disk.searches || {}
    disk.searches[normalized] = { updatedAt: Date.now(), data: result }
    disk.updatedAt = Date.now(); writeDiskCache(disk)
    return result
  } catch {
    if (diskSearch?.data?.length) return await enrichWithRatings(diskSearch.data)
    return []
  }
}
