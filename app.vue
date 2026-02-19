<script setup lang="ts">
const me = ref<any>(null)
const status = ref<any>({ db: '...' })
const showCookieBanner = ref(false)
const { locale, t } = useUi()

const languageItems = [
  { title: 'EN', value: 'en', flag: 'https://flagcdn.com/w20/gb.png' },
  { title: 'RO', value: 'ro', flag: 'https://flagcdn.com/w20/ro.png' },
  { title: 'FR', value: 'fr', flag: 'https://flagcdn.com/w20/fr.png' },
  { title: 'IT', value: 'it', flag: 'https://flagcdn.com/w20/it.png' },
  { title: 'HU', value: 'hu', flag: 'https://flagcdn.com/w20/hu.png' },
  { title: 'DE', value: 'de', flag: 'https://flagcdn.com/w20/de.png' }
]
const selectedLanguage = computed(() => languageItems.find((x) => x.value === locale.value) || languageItems[0])

watch(locale, () => { if (process.client) localStorage.setItem('ui_locale', locale.value) })

async function refreshGlobal() {
  try { me.value = (await $fetch<any>('/api/auth/me')).user } catch { me.value = null }
  try { status.value = await $fetch('/api/status') } catch {}
}
async function logout() {
  await $fetch('/api/auth/logout', { method: 'POST' })
  me.value = null
  await navigateTo('/login')
}
function acceptCookies() {
  localStorage.setItem('cookie_accept', 'yes')
  showCookieBanner.value = false
}
onMounted(async () => {
  locale.value = localStorage.getItem('ui_locale') || 'en'
  showCookieBanner.value = localStorage.getItem('cookie_accept') !== 'yes'
  await refreshGlobal()
})
</script>

<template>
  <v-app style="overflow-x:hidden;">
    <v-app-bar flat density="compact" class="px-2">
      <NuxtLink to="/" class="d-flex align-center text-decoration-none" style="color:inherit; min-width:0;">
        <img src="/logo.svg" alt="talks123" style="height:28px;width:28px" class="mr-2" />
        <strong class="text-truncate" style="max-width: 120px;">talks123 Books</strong>
      </NuxtLink>
      <v-spacer />

      <v-select v-model="locale" :items="languageItems" item-title="title" item-value="value" density="compact" variant="underlined" hide-details style="max-width:110px" class="mr-1">
        <template #selection>
          <div class="d-flex align-center">
            <img :src="selectedLanguage.flag" alt="flag" style="width:16px;height:12px" class="mr-1" />
            <span>{{ selectedLanguage.title }}</span>
          </div>
        </template>
        <template #item="{ props, item }">
          <v-list-item v-bind="props" :title="item.raw.title">
            <template #prepend><img :src="item.raw.flag" alt="flag" style="width:16px;height:12px" /></template>
          </v-list-item>
        </template>
      </v-select>

      <v-chip size="x-small" :color="status.db === 'up' ? 'green' : 'orange'" variant="tonal" class="mr-1">DB {{ status.db }}</v-chip>
      <v-btn size="small" variant="tonal" to="/preferences" class="mr-1 d-none d-sm-inline-flex">{{ t('theme') }}</v-btn>
      <v-btn size="small" variant="tonal" icon="mdi-cog" to="/preferences" class="mr-1 d-inline-flex d-sm-none" />
      <template v-if="me">
        <span class="mr-2 d-none d-sm-inline text-caption" style="max-width:140px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">{{ me.email }}</span>
        <v-btn size="small" color="red" variant="tonal" icon="mdi-logout" class="d-inline-flex d-sm-none" @click="logout" />
        <v-btn size="small" color="red" class="d-none d-sm-inline-flex" @click="logout">{{ t('logout') }}</v-btn>
      </template>
      <template v-else>
        <v-btn size="small" color="red" to="/login" class="d-none d-sm-inline-flex">{{ t('login') }}</v-btn>
        <v-btn size="small" color="red" to="/login" variant="tonal" icon="mdi-login" class="d-inline-flex d-sm-none" />
      </template>
    </v-app-bar>

    <v-main><NuxtPage /></v-main>
    <v-footer app class="bg-grey-lighten-4"><v-container class="text-center py-2">{{ t('source') }}: <a href="https://github.com/OpenClawDemo345/demo" target="_blank">GitHub</a></v-container></v-footer>
    <v-snackbar v-model="showCookieBanner" :timeout="-1" location="bottom" color="grey-darken-3">{{ t('cookiesMsg') }}<template #actions><v-btn color="yellow" variant="text" @click="acceptCookies">{{ t('accept') }}</v-btn></template></v-snackbar>
  </v-app>
</template>
