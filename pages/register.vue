<script setup lang="ts">
const name = ref('')
const email = ref('')
const password = ref('')
const err = ref('')
async function submit() {
  err.value = ''
  try {
    await $fetch('/api/auth/register', { method: 'POST', body: { name: name.value, email: email.value, password: password.value } })
    await navigateTo('/')
  } catch (e:any) { err.value = e?.data?.statusMessage || 'Registration failed' }
}
</script>
<template>
  <v-container style="max-width:560px" class="py-8">
    <h2 class="mb-4">Create account</h2>
    <v-alert v-if="err" type="error" class="mb-3">{{ err }}</v-alert>
    <v-text-field v-model="name" label="Name" />
    <v-text-field v-model="email" label="Email" />
    <v-text-field v-model="password" label="Password (min 8)" type="password" @keydown.enter="submit" />
    <v-btn color="red" @click="submit">Create user</v-btn>
    <div class="mt-4 text-body-2"><NuxtLink to="/login">Login</NuxtLink> · <NuxtLink to="/forgot-password">Forgot password</NuxtLink></div>
  </v-container>
</template>
