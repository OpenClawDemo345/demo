import vuetify from 'vite-plugin-vuetify'

export default defineNuxtConfig({
  app: {
    head: {
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }],
      script: [{ src: 'https://challenges.cloudflare.com/turnstile/v0/api.js', async: true, defer: true }]
    }
  },
  ssr: true,
  css: ['vuetify/styles', '@mdi/font/css/materialdesignicons.css'],
  build: { transpile: ['vuetify'] },
  vite: {
    ssr: { noExternal: ['vuetify'] },
    plugins: [vuetify({ autoImport: true })]
  },
  runtimeConfig: {
    googleClientId: process.env.GOOGLE_CLIENT_ID || '',
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    turnstileSecretKey: process.env.TURNSTILE_SECRET_KEY || '',
    public: {
      baseUrl: process.env.PUBLIC_BASE_URL || 'https://talks123.ro',
      turnstileSiteKey: process.env.TURNSTILE_SITE_KEY || ''
    }
  },
  compatibilityDate: '2026-02-17'
})
