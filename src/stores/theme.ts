import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { lightTheme, type GlobalThemeOverrides } from 'naive-ui'

type ThemeMode = 'classic' | 'ocean'

export const useThemeStore = defineStore('theme', () => {
  const savedMode = localStorage.getItem('themeMode')
  const initialMode: ThemeMode = savedMode === 'classic' || savedMode === 'ocean' ? savedMode : 'ocean'
  const mode = ref<ThemeMode>(initialMode)

  const naiveTheme = computed(() => lightTheme)
  const isOcean = computed(() => mode.value === 'ocean')
  const themeLabel = computed(() => (isOcean.value ? '海蓝主题' : '清爽主题'))
  const themeOverrides = computed<GlobalThemeOverrides>(() => {
    const primary = isOcean.value ? '#1677d2' : '#2080f0'
    const primaryHover = isOcean.value ? '#0f8ee8' : '#4098fc'
    const primaryPressed = isOcean.value ? '#0b5cad' : '#1060c9'

    return {
      common: {
        primaryColor: primary,
        primaryColorHover: primaryHover,
        primaryColorPressed: primaryPressed,
        primaryColorSuppl: primaryHover,
        infoColor: '#0ea5e9',
        successColor: '#20a67a',
        warningColor: '#f59e0b',
        errorColor: '#ef476f',
        borderRadius: '8px',
      },
      Button: {
        borderRadiusMedium: '8px',
        borderRadiusSmall: '7px',
      },
      Card: {
        borderRadius: '10px',
      },
      Modal: {
        borderRadius: '12px',
      },
      Tag: {
        borderRadius: '999px',
      },
    }
  })

  function toggleTheme() {
    mode.value = mode.value === 'ocean' ? 'classic' : 'ocean'
    localStorage.setItem('themeMode', mode.value)
  }

  return { mode, naiveTheme, isOcean, themeLabel, themeOverrides, toggleTheme }
})
