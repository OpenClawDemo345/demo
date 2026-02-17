import { searchBooks } from '../utils/books'

export default defineEventHandler(async (event) => {
  const q = String(getQuery(event).q || '').trim()
  if (!q) {
    throw createError({ statusCode: 400, statusMessage: 'Missing q' })
  }
  return await searchBooks(q)
})
