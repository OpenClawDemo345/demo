<script setup lang="ts">
const admin = ref<any>(null)
const users = ref<any[]>([])
const logsOpen = ref<Record<string, boolean>>({})
const logs = ref<Record<string, any[]>>({})
const err = ref('')
const info = ref('')

const username = ref('admin')
const password = ref('admin')
const newAdminPassword = ref('')
const config = useRuntimeConfig()
const siteKey = config.public.turnstileSiteKey
const captchaToken = ref('')

onMounted(() => {
  ;(window as any).onAdminCaptchaOk = (token: string) => { captchaToken.value = token }
  ;(window as any).onAdminCaptchaExpired = () => { captchaToken.value = '' }
})

async function refreshAdmin() {
  try { admin.value = (await $fetch<any>('/api/admin/me')).admin } catch { admin.value = null }
}
async function refreshUsers() {
  users.value = (await $fetch<any>('/api/admin/users')).users || []
}

async function adminLogin() {
  err.value = ''; info.value = ''
  try {
    const res = await $fetch<any>('/api/admin/login', { method: 'POST', body: { username: username.value, password: password.value, captchaToken: captchaToken.value } })
    admin.value = res.admin
    await refreshUsers()
  } catch (e:any) { err.value = e?.data?.statusMessage || 'Login failed' }
}
async function adminLogout() {
  await $fetch('/api/admin/logout', { method: 'POST' })
  admin.value = null
  users.value = []
}
async function changeAdminPassword() {
  err.value = ''; info.value = ''
  try {
    await $fetch('/api/admin/change-password', { method: 'POST', body: { password: newAdminPassword.value } })
    info.value = 'Admin password changed.'
    newAdminPassword.value = ''
    await refreshAdmin()
  } catch (e:any) { err.value = e?.data?.statusMessage || 'Change failed' }
}

async function toggleLogs(userId: string) {
  logsOpen.value[userId] = !logsOpen.value[userId]
  if (logsOpen.value[userId] && !logs.value[userId]) {
    const res = await $fetch<any>(`/api/admin/users/${userId}/logs`)
    logs.value[userId] = res.logs || []
  }
}
async function setEnabled(userId: string, enabled: boolean) {
  await $fetch(`/api/admin/users/${userId}/set-enabled`, { method: 'POST', body: { enabled } })
  await refreshUsers()
}
async function setPassword(userId: string) {
  const p = prompt('New password (min 8 chars):') || ''
  if (!p) return
  await $fetch(`/api/admin/users/${userId}/set-password`, { method: 'POST', body: { password: p } })
  info.value = 'Password changed.'
}
async function deleteUser(userId: string, email: string) {
  if (!confirm(`Delete account ${email}?`)) return
  await $fetch(`/api/admin/users/${userId}/delete`, { method: 'POST' })
  await refreshUsers()
}

onMounted(async () => {
  await refreshAdmin()
  if (admin.value) await refreshUsers()
})
</script>

<template>
  <v-container class="py-8">
    <h2 class="mb-4">Admin Console</h2>
    <v-alert v-if="err" type="error" class="mb-3">{{ err }}</v-alert>
    <v-alert v-if="info" type="success" class="mb-3">{{ info }}</v-alert>

    <v-card v-if="!admin" max-width="520" class="pa-4">
      <v-text-field v-model="username" label="Admin username" />
      <v-text-field v-model="password" label="Admin password" type="password" @keydown.enter="adminLogin" />
      <div v-if="siteKey" class="mb-3">
      <div class="cf-turnstile" :data-sitekey="siteKey" data-action="admin-login" data-callback="onAdminCaptchaOk" data-expired-callback="onAdminCaptchaExpired" />
    </div>
      <div v-else class="text-caption mb-3" style="color:#b71c1c">Captcha is not configured yet (TURNSTILE_SITE_KEY missing).</div>
      <v-btn color="red" @click="adminLogin">Login</v-btn>
      <div class="text-caption mt-2">Default first login: admin / admin</div>
    </v-card>

    <template v-else>
      <v-card class="pa-4 mb-4">
        <div class="d-flex align-center">
          <div><strong>Logged as {{ admin.username }}</strong></div>
          <v-spacer />
          <v-btn color="red" variant="tonal" @click="adminLogout">Logout</v-btn>
        </div>
        <v-alert v-if="admin.mustChangePassword" type="warning" class="mt-3 mb-3">Change default admin password now.</v-alert>
        <div class="d-flex ga-2 align-center mt-2" style="max-width:560px;">
          <v-text-field v-model="newAdminPassword" label="New admin password" type="password" hide-details />
          <v-btn color="red" @click="changeAdminPassword">Change admin password</v-btn>
        </div>
      </v-card>

      <v-table>
        <thead>
          <tr>
            <th>Email</th>
            <th>Name</th>
            <th>Created</th>
            <th>Enabled</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in users" :key="u.id">
            <td>{{ u.email }}</td>
            <td>{{ u.name }}</td>
            <td>{{ new Date(u.createdAt).toLocaleString() }}</td>
            <td>{{ u.enabled ? 'Yes' : 'No' }}</td>
            <td>
              <v-btn size="x-small" class="mr-1" variant="tonal" @click="toggleLogs(u.id)">Logs</v-btn>
              <v-btn size="x-small" class="mr-1" variant="tonal" @click="setPassword(u.id)">Change password</v-btn>
              <v-btn size="x-small" class="mr-1" variant="tonal" @click="setEnabled(u.id, !u.enabled)">{{ u.enabled ? 'Disable' : 'Enable' }}</v-btn>
              <v-btn size="x-small" color="red" variant="tonal" @click="deleteUser(u.id, u.email)">Delete</v-btn>
            </td>
          </tr>
          <tr v-for="u in users" :key="u.id + '-logs'" v-show="logsOpen[u.id]">
            <td colspan="5">
              <div v-if="!(logs[u.id]||[]).length" class="text-caption">No logs</div>
              <ul v-else>
                <li v-for="l in logs[u.id]" :key="String(l._id)">
                  {{ new Date(l.createdAt).toLocaleString() }} — {{ l.action }}
                  <span v-if="l.meta && Object.keys(l.meta).length"> — {{ JSON.stringify(l.meta) }}</span>
                </li>
              </ul>
            </td>
          </tr>
        </tbody>
      </v-table>
    </template>
  </v-container>
</template>
