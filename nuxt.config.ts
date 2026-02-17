import vuetify from 'vite-plugin-vuetify'

export default defineNuxtConfig({
  ssr: true,
  css: ['vuetify/styles', '@mdi/font/css/materialdesignicons.css'],
  build: {
    transpile: ['vuetify']
  },
  vite: {
    ssr: {
      noExternal: ['vuetify']
    },
    plugins: [vuetify({ autoImport: true })]
  },
  compatibilityDate: '2026-02-17'
})
