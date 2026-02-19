<script setup lang="ts">
const { t } = useUi()
const name = ref('')
const email = ref('')
const password = ref('')
const err = ref('')
async function submit() {
  err.value = ''
  try {
    await $fetch('/api/auth/register', { method: 'POST', body: { name: name.value, email: email.value, password: password.value } })
    await navigateTo('/')
  } catch (e:any) { err.value = e?.data?.statusMessage || t('registrationFailed') }
}
</script>
<template>
  <v-container style="max-width:560px" class="py-8">
    <h2 class="mb-4">{{ t('createAccount') }}</h2>
    <v-alert v-if="err" type="error" class="mb-3">{{ err }}</v-alert>
    <v-text-field v-model="name" :label="t('name')" />
    <v-text-field v-model="email" label="Email" />
    <v-text-field v-model="password" :label="t('passwordMin')" type="password" @keydown.enter="submit" />
    <v-btn color="red" @click="submit">{{ t('createUser') }}</v-btn>
    <div class="mt-4 text-body-2"><NuxtLink to="/login">{{ t('login') }}</NuxtLink> · <NuxtLink to="/forgot-password">{{ t('forgotPassword') }}</NuxtLink></div>
  </v-container>
</template>
