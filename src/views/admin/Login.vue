<template>
  <div class="login-page">
    <n-card title="项目管理系统" class="login-card">
      <n-form ref="formRef" :model="formData" :rules="rules">
        <n-form-item path="username" label="账号">
          <n-input v-model:value="formData.username" placeholder="请输入账号" @keyup.enter="handleLogin" />
        </n-form-item>
        <n-form-item path="password" label="密码">
          <n-input v-model:value="formData.password" type="password" show-password-on="click" placeholder="请输入密码" @keyup.enter="handleLogin" />
        </n-form-item>
        <n-button type="primary" block :loading="loading" @click="handleLogin">
          <template #icon>
            <n-icon :component="LogInOutline" />
          </template>
          登录
        </n-button>
      </n-form>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { NCard, NForm, NFormItem, NInput, NButton, NIcon, useMessage } from 'naive-ui'
import { LogInOutline } from '@vicons/ionicons5'
import { useAuthStore } from '../../stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const message = useMessage()
const loading = ref(false)

const formData = reactive({ username: '', password: '' })
const rules = {
  username: { required: true, message: '请输入账号', trigger: 'blur' },
  password: { required: true, message: '请输入密码', trigger: 'blur' },
}

async function handleLogin() {
  if (!formData.username || !formData.password) {
    message.warning('请输入账号和密码')
    return
  }
  loading.value = true
  try {
    await authStore.login(formData.username, formData.password)
    message.success('登录成功')
    router.push('/admin/projects')
  } catch (e: any) {
    // error handled by interceptor
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 24px;
  background:
    linear-gradient(90deg, rgba(238, 245, 255, 0.35), rgba(238, 245, 255, 0.9)),
    url('../../assets/login-bg.svg') center / cover no-repeat;
}

.login-card {
  width: 400px;
  border: 1px solid rgba(255, 255, 255, 0.72);
  box-shadow: 0 18px 48px rgba(34, 74, 138, 0.18);
}
</style>
