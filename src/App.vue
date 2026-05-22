<template>
  <n-config-provider :locale="zhCN" :date-locale="dateZhCN" :theme="themeStore.naiveTheme">
    <n-message-provider>
      <n-dialog-provider>
        <router-view />
      </n-dialog-provider>
    </n-message-provider>
  </n-config-provider>
</template>

<script setup lang="ts">
import { NConfigProvider, NMessageProvider, NDialogProvider, zhCN, dateZhCN } from 'naive-ui'
import { useThemeStore } from './stores/theme'

const themeStore = useThemeStore()
</script>
