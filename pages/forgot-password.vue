<script setup lang="ts">
const { t } = useUi()
const email = ref('')
const msg = ref('')
const err = ref('')
async function submit() {
  err.value = ''; msg.value = ''
  try {
    await $fetch('/api/auth/forgot-password', { method: 'POST', body: { email: email.value } })
    msg.value = 'If account exists, a reset email was sent.'
  } catch (e:any) { err.value = e?.data?.statusMessage || t('requestFailed') }
}
</script>
<template>
  <v-container style="max-width:560px" class="py-8">
    <h2 class="mb-4">{{ t('forgotTitle') }}</h2>
    <v-alert v-if="err" type="error" class="mb-3">{{ err }}</v-alert>
    <v-alert v-if="msg" type="success" class="mb-3">{{ msg }}</v-alert>
    <v-text-field v-model="email" label="Email" @keydown.enter="submit" />
    <v-btn color="red" @click="submit">{{ t('generateReset') }}</v-btn>
    <div class="mt-4 text-body-2"><NuxtLink to="/login">{{ t('login') }}</NuxtLink> · <NuxtLink to="/register">{{ t('createAccount') }}</NuxtLink></div>
  </v-container>
</template>
