type Book = {
  rank: number
  title: string
  author: string
  type: string
  link: string
  coverUrl: string
  resume: string[]
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
  try {
    const j: any = await $fetch(`https://openlibrary.org${workKey}.json`)
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
    return points.slice(0, 3)
  } catch {
    return defaultResume(title, type)
  }
}

async function normalizeItems(items: any[]): Promise<Book[]> {
  const out: Book[] = []

  for (const item of items) {
    if (out.length >= 10) break

    const key = item.key
    const title = item.title
    const author = Array.isArray(item.author_name) ? item.author_name[0] : item.author_name
    const cover = item.cover_i ? `https://covers.openlibrary.org/b/id/${item.cover_i}-L.jpg` : ''

    if (!key || !title || !author) continue

    const workKey = key.startsWith('/works/') ? key : String(key).replace('/books/', '/works/')
    const type = classifyType(`${title} ${JSON.stringify(item)}`)
    const resume = await buildResume(workKey, title, type)

    out.push({
      rank: out.length + 1,
      title,
      author,
      type,
      link: `https://openlibrary.org${workKey}`,
      coverUrl: cover,
      resume
    })
  }

  return out
}

export async function getTrendingBooks() {
  const j: any = await $fetch('https://openlibrary.org/trending/daily.json')
  return normalizeItems(j.works || [])
}

export async function searchBooks(topic: string) {
  const j: any = await $fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(topic)}&limit=10`)
  return normalizeItems(j.docs || [])
}
