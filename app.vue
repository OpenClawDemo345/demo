<script setup lang="ts">
const me = ref<any>(null)
const status = ref<any>({ db: '...' })
const showCookieBanner = ref(false)

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

      <v-chip size="x-small" :color="status.db === 'up' ? 'green' : 'orange'" variant="tonal" class="mr-1">DB {{ status.db }}</v-chip>

      <template v-if="me">
        <span class="mr-2 d-none d-sm-inline text-caption" style="max-width:140px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">{{ me.email }}</span>
        <v-btn size="small" color="red" variant="tonal" icon="mdi-logout" class="d-inline-flex d-sm-none" @click="logout" />
        <v-btn size="small" color="red" class="d-none d-sm-inline-flex" @click="logout">Logout</v-btn>
      </template>
      <template v-else>
        <v-btn size="small" color="red" to="/login" class="d-none d-sm-inline-flex">Login</v-btn>
        <v-btn size="small" color="red" to="/login" variant="tonal" icon="mdi-login" class="d-inline-flex d-sm-none" />
      </template>
    </v-app-bar>

    <v-main>
      <NuxtPage />
    </v-main>

    <v-footer app class="bg-grey-lighten-4">
      <v-container class="text-center py-2">
        Source: <a href="https://github.com/OpenClawDemo345/demo" target="_blank">GitHub</a>
      </v-container>
    </v-footer>

    <v-snackbar v-model="showCookieBanner" :timeout="-1" location="bottom" color="grey-darken-3">
      This site uses cookies for login/session. Please accept to continue.
      <template #actions>
        <v-btn color="yellow" variant="text" @click="acceptCookies">Accept</v-btn>
      </template>
    </v-snackbar>
  </v-app>
</template>
