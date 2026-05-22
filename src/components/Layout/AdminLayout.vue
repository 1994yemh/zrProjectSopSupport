
<template>
  <n-layout has-sider class="admin-shell" :class="`theme-${themeStore.mode}`">
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
      class="admin-sider"
    >
      <div class="brand-title" :class="{ collapsed }">
        <n-icon size="24" class="brand-icon">
          <AppsOutline />
        </n-icon>
        <span v-if="!collapsed" class="brand-text-wrap">
          <span class="brand-text">中锐教育项目管理系统</span>
        </span>
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
          <div class="system-brief">
            <n-icon size="18" class="system-brief-icon" :component="GitNetworkOutline" />
            <div class="system-brief-text">
              <span class="system-brief-title">项目交付控制台</span>
              <span class="system-brief-subtitle">课程 · 产品 · 生命周期</span>
            </div>
          </div>
          <n-button secondary size="small" @click="themeStore.toggleTheme">
            <template #icon>
              <n-icon :component="ColorPaletteOutline" />
            </template>
            <span class="btn-text">{{ themeStore.themeLabel }}</span>
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
  LogOutOutline, HomeOutline, ChevronDownOutline, GitNetworkOutline,
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
.admin-shell {
  --admin-primary: #1677d2;
  --admin-primary-soft: #d9efff;
  --admin-primary-tint: #eef8ff;
  --admin-accent: #22c7d6;
  --admin-ink: #14213d;
  --admin-muted: #5d6b82;
  --admin-border: rgba(104, 158, 210, 0.24);
  --admin-surface: rgba(255, 255, 255, 0.84);
  --admin-surface-strong: rgba(255, 255, 255, 0.94);
  height: 100vh;
  background:
    linear-gradient(135deg, rgba(230, 246, 255, 0.92) 0%, rgba(247, 252, 255, 0.96) 42%, rgba(234, 248, 250, 0.92) 100%);
}

.admin-shell.theme-classic {
  --admin-primary: #2080f0;
  --admin-primary-soft: #e8f2ff;
  --admin-primary-tint: #f4f8ff;
  --admin-accent: #62b6ff;
  --admin-ink: #182235;
  --admin-muted: #657287;
  --admin-border: rgba(142, 165, 193, 0.26);
  --admin-surface: rgba(255, 255, 255, 0.9);
  --admin-surface-strong: rgba(255, 255, 255, 0.96);
  background:
    linear-gradient(135deg, rgba(244, 248, 255, 0.96) 0%, rgba(255, 255, 255, 0.98) 48%, rgba(238, 247, 255, 0.95) 100%);
}

.admin-shell :deep(.n-layout) {
  background: transparent;
}

.admin-sider {
  background:
    linear-gradient(180deg, var(--admin-surface-strong) 0%, rgba(239, 249, 255, 0.86) 100%);
  border-right: 1px solid var(--admin-border);
  box-shadow: 10px 0 34px rgba(57, 107, 151, 0.08);
  backdrop-filter: blur(18px);
}

.brand-title {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  padding: 16px 10px;
  min-height: 64px;
  white-space: nowrap;
  border-bottom: 1px solid var(--admin-border);
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.72), rgba(232, 247, 255, 0.72));
}

.brand-title.collapsed {
  padding-inline: 0;
}

.brand-icon {
  color: var(--admin-primary);
  filter: drop-shadow(0 8px 14px rgba(22, 119, 210, 0.18));
}

.brand-text-wrap {
  position: relative;
  overflow: hidden;
  text-overflow: ellipsis;
  filter: drop-shadow(0 2px 3px rgba(22, 119, 210, 0.2));
}

.brand-text-wrap::after {
  content: "";
  position: absolute;
  bottom: -3px;
  left: 0;
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, transparent 0%, rgba(32, 160, 255, 0.5) 30%, rgba(34, 199, 214, 0.4) 70%, transparent 100%);
  border-radius: 2px;
}

.brand-text {
  display: inline-block;
  font-size: 17px;
  font-weight: 800;
  background: linear-gradient(135deg, #0a5aa8 0%, #1677d2 35%, #2aaaff 65%, #22c7d6 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: 0.6px;
  white-space: nowrap;
}

:deep(.n-menu) {
  padding: 12px 10px;
}

:deep(.n-menu-item-content) {
  border-radius: 10px;
  margin-block: 4px;
  transition: background 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}

:deep(.n-menu-item-content:hover) {
  background: rgba(222, 241, 255, 0.72);
}

:deep(.n-menu-item-content.n-menu-item-content--selected) {
  background:
    linear-gradient(135deg, rgba(211, 236, 255, 0.95), rgba(228, 250, 252, 0.9));
  box-shadow: inset 3px 0 0 var(--admin-primary), 0 10px 22px rgba(37, 115, 180, 0.1);
}

.admin-header {
  height: 58px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 22px;
  background: var(--admin-surface);
  border-bottom: 1px solid var(--admin-border);
  box-shadow: 0 10px 30px rgba(52, 109, 153, 0.08);
  backdrop-filter: blur(18px);
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

.system-brief {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 36px;
  padding: 0 12px;
  border: 1px solid rgba(71, 145, 206, 0.22);
  border-radius: 999px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.86), rgba(220, 241, 255, 0.7));
  box-shadow: 0 10px 22px rgba(51, 109, 153, 0.1);
}

.system-brief-icon {
  color: var(--admin-primary);
}

.system-brief-text {
  display: flex;
  flex-direction: column;
  line-height: 1.1;
}

.system-brief-title {
  font-size: 12px;
  font-weight: 700;
  color: #1c3554;
}

.system-brief-subtitle {
  margin-top: 2px;
  font-size: 11px;
  color: #5e7492;
}

.user-btn {
  display: flex;
  align-items: center;
  gap: 6px;
}

.username {
  font-size: 14px;
  font-weight: 500;
  color: var(--admin-muted);
}

.admin-content {
  position: relative;
  padding: 24px;
  overflow: auto;
  background:
    radial-gradient(circle at top left, rgba(80, 180, 255, 0.18), transparent 34%),
    radial-gradient(circle at 80% 10%, rgba(53, 214, 214, 0.14), transparent 30%),
    linear-gradient(145deg, rgba(239, 248, 255, 0.9), rgba(250, 253, 255, 0.92));
}

.admin-content::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.46;
  background-image:
    linear-gradient(rgba(33, 130, 210, 0.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(33, 130, 210, 0.06) 1px, transparent 1px);
  background-size: 32px 32px;
}

.admin-content :deep(> *) {
  position: relative;
  z-index: 1;
}

/* Responsive */
@media (max-width: 768px) {
  .admin-header {
    padding: 0 12px;
  }

  .btn-text {
    display: none;
  }

  .system-brief {
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
