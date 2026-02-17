import { getTrendingBooks } from '../utils/books'

export default defineEventHandler(async () => {
  return await getTrendingBooks()
})
