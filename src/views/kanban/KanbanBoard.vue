<template>
  <div style="min-height: 100vh; background: #f5f7f9; padding: 20px">
    <n-card>
      <n-space vertical align="center" style="margin-bottom: 24px">
        <n-h2 style="margin: 0">项目看板</n-h2>
        <n-select v-model:value="selectedProjectId" :options="projectOptions" placeholder="请选择项目" style="width: 400px" clearable @update:value="handleProjectChange" />
      </n-space>

      <n-spin :show="loading">
        <template v-if="lifecycleData.length > 0">
          <!-- Vertical Timeline -->
          <div class="timeline-container">
            <div v-for="(phase, idx) in lifecycleData" :key="phase.phase" class="timeline-phase">
              <!-- Phase connector line -->
              <div class="phase-connector" v-if="idx > 0"></div>

              <!-- Phase header -->
              <div class="phase-header">
                <div class="phase-dot" :class="{ 'completed': getPhaseProgress(phase) === 100, 'in-progress': getPhaseProgress(phase) > 0 && getPhaseProgress(phase) < 100 }">
                  <span class="phase-number">{{ idx + 1 }}</span>
                </div>
                <div class="phase-info">
                  <n-h3 style="margin: 0">{{ phase.label }}</n-h3>
                  <n-progress type="line" :percentage="getPhaseProgress(phase)" :show-indicator="true" :status="getPhaseProgress(phase) === 100 ? 'success' : 'default'" style="width: 200px; margin-top: 4px" />
                </div>
              </div>

              <!-- Sub-items -->
              <div class="phase-items">
                <n-card v-for="item in phase.steps" :key="item.id" size="small" style="margin-bottom: 12px; margin-left: 32px">
                  <template #header>
                    <n-space align="center">
                      <span style="font-weight: bold">{{ item.step_name }}</span>
                      <n-tag v-if="getItemProgress(item) === 100" type="success" size="small">已完成</n-tag>
                      <n-tag v-else-if="getItemProgress(item) > 0" type="warning" size="small">进行中</n-tag>
                      <n-tag v-else type="default" size="small">未开始</n-tag>
                    </n-space>
                  </template>

                  <!-- Checks -->
                  <div v-for="check in item.checks" :key="check.id" style="display: flex; align-items: center; gap: 8px; padding: 4px 0">
                    <span v-if="check.is_passed === true" style="color: #18a058; font-size: 18px; font-weight: bold">&#10003;</span>
                    <span v-else-if="check.is_passed === false" style="color: #d03050; font-size: 18px; font-weight: bold">&#10007;</span>
                    <span v-else style="color: #c0c0c0; font-size: 18px">&#9675;</span>
                    <span :style="{ color: check.is_passed === true ? '#18a058' : check.is_passed === false ? '#d03050' : '#666' }">{{ check.check_content }}</span>
                  </div>

                  <!-- Notes -->
                  <div v-if="item.notes" style="margin-top: 8px; padding: 8px; background: #f9f9f9; border-radius: 4px">
                    <div style="color: #999; font-size: 12px; margin-bottom: 4px">备注：</div>
                    <div v-html="item.notes"></div>
                  </div>
                </n-card>
              </div>
            </div>
          </div>
        </template>

        <n-empty v-else-if="!loading && selectedProjectId" description="暂无生命周期数据" />
        <n-empty v-else-if="!loading && !selectedProjectId" description="请选择一个项目" />
      </n-spin>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { NCard, NSelect, NSpace, NH2, NH3, NProgress, NTag, NEmpty, NSpin, useMessage } from 'naive-ui'
import request from '../../utils/request'

const message = useMessage()
const loading = ref(false)
const selectedProjectId = ref<number | null>(null)
const projectOptions = ref<{ label: string; value: number }[]>([])
const lifecycleData = ref<any[]>([])

onMounted(async () => {
  try {
    const res: any = await request.get('/public/projects')
    const list = res.data.list || res.data
    projectOptions.value = list.map((p: any) => ({
      label: `${p.name} (${p.responsible_person || '-'})`,
      value: p.id,
    }))
  } catch (e) {
    // May fail silently on kanban page
  }
})

async function handleProjectChange(id: number | null) {
  if (!id) {
    lifecycleData.value = []
    return
  }
  loading.value = true
  try {
    const res: any = await request.get(`/public/lifecycle/project/${id}`)
    lifecycleData.value = res.data.phases
  } catch (e: any) {
    message.error('加载项目数据失败')
  } finally {
    loading.value = false
  }
}

function getPhaseProgress(phase: any) {
  const allChecks = phase.steps.flatMap((item: any) => item.checks)
  if (allChecks.length === 0) return 0
  const passed = allChecks.filter((c: any) => c.is_passed === true).length
  return Math.round(passed / allChecks.length * 100)
}

function getItemProgress(item: any) {
  if (item.checks.length === 0) return 0
  const passed = item.checks.filter((c: any) => c.is_passed === true).length
  return Math.round(passed / item.checks.length * 100)
}
</script>

<style scoped>
.timeline-container {
  max-width: 800px;
  margin: 0 auto;
}

.timeline-phase {
  position: relative;
  padding-bottom: 24px;
}

.phase-connector {
  position: absolute;
  left: 15px;
  top: -12px;
  width: 2px;
  height: 24px;
  background: #e0e0e0;
}

.phase-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 12px;
}

.phase-dot {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background 0.3s;
}

.phase-dot.completed {
  background: #18a058;
  color: white;
}

.phase-dot.in-progress {
  background: #f0a020;
  color: white;
}

.phase-number {
  font-weight: bold;
  font-size: 14px;
}

.phase-info {
  flex: 1;
}

.phase-items {
  margin-left: 16px;
  padding-left: 16px;
  border-left: 2px solid #e0e0e0;
}
</style>
