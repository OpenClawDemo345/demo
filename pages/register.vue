<script setup lang="ts">
const { t } = useUi()
const config = useRuntimeConfig()
const siteKey = config.public.turnstileSiteKey
const name = ref('')
const email = ref('')
const password = ref('')
const captchaToken = ref('')
const err = ref('')

onMounted(() => {
  ;(window as any).onRegisterCaptchaOk = (token: string) => { captchaToken.value = token }
  ;(window as any).onRegisterCaptchaExpired = () => { captchaToken.value = '' }
})

async function submit() {
  err.value = ''
  try {
    await $fetch('/api/auth/register', { method: 'POST', body: { name: name.value, email: email.value, password: password.value, captchaToken: captchaToken.value } })
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
    <div v-if="siteKey" class="mb-3">
      <div class="cf-turnstile" :data-sitekey="siteKey" data-action="register" data-callback="onRegisterCaptchaOk" data-expired-callback="onRegisterCaptchaExpired" />
    </div>
    <div v-else class="text-caption mb-3" style="color:#b71c1c">Captcha is not configured yet (TURNSTILE_SITE_KEY missing).</div>
    <v-btn color="red" @click="submit">{{ t('createUser') }}</v-btn>
    <div class="mt-4 text-body-2"><NuxtLink to="/login">{{ t('login') }}</NuxtLink> · <NuxtLink to="/forgot-password">{{ t('forgotPassword') }}</NuxtLink></div>
  </v-container>
</template>
