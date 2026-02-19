<script setup lang="ts">
import { useTheme } from 'vuetify'
const { t, themeMode } = useUi()
const theme = useTheme()
const options = computed(() => [
  { title: t('light'), value: 'light' },
  { title: t('dark'), value: 'dark' }
])

onMounted(() => {
  themeMode.value = localStorage.getItem('ui_theme') || 'light'
  theme.global.name.value = themeMode.value === 'dark' ? 'dark' : 'light'
})

watch(themeMode, () => {
  localStorage.setItem('ui_theme', themeMode.value)
  theme.global.name.value = themeMode.value === 'dark' ? 'dark' : 'light'
})
</script>

<template>
  <v-container style="max-width:640px" class="py-8">
    <h2 class="mb-4">{{ t('theme') }} preferences</h2>
    <v-select v-model="themeMode" :items="options" item-title="title" item-value="value" :label="t('theme')" />
  </v-container>
</template>
