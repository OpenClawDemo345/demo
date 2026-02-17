import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

type Book = {
  rank: number
  title: string
  author: string
  type: string
  link: string
  coverUrl: string
  resume: string[]
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

const TTL = {
  trending: 60 * 60 * 1000, // 1h
  search: 60 * 60 * 1000, // 1h per topic
  resume: 24 * 60 * 60 * 1000 // 24h per work
}

function cacheGet<T>(key: string): T | null {
  const hit = memCache.get(key)
  if (!hit) return null
  if (Date.now() > hit.expiresAt) {
    memCache.delete(key)
    return null
  }
  return hit.value as T
}

function cacheSet<T>(key: string, value: T, ttlMs: number) {
  memCache.set(key, { value, expiresAt: Date.now() + ttlMs })
}

function readDiskCache(): DiskCache {
  try {
    if (!existsSync(CACHE_FILE)) return { updatedAt: Date.now(), searches: {}, resumes: {} }
    const raw = readFileSync(CACHE_FILE, 'utf8')
    const parsed = JSON.parse(raw)
    return {
      updatedAt: parsed.updatedAt || Date.now(),
      trending: parsed.trending,
      searches: parsed.searches || {},
      resumes: parsed.resumes || {}
    }
  } catch {
    return { updatedAt: Date.now(), searches: {}, resumes: {} }
  }
}

function writeDiskCache(next: DiskCache) {
  try {
    const dir = dirname(CACHE_FILE)
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
    writeFileSync(CACHE_FILE, JSON.stringify(next, null, 2), 'utf8')
  } catch {
    // ignore disk cache write failures
  }
}

function classifyType(text = '') {
  const t = text.toLowerCase()
  const has = (...w: string[]) => w.some((x) => t.includes(x))
  if (has('programming', 'software', 'code', 'algorithm', 'machine learning', ' ai ', 'data', 'java', 'python', 'devops', 'cloud')) return 'Technical'
  if (has('history', 'biography', 'memoir', 'economics', 'finance', 'business', 'politics', 'psychology', 'self-help', 'philosophy', 'science')) return 'Non-fiction'
  if (has('novel', 'fiction', 'romance', 'fantasy', 'thriller', 'mystery', 'poetry', 'literature', 'classic')) return 'Literature'
  return 'General'
}

function splitSentences(s = '') {
  return s.split(/(?<=[.!?])\s+/).map((x) => x.trim()).filter(Boolean)
}

function defaultResume(title: string, type: string) {
  return [
    `After reading "${title}", I learned to focus on one core principle and apply it consistently.`,
    'I learned that progress comes from small repeatable actions, not one-time motivation.',
    type === 'Technical'
      ? 'I learned to translate ideas into a simple system I can test, measure, and improve.'
      : 'I learned to reflect on the story/ideas and turn them into concrete decisions in daily life.'
  ]
}

async function buildResume(workKey: string, title: string, type: string) {
  const resumeKey = `resume:${workKey}`
  const cached = cacheGet<string[]>(resumeKey)
  if (cached) return cached

  const disk = readDiskCache()
  const diskResume = disk.resumes?.[workKey]
  if (diskResume && Date.now() - diskResume.updatedAt < TTL.resume) {
    cacheSet(resumeKey, diskResume.data, TTL.resume)
    return diskResume.data
  }

  try {
    const j: any = await $fetch(`https://openlibrary.org${workKey}.json`, { timeout: 4000 })
    const desc = typeof j.description === 'string' ? j.description : j.description?.value

    const points: string[] = []
    if (desc) {
      for (const s of splitSentences(String(desc))) {
        if (s.length > 35) {
          points.push(`After reading it, I learned: ${s.slice(0, 220)}`)
          if (points.length >= 2) break
        }
      }
    }

    if (Array.isArray(j.subjects) && j.subjects.length) {
      points.push(`My key themes from the book are: ${j.subjects.slice(0, 4).join(', ')}.`)
    }

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

async function normalizeItems(items: any[]): Promise<Book[]> {
  const base = items
    .filter((item) => item?.key && item?.title && (Array.isArray(item.author_name) ? item.author_name[0] : item.author_name))
    .slice(0, 10)
    .map((item) => {
      const key = item.key
      const title = item.title
      const author = Array.isArray(item.author_name) ? item.author_name[0] : item.author_name
      const cover = item.cover_i ? `https://covers.openlibrary.org/b/id/${item.cover_i}-L.jpg` : ''
      const workKey = key.startsWith('/works/') ? key : String(key).replace('/books/', '/works/')
      const type = classifyType(`${title} ${JSON.stringify(item)}`)

      return {
        title,
        author,
        type,
        workKey,
        link: `https://openlibrary.org${workKey}`,
        coverUrl: cover
      }
    })

  const resumes = await Promise.all(base.map((b) => buildResume(b.workKey, b.title, b.type)))

  return base.map((b, i) => ({
    rank: i + 1,
    title: b.title,
    author: b.author,
    type: b.type,
    link: b.link,
    coverUrl: b.coverUrl,
    resume: resumes[i]
  }))
}

export async function getTrendingBooks() {
  const key = 'trending:list'
  const cached = cacheGet<Book[]>(key)
  if (cached) return cached

  const disk = readDiskCache()
  const diskTrending = disk.trending
  // Serve disk cache immediately (fast path), even if stale; cron refresh keeps it fresh.
  if (diskTrending && diskTrending.data?.length) {
    cacheSet(key, diskTrending.data, TTL.trending)
    return diskTrending.data
  }

  try {
    const j: any = await $fetch('https://openlibrary.org/trending/daily.json', { timeout: 5000 })
    const result = await normalizeItems(j.works || [])

    cacheSet(key, result, TTL.trending)
    disk.trending = { updatedAt: Date.now(), data: result }
    disk.updatedAt = Date.now()
    writeDiskCache(disk)

    return result
  } catch {
    // If provider is slow/down, serve stale disk cache instead of 500
    if (diskTrending?.data?.length) return diskTrending.data
    return []
  }
}

export async function searchBooks(topic: string) {
  const normalized = topic.trim().toLowerCase()
  const key = `search:${normalized}`
  const cached = cacheGet<Book[]>(key)
  if (cached) return cached

  const disk = readDiskCache()
  const diskSearch = disk.searches?.[normalized]
  // Serve disk cache immediately (fast path), even if stale; cron refresh keeps it fresh.
  if (diskSearch?.data?.length) {
    cacheSet(key, diskSearch.data, TTL.search)
    return diskSearch.data
  }

  try {
    const j: any = await $fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(topic)}&limit=10`, { timeout: 5000 })
    const result = await normalizeItems(j.docs || [])

    cacheSet(key, result, TTL.search)
    disk.searches = disk.searches || {}
    disk.searches[normalized] = { updatedAt: Date.now(), data: result }
    disk.updatedAt = Date.now()
    writeDiskCache(disk)

    return result
  } catch {
    if (diskSearch?.data?.length) return diskSearch.data
    return []
  }
}
