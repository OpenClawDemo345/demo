<script setup lang="ts">
const query = ref('')
const loading = ref(false)
const books = ref<any[]>([])
const selected = ref<any | null>(null)
const dialog = ref(false)

function closeReviewDialog() {
  dialog.value = false
  selected.value = null
  review.value = { rating: 0, comment: '' }
  reviewMsg.value = ''
}
const review = ref({ rating: 0, comment: '' })
const reviews = ref<any[]>([])
const reviewMsg = ref('')
const subtitle = computed(() => query.value.trim() ? `First 10 results for “${query.value.trim()}”` : 'Top 10 trending books')
function deriveBookId(item: any) {
  if (item?.bookId) return String(item.bookId)
  const link = String(item?.link || '')
  const m = link.match(/\/works\/[^/?#]+/)
  return m ? m[0] : ''
}


async function load(url: string) { loading.value = true; try { books.value = await $fetch<any[]>(url) } finally { loading.value = false } }
async function loadTrending() { query.value = ''; await load('/api/trending') }
async function doSearch() { const q = query.value.trim(); if (!q) return; await load(`/api/search?q=${encodeURIComponent(q)}`) }
async function openBook(item: any) {
  selected.value = { ...item, bookId: deriveBookId(item) }
  dialog.value = true
  review.value = { rating: 0, comment: '' }
  reviewMsg.value = ''
  await fetchReviews()
}
async function fetchReviews() {
  if (!selected.value?.bookId) return
  const r:any = await $fetch(`/api/books/reviews?bookId=${encodeURIComponent(selected.value.bookId)}`)
  reviews.value = r.reviews || []
}
async function submitReview() {
  if (!(await $fetch('/api/auth/me')).user) return navigateTo('/login')
  if (!selected.value) return
  if (!review.value.rating || review.value.rating < 1) {
    reviewMsg.value = 'Please select a star rating first.'
    return
  }

  const payload = {
    bookId: deriveBookId(selected.value),
    title: selected.value.title,
    author: selected.value.author,
    rating: review.value.rating,
    comment: review.value.comment
  }

  try {
    await $fetch('/api/books/reviews', { method: 'POST', body: payload })
    closeReviewDialog()
    if (query.value.trim()) {
      doSearch().catch(() => {})
    } else {
      loadTrending().catch(() => {})
    }
  } catch (e: any) {
    reviewMsg.value = e?.data?.statusMessage || 'Save failed'
  }
}
function cancelReview() {
  closeReviewDialog()
}
async function rateClick() { if (!(await $fetch('/api/auth/me')).user) navigateTo('/login') }

onMounted(async () => { await loadTrending() })
</script>

<template>
  <v-container class="py-6" style="max-width:1200px;">

    <v-card class="pa-4 mb-4">
      <v-row>
        <v-col cols="12" md="9"><v-text-field v-model="query" label="Search books" @keydown.enter="doSearch" /></v-col>
        <v-col cols="12" md="3" class="d-flex ga-2"><v-btn color="red" block @click="doSearch" :loading="loading">Search</v-btn><v-btn variant="tonal" block @click="loadTrending">Trending</v-btn></v-col>
      </v-row>
      <div class="text-caption">{{ subtitle }}</div>
    </v-card>

    <v-data-table :items="books" :headers="[{ title:'#', key:'rank', width:60 },{ title:'Title', key:'title' },{ title:'Author', key:'author' },{ title:'Summary', key:'resume', sortable:false },{ title:'Stars', key:'avgRating', width:120 },{ title:'Comments', key:'commentsCount', width:110 },{ title:'Open', key:'open', width:90, sortable:false }]">
      <template #item.title="{ item }"><a :href="item.link" target="_blank">{{ item.title }}</a></template>
      <template #item.resume="{ item }"><div class="text-caption">{{ item.resume?.[0] }}</div></template>
      <template #item.avgRating="{ item }">{{ item.avgRating || 0 }} ⭐ ({{ item.ratingsCount || 0 }})</template>
      <template #item.open="{ item }"><v-btn size="small" color="red" @click="openBook(item)">Open</v-btn></template>
    </v-data-table>

    <v-dialog v-model="dialog" max-width="900" :persistent="false">
      <v-card v-if="selected">
        <v-card-title>{{ selected.title }}</v-card-title>
        <v-card-text>
          <div class="mb-3"><b>Summary</b></div><ul><li v-for="(p,i) in selected.resume" :key="i">{{ p }}</li></ul>
          <v-divider class="my-3" />
          <div class="mb-2"><b>Rate & Comment</b></div>
          <div v-if="!me" class="mb-2 text-caption">You must login to comment or give stars. <NuxtLink to="/login">Login now</NuxtLink></div>
          <v-rating
            v-model="review.rating"
            :length="5"
            color="black"
            active-color="amber"
            empty-icon="mdi-star"
            full-icon="mdi-star"
            @click="rateClick"
          />
          <v-textarea v-model="review.comment" label="Comment" rows="3" />
          <div class="d-flex ga-2">
            <v-btn color="red" @click="submitReview">Save review</v-btn>
            <v-btn variant="tonal" @click="cancelReview">Cancel</v-btn>
          </div>
          <span class="ml-2 text-success">{{ reviewMsg }}</span>
          <v-divider class="my-3" />
          <div v-for="(r,idx) in reviews" :key="idx" class="mb-2"><b>{{ r.userName }}</b> • {{ r.rating }}⭐<div>{{ r.comment }}</div></div>
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-container>
</template>
