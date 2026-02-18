<script setup lang="ts">
const email = ref('')
const msg = ref('')
const err = ref('')
async function submit() {
  err.value = ''; msg.value = ''
  try {
    const r:any = await $fetch('/api/auth/forgot-password', { method: 'POST', body: { email: email.value } })
    msg.value = r.resetToken ? `Reset token (demo): ${r.resetToken}` : 'If account exists, reset was generated.'
  } catch (e:any) { err.value = e?.data?.statusMessage || 'Request failed' }
}
</script>
<template>
  <v-container style="max-width:560px" class="py-8">
    <h2 class="mb-4">Forgot password</h2>
    <v-alert v-if="err" type="error" class="mb-3">{{ err }}</v-alert>
    <v-alert v-if="msg" type="success" class="mb-3">{{ msg }}</v-alert>
    <v-text-field v-model="email" label="Email" @keydown.enter="submit" />
    <v-btn color="red" @click="submit">Generate reset</v-btn>
    <div class="mt-4 text-body-2"><NuxtLink to="/login">Login</NuxtLink> · <NuxtLink to="/register">Create account</NuxtLink></div>
  </v-container>
</template>
