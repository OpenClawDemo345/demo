<script setup lang="ts">
const route = useRoute()
const token = ref(String(route.query.token || ''))
const password = ref('')
const msg = ref('')
const err = ref('')

async function submit() {
  err.value = ''; msg.value = ''
  try {
    await $fetch('/api/auth/reset-password', { method: 'POST', body: { token: token.value, password: password.value } })
    msg.value = 'Password updated. You can login now.'
  } catch (e:any) {
    err.value = e?.data?.statusMessage || 'Reset failed'
  }
}
</script>
<template>
  <v-container style="max-width:560px" class="py-8">
    <h2 class="mb-4">Reset password</h2>
    <v-alert v-if="err" type="error" class="mb-3">{{ err }}</v-alert>
    <v-alert v-if="msg" type="success" class="mb-3">{{ msg }}</v-alert>
    <v-text-field v-model="token" label="Token" />
    <v-text-field v-model="password" label="New password (min 8)" type="password" @keydown.enter="submit" />
    <v-btn color="red" @click="submit">Reset password</v-btn>
  </v-container>
</template>
