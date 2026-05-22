<template>
  <div class="login-page">
    <div class="login-shell">
      <section class="login-hero" aria-label="系统介绍">
        <div class="brand-mark">
          <n-icon size="30" :component="BriefcaseOutline" />
        </div>
        <p class="eyebrow">Project Delivery Workspace</p>
        <h1>中锐教育项目管理系统</h1>
        <p class="hero-copy">项目交付、课程产品、生命周期进展统一管理，让实施过程更清晰、更可控。</p>

        <div class="capability-grid">
          <div class="capability-card">
            <n-icon size="22" :component="GitNetworkOutline" />
            <span>项目生命周期</span>
          </div>
          <div class="capability-card">
            <n-icon size="22" :component="CubeOutline" />
            <span>课程与产品交付</span>
          </div>
          <div class="capability-card">
            <n-icon size="22" :component="StatsChartOutline" />
            <span>进度看板</span>
          </div>
        </div>

        <div class="delivery-flow" aria-hidden="true">
          <div class="flow-step is-active">启动</div>
          <div class="flow-line"></div>
          <div class="flow-step">规划</div>
          <div class="flow-line"></div>
          <div class="flow-step">执行</div>
          <div class="flow-line"></div>
          <div class="flow-step">验收</div>
        </div>
      </section>

      <n-card class="login-card" :bordered="false">
        <div class="login-card-header">
          <div class="login-icon">
            <n-icon size="24" :component="LogInOutline" />
          </div>
          <div>
            <h2>欢迎登录</h2>
            <p>使用管理员账号进入项目管理工作台</p>
          </div>
        </div>

        <n-form ref="formRef" :model="formData" :rules="rules" label-placement="top" class="login-form">
          <n-form-item path="username" label="账号">
            <n-input
              v-model:value="formData.username"
              size="large"
              placeholder="请输入账号"
              @keyup.enter="handleLogin"
            />
          </n-form-item>
          <n-form-item path="password" label="密码">
            <n-input
              v-model:value="formData.password"
              size="large"
              type="password"
              show-password-on="click"
              placeholder="请输入密码"
              @keyup.enter="handleLogin"
            />
          </n-form-item>
          <n-button class="login-submit" type="primary" size="large" block :loading="loading" @click="handleLogin">
            <template #icon>
              <n-icon :component="LogInOutline" />
            </template>
            登录
          </n-button>
        </n-form>
      </n-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { NCard, NForm, NFormItem, NInput, NButton, NIcon, useMessage } from 'naive-ui'
import {
  BriefcaseOutline,
  CubeOutline,
  GitNetworkOutline,
  LogInOutline,
  StatsChartOutline,
} from '@vicons/ionicons5'
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
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 48px;
  overflow: hidden;
  background:
    radial-gradient(circle at 10% 14%, rgba(40, 158, 232, 0.26), transparent 28%),
    radial-gradient(circle at 84% 20%, rgba(35, 213, 214, 0.22), transparent 30%),
    linear-gradient(135deg, rgba(226, 244, 255, 0.9), rgba(248, 253, 255, 0.95) 48%, rgba(230, 248, 250, 0.9)),
    url('../../assets/login-bg.svg') center / cover no-repeat;
}

.login-page::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.56;
  background-image:
    linear-gradient(rgba(26, 122, 205, 0.08) 1px, transparent 1px),
    linear-gradient(90deg, rgba(26, 122, 205, 0.08) 1px, transparent 1px);
  background-size: 36px 36px;
}

.login-page::after {
  content: "";
  position: absolute;
  width: 680px;
  height: 680px;
  right: -220px;
  bottom: -280px;
  pointer-events: none;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(20, 142, 220, 0.16), transparent 62%);
}

.login-shell {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: minmax(0, 1.08fr) minmax(420px, 0.72fr);
  align-items: center;
  gap: 48px;
  width: min(1180px, 100%);
}

.login-hero {
  position: relative;
  min-height: 540px;
  padding: 44px;
  overflow: hidden;
  border: 1px solid rgba(92, 158, 218, 0.2);
  border-radius: 26px;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.78), rgba(226, 245, 255, 0.62)),
    radial-gradient(circle at top right, rgba(31, 158, 231, 0.16), transparent 42%);
  box-shadow: 0 30px 80px rgba(46, 111, 162, 0.16);
  backdrop-filter: blur(18px);
}

.login-hero::before {
  content: "";
  position: absolute;
  inset: auto -80px -120px auto;
  width: 420px;
  height: 300px;
  pointer-events: none;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(22, 119, 210, 0.18), rgba(40, 203, 213, 0.12));
  filter: blur(2px);
}

.brand-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 58px;
  height: 58px;
  margin-bottom: 26px;
  border-radius: 18px;
  color: #0f6fb8;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.95), rgba(219, 241, 255, 0.9));
  box-shadow: 0 18px 40px rgba(35, 123, 195, 0.18);
}

