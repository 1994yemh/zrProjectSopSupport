
<template>
  <n-layout has-sider style="height: 100vh">
    <!-- Sidebar -->
    <n-layout-sider
      bordered
      :width="230"
      :collapsed-width="64"
      collapse-mode="width"
      :collapsed="collapsed"
      show-trigger
      @collapse="collapsed = true"
      @expand="collapsed = false"
    >
      <div class="brand-title" :class="{ collapsed }">
        <n-icon size="24" color="#2080f0">
          <AppsOutline />
        </n-icon>
        <span v-if="!collapsed" class="brand-text">中锐教育项目管理系统</span>
      </div>
      <n-menu
        :collapsed="collapsed"
        :collapsed-width="64"
        :collapsed-icon-size="22"
        :options="menuOptions"
        :value="currentRoute"
        @update:value="handleMenuSelect"
      />
    </n-layout-sider>

    <!-- Main Content -->
    <n-layout>
      <!-- Header -->
      <n-layout-header bordered class="admin-header">
        <div class="header-left">
          <n-breadcrumb>
            <n-breadcrumb-item>
              <n-icon size="16" :component="HomeOutline" color="#2080f0" />
              <span style="margin-left: 4px; color: #666">首页</span>
            </n-breadcrumb-item>
            <n-breadcrumb-item>
              <span style="color: #333; font-weight: 600">{{ pageTitle }}</span>
            </n-breadcrumb-item>
          </n-breadcrumb>
        </div>
        <div class="header-right">
          <n-button secondary size="small" @click="themeStore.toggleTheme">
            <template #icon>
              <n-icon :component="ColorPaletteOutline" />
            </template>
            <span class="btn-text">更换主题</span>
          </n-button>
          <n-dropdown :options="userOptions" @select="handleUserAction">
            <n-button text class="user-btn">
              <template #icon>
                <n-icon :component="PersonCircleOutline" size="20" color="#2080f0" />
              </template>
              <span class="username">{{ username }}</span>
              <n-icon size="14" :component="ChevronDownOutline" color="#999" />
            </n-button>
          </n-dropdown>
        </div>
      </n-layout-header>

      <!-- Content -->
      <n-layout-content class="admin-content">
        <router-view />
      </n-layout-content>
    </n-layout>
  </n-layout>
</template>

<script setup lang="ts">
import { ref, computed, h } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  NLayout, NLayoutSider, NLayoutHeader, NLayoutContent,
  NMenu, NButton, NIcon, NBreadcrumb, NBreadcrumbItem,
  NDropdown,
} from 'naive-ui'
import {
  AppsOutline, ColorPaletteOutline, CubeOutline,
  FolderOpenOutline, SchoolOutline, PersonCircleOutline,
  LogOutOutline, HomeOutline, ChevronDownOutline,
} from '@vicons/ionicons5'
import { useAuthStore } from '../../stores/auth'
import { useThemeStore } from '../../stores/theme'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const themeStore = useThemeStore()
const collapsed = ref(false)

const username = computed(() => authStore.username)

const pageTitleMap: Record<string, string> = {
  'Courses': '课程管理',
  'Products': '产品管理',
  'Projects': '项目管理',
}

const pageTitle = computed(() => {
  return pageTitleMap[route.name as string] || '管理端'
})

const currentRoute = computed(() => route.name as string)

function menuIcon(icon: any) {
  return () => h(NIcon, null, { default: () => h(icon) })
}

const menuOptions = [
  { label: '课程管理', key: 'Courses', icon: menuIcon(SchoolOutline) },
  { label: '产品管理', key: 'Products', icon: menuIcon(CubeOutline) },
  { label: '项目管理', key: 'Projects', icon: menuIcon(FolderOpenOutline) },
]

const userOptions = [
  {
    label: '退出登录',
    key: 'logout',
    icon: () => h(NIcon, null, { default: () => h(LogOutOutline) }),
  },
]

function handleMenuSelect(key: string) {
  router.push({ name: key })
}

function handleUserAction(key: string) {
  if (key === 'logout') {
    authStore.logout()
    router.push('/admin/login')
  }
}
</script>

<style scoped>
.brand-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 16px 12px;
  min-height: 58px;
  white-space: nowrap;
}

.brand-title.collapsed {
  padding-inline: 0;
}

.brand-text {
  font-size: 15px;
  font-weight: 700;
  color: #1a1a1a;
  overflow: hidden;
  text-overflow: ellipsis;
}

.admin-header {
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  background: #fff;
}

.header-left {
  display: flex;
  align-items: center;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-btn {
  display: flex;
  align-items: center;
  gap: 6px;
}

.username {
  font-size: 14px;
  font-weight: 500;
  color: #444;
}

.admin-content {
  padding: 20px;
  overflow: auto;
  background: #f5f7fa;
}

/* Responsive */
@media (max-width: 768px) {
  .admin-header {
    padding: 0 12px;
  }

  .btn-text {
    display: none;
  }

  .admin-content {
    padding: 12px;
  }
}

@media (max-width: 480px) {
  .username {
    display: none;
  }
}
</style>
