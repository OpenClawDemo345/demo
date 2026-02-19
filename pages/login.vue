<script setup lang="ts">
const { t } = useUi()
const email = ref('')
const password = ref('')
const err = ref('')
async function submit() {
  err.value = ''
  try {
    await $fetch('/api/auth/login', { method: 'POST', body: { email: email.value, password: password.value } })
    await navigateTo('/')
  } catch (e:any) { err.value = e?.data?.statusMessage || t('loginFailed') }
}
</script>
<template>
  <v-container style="max-width:560px" class="py-8">
    <h2 class="mb-4">{{ t('login') }}</h2>
    <v-alert v-if="err" type="error" class="mb-3">{{ err }}</v-alert>
    <v-text-field v-model="email" label="Email" />
    <v-text-field v-model="password" :label="t('password')" type="password" @keydown.enter="submit" />
    <v-btn color="red" @click="submit">{{ t('login') }}</v-btn>
    <v-btn class="ml-2" variant="tonal" href="/api/auth/google">Login with Google</v-btn>
    <div class="mt-4 text-body-2"><NuxtLink to="/register">{{ t('createAccount') }}</NuxtLink> · <NuxtLink to="/forgot-password">{{ t('forgotPassword') }}</NuxtLink></div>
  </v-container>
</template>