.eyebrow {
  margin: 0 0 12px;
  font-size: 13px;
  font-weight: 700;
  color: #1677d2;
  text-transform: uppercase;
  letter-spacing: 0;
}

.login-hero h1 {
  max-width: 620px;
  margin: 0;
  font-size: 44px;
  line-height: 1.14;
  font-weight: 800;
  color: #102849;
  letter-spacing: 0;
}

.hero-copy {
  max-width: 560px;
  margin: 20px 0 0;
  font-size: 17px;
  line-height: 1.8;
  color: #4f6380;
}

.capability-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  max-width: 650px;
  margin-top: 34px;
}

.capability-card {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 70px;
  padding: 14px;
  border: 1px solid rgba(80, 154, 218, 0.2);
  border-radius: 16px;
  color: #16466f;
  background: rgba(255, 255, 255, 0.64);
  box-shadow: 0 12px 30px rgba(46, 111, 162, 0.08);
}

.capability-card .n-icon {
  flex-shrink: 0;
  color: #1287d4;
}

.capability-card span {
  font-size: 14px;
  font-weight: 700;
}

.delivery-flow {
  display: flex;
  align-items: center;
  max-width: 600px;
  margin-top: 44px;
}

.flow-step {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 58px;
  height: 34px;
  padding: 0 12px;
  border: 1px solid rgba(31, 129, 210, 0.22);
  border-radius: 999px;
  font-size: 13px;
  font-weight: 700;
  color: #45627f;
  background: rgba(255, 255, 255, 0.72);
}

.flow-step.is-active {
  color: #fff;
  border-color: transparent;
  background: linear-gradient(135deg, #1677d2, #20bfd0);
  box-shadow: 0 12px 26px rgba(22, 119, 210, 0.24);
}

.flow-line {
  flex: 1;
  height: 2px;
  min-width: 28px;
  background: linear-gradient(90deg, rgba(22, 119, 210, 0.34), rgba(32, 191, 208, 0.16));
}

.login-card {
  position: relative;
  width: 100%;
  min-height: 500px;
  overflow: hidden;
  border: 1px solid rgba(84, 151, 205, 0.26);
  border-radius: 24px;
  background:
    linear-gradient(150deg, rgba(255, 255, 255, 0.92), rgba(235, 248, 255, 0.78)),
    radial-gradient(circle at top right, rgba(38, 171, 232, 0.14), transparent 48%);
  box-shadow: 0 30px 80px rgba(38, 94, 145, 0.2);
  backdrop-filter: blur(20px);
}

.login-card::before {
  content: "";
  position: absolute;
  inset: 0;
  height: 5px;
  pointer-events: none;
  background: linear-gradient(90deg, #1677d2, #24c6dc, rgba(255, 255, 255, 0));
}

.login-card :deep(.n-card__content) {
  padding: 42px;
}

.login-card-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 34px;
}

.login-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  border-radius: 16px;
  color: #fff;
  background: linear-gradient(135deg, #1677d2, #1fc1ce);
  box-shadow: 0 16px 34px rgba(22, 119, 210, 0.26);
}

.login-card h2 {
  margin: 0;
  font-size: 28px;
  line-height: 1.2;
  font-weight: 800;
  color: #102849;
}

.login-card p {
  margin: 7px 0 0;
  font-size: 14px;
  color: #62758f;
}

.login-form :deep(.n-form-item-label) {
  font-weight: 700;
  color: #213a5c;
}

.login-form :deep(.n-input) {
  min-height: 46px;
  border-radius: 10px;
}

.login-form :deep(.n-input-wrapper) {
  padding-inline: 14px;
}

.login-submit {
  height: 46px;
  margin-top: 10px;
  border-radius: 12px;
  font-weight: 700;
  box-shadow: 0 14px 28px rgba(22, 119, 210, 0.22);
}

@media (max-width: 980px) {
  .login-page {
    padding: 28px;
    align-items: flex-start;
  }

  .login-shell {
    grid-template-columns: 1fr;
    gap: 22px;
  }

  .login-hero {
    min-height: auto;
    padding: 32px;
  }

  .login-hero h1 {
    font-size: 34px;
  }

  .login-card {
    max-width: 520px;
    margin: 0 auto;
  }
}

@media (max-width: 640px) {
  .login-page {
    padding: 18px;
  }

  .login-hero {
    padding: 24px;
    border-radius: 20px;
  }

  .brand-mark {
    width: 50px;
    height: 50px;
    margin-bottom: 18px;
  }

  .login-hero h1 {
    font-size: 28px;
  }

  .hero-copy {
    font-size: 15px;
  }

  .capability-grid {
    grid-template-columns: 1fr;
    margin-top: 24px;
  }

  .delivery-flow {
    display: none;
  }

  .login-card {
    min-height: auto;
    border-radius: 20px;
  }

  .login-card :deep(.n-card__content) {
    padding: 28px 22px;
  }

  .login-card-header {
    align-items: flex-start;
    margin-bottom: 24px;
  }

  .login-card h2 {
    font-size: 24px;
  }
}
</style>
