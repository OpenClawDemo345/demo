<script setup lang="ts">
const query = ref('')
const loading = ref(false)
const dialog = ref(false)
const selected = ref<any | null>(null)
const books = ref<any[]>([])

const heroImage = 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=1800&q=80'

const subtitle = computed(() =>
  query.value.trim() ? `First 10 results for “${query.value.trim()}”` : 'Top 10 trending books right now'
)

async function load(url: string) {
  loading.value = true
  try {
    books.value = await $fetch<any[]>(url)
  } finally {
    loading.value = false
  }
}

async function loadTrending() {
  query.value = ''
  await load('/api/trending')
}

async function doSearch() {
  const q = query.value.trim()
  if (!q) return
  await load(`/api/search?q=${encodeURIComponent(q)}`)
}

function openLearn(item: any) {
  selected.value = item
  dialog.value = true
}

onMounted(loadTrending)
</script>

<template>
  <v-container class="py-6" style="max-width: 1200px;">
    <div class="hero mb-0">
      <img class="hero-img" :src="heroImage" alt="Reading is dreaming" />
      <div class="hero-overlay">
        <div class="text-overline">BOOK DISCOVERY</div>
        <h1 class="text-h3 font-weight-bold mb-2">Reading is dreaming with open eyes</h1>
        <div class="text-subtitle-1">Nuxt 3 + Vuetify edition</div>
      </div>
    </div>

    <v-card class="search-card pa-4 pa-md-6" elevation="8">
      <v-row align="center" class="ga-2">
        <v-col cols="12" md="9">
          <v-text-field
            v-model="query"
            label="Search by topic (productivity, history, java, psychology...)"
            prepend-inner-icon="mdi-book-search"
            density="comfortable"
            variant="outlined"
            hide-details
            @keydown.enter="doSearch"
          />
        </v-col>
        <v-col cols="12" md="3" class="d-flex ga-2">
          <v-btn color="red-darken-2" size="large" block @click="doSearch" :loading="loading">Search</v-btn>
          <v-btn color="red-lighten-1" variant="tonal" size="large" block @click="loadTrending" :disabled="loading">Trending</v-btn>
        </v-col>
      </v-row>
    </v-card>

    <div class="d-flex align-center justify-space-between mt-6 mb-3">
      <div>
        <div class="text-h6">{{ subtitle }}</div>
        <div class="text-medium-emphasis">Click title to open source page • Learn for 3 key insights</div>
      </div>
      <v-progress-circular indeterminate color="red-darken-2" v-if="loading" />
    </div>

    <v-card elevation="3" rounded="xl">
      <v-data-table
        :items="books"
        :headers="[
          { title: '#', key: 'rank', width: 70 },
          { title: 'Title', key: 'title' },
          { title: 'Author', key: 'author' },
          { title: 'Type', key: 'type', width: 140 },
          { title: 'Link', key: 'link', width: 100, sortable: false },
          { title: 'Learn', key: 'learn', width: 110, sortable: false }
        ]"
        item-value="rank"
        :items-per-page="10"
        density="comfortable"
      >
        <template #item.title="{ item }">
          <a :href="item.link" target="_blank" style="text-decoration:none;color:#b71c1c;font-weight:600">{{ item.title }}</a>
        </template>

        <template #item.type="{ item }">
          <v-chip color="red-darken-1" variant="tonal" size="small">{{ item.type }}</v-chip>
        </template>

        <template #item.link="{ item }">
          <v-btn icon="mdi-open-in-new" variant="text" :href="item.link" target="_blank" />
        </template>

        <template #item.learn="{ item }">
          <v-btn color="red" size="small" rounded="pill" @click="openLearn(item)">Learn</v-btn>
        </template>
      </v-data-table>
    </v-card>

    <v-dialog v-model="dialog" max-width="980">
      <v-card rounded="xl" v-if="selected">
        <v-card-title class="text-h5 font-weight-bold">{{ selected.title }}</v-card-title>
        <v-card-subtitle>{{ selected.author }} • {{ selected.type }}</v-card-subtitle>

        <v-card-text>
          <v-row>
            <v-col cols="12" md="4" class="d-flex justify-center">
              <img v-if="selected.coverUrl" :src="selected.coverUrl" class="cover-preview" alt="Book cover" />
              <v-sheet v-else class="cover-preview d-flex align-center justify-center" color="grey-lighten-3">No cover</v-sheet>
            </v-col>
            <v-col cols="12" md="8">
              <div class="text-subtitle-1 mb-3">Someone who read this book says these are the 3 main things learned:</div>
              <v-list lines="three" density="comfortable">
                <v-list-item v-for="(point, idx) in selected.resume" :key="idx" :title="(idx+1) + '. ' + point" />
              </v-list>
            </v-col>
          </v-row>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="dialog=false">Close</v-btn>
          <v-btn color="primary" :href="selected.link" target="_blank">Open book page</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-footer class="mt-6 bg-grey-lighten-4 rounded-lg">
      <v-container class="py-2 text-center text-medium-emphasis">
        This website was generated and deployed using OpenClaw •
        <a href="https://github.com/OpenClawDemo345/demo" target="_blank">Source code on GitHub</a>
      </v-container>
    </v-footer>
  </v-container>
</template>

<style scoped>
.hero {
  position: relative;
  border-radius: 20px;
  overflow: hidden;
  min-height: 280px;
  background: #1f2937;
}
.hero-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: brightness(0.55);
}
.hero-overlay {
  position: relative;
  z-index: 1;
  padding: 28px;
  color: white;
}
.search-card {
  margin-top: -34px;
  position: relative;
  z-index: 2;
  border-radius: 18px;
}
.cover-preview {
  width: 220px;
  max-width: 100%;
  border-radius: 12px;
  border: 1px solid #ddd;
  object-fit: cover;
}
</style>
