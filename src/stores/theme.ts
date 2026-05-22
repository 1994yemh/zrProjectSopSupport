import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { darkTheme, lightTheme } from 'naive-ui'

type ThemeMode = 'light' | 'dark'

export const useThemeStore = defineStore('theme', () => {
  const mode = ref<ThemeMode>((localStorage.getItem('themeMode') as ThemeMode) || 'light')

  const naiveTheme = computed(() => (mode.value === 'dark' ? darkTheme : lightTheme))
  const isDark = computed(() => mode.value === 'dark')

  function toggleTheme() {
    mode.value = mode.value === 'dark' ? 'light' : 'dark'
    localStorage.setItem('themeMode', mode.value)
  }

  return { mode, naiveTheme, isDark, toggleTheme }
})
