<template>
  <n-layout has-sider style="height: 100vh">
    <n-layout-sider bordered :width="220" :collapsed-width="64" collapse-mode="width" :collapsed="collapsed" show-trigger @collapse="collapsed = true" @expand="collapsed = false">
      <div class="brand-title" :class="{ collapsed }">
        <n-icon size="24" color="#4f7dd9">
          <AppsOutline />
        </n-icon>
        <span>{{ collapsed ? '' : '中锐教育项目管理系统' }}</span>
      </div>
      <n-menu :collapsed="collapsed" :collapsed-width="64" :collapsed-icon-size="22" :options="menuOptions" :value="currentRoute" @update:value="handleMenuSelect" />
    </n-layout-sider>
    <n-layout>
      <n-layout-header bordered style="height: 50px; display: flex; align-items: center; justify-content: flex-end; gap: 12px; padding: 0 20px">
        <n-button secondary size="small" @click="themeStore.toggleTheme">
          <template #icon>
            <n-icon :component="ColorPaletteOutline" />
          </template>
          更换主题
        </n-button>
        <span>{{ username }}</span>
        <n-button text @click="handleLogout">
          <template #icon>
            <n-icon :component="LogOutOutline" />
          </template>
          退出登录
        </n-button>
      </n-layout-header>
      <n-layout-content style="padding: 20px; overflow: auto">
        <router-view />
      </n-layout-content>
    </n-layout>
  </n-layout>
</template>

<script setup lang="ts">
import { ref, computed, h } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { NLayout, NLayoutSider, NLayoutHeader, NLayoutContent, NMenu, NButton, NIcon } from 'naive-ui'
import { AppsOutline, ColorPaletteOutline, CubeOutline, FolderOpenOutline, LogOutOutline, SchoolOutline } from '@vicons/ionicons5'
import { useAuthStore } from '../../stores/auth'
import { useThemeStore } from '../../stores/theme'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const themeStore = useThemeStore()
const collapsed = ref(false)

const username = computed(() => authStore.username)

const currentRoute = computed(() => route.name as string)

function menuIcon(icon: any) {
  return () => h(NIcon, null, { default: () => h(icon) })
}

const menuOptions = [
  { label: '课程管理', key: 'Courses', icon: menuIcon(SchoolOutline) },
  { label: '产品管理', key: 'Products', icon: menuIcon(CubeOutline) },
  { label: '项目管理', key: 'Projects', icon: menuIcon(FolderOpenOutline) },
]

function handleMenuSelect(key: string) {
  router.push({ name: key })
}

function handleLogout() {
  authStore.logout()
  router.push('/admin/login')
}
</script>

<style scoped>
.brand-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px 12px;
  min-height: 58px;
  font-size: 16px;
  font-weight: 700;
  white-space: nowrap;
}

.brand-title.collapsed {
  padding-inline: 0;
}
</style>
