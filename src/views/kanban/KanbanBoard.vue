<template>
  <div class="kanban-page">
    <!-- Header -->
    <div class="kanban-header">
      <div class="kanban-header-inner">
        <n-space align="center" :size="12">
          <n-icon size="28" color="#2080f0" :component="GridOutline" />
          <n-h2 style="margin: 0; font-weight: 700">项目看板</n-h2>
        </n-space>
        <n-select
          v-model:value="selectedProjectId"
          :options="projectOptions"
          placeholder="请选择项目"
          style="width: 320px"
          clearable
          size="large"
          @update:value="handleProjectChange"
        />
      </div>
    </div>

    <!-- Content -->
    <div class="kanban-content">
      <n-spin :show="loading">
        <template v-if="selectedProjectId && projectDetail">
          <!-- Project Title Bar -->
          <div class="project-title-bar">
            <n-space align="center" :size="12">
              <n-icon size="22" :component="FolderOpenOutline" color="#2080f0" />
              <span class="project-title">{{ projectDetail.project.name }}</span>
              <n-tag v-if="projectDetail.project.is_kvm" type="info" size="small" round>KVM</n-tag>
              <n-tag v-if="projectDetail.project.is_eve" type="warning" size="small" round>EVE</n-tag>
              <n-tag size="small" round>
                {{ projectDetail.project.deploy_method === 'centralized' ? '集中式' : '分布式' }}
              </n-tag>
            </n-space>
            <n-tag
              :type="overallProgress === 100 ? 'success' : overallProgress > 0 ? 'warning' : 'default'"
              size="medium"
              round
            >
              整体进度 {{ overallProgress }}%
            </n-tag>
          </div>

          <!-- Vertical Tabs -->
          <n-tabs
            v-model:value="activeTab"
            type="line"
            placement="left"
            class="kanban-tabs"
            animated
          >
            <!-- Tab 1: 基本信息 -->
            <n-tab-pane name="basic" tab="基本信息">
              <div class="tab-panel">
                <n-h3 prefix="bar" align-text>项目基本信息</n-h3>
                <n-descriptions bordered :column="2" label-placement="left">
                  <n-descriptions-item label="项目名称">
                    {{ projectDetail.project.name || '-' }}
                  </n-descriptions-item>
                  <n-descriptions-item label="部署方式">
                    {{ projectDetail.project.deploy_method === 'centralized' ? '集中式' : '分布式' }}
                  </n-descriptions-item>
                  <n-descriptions-item label="负责人">
                    <n-space align="center" :size="4">
                      <n-icon size="14" :component="PersonOutline" />
                      {{ projectDetail.project.responsible_person || '-' }}
                    </n-space>
                  </n-descriptions-item>
                  <n-descriptions-item label="售后人员">
                    <n-space align="center" :size="4">
                      <n-icon size="14" :component="HeadsetOutline" />
                      {{ projectDetail.project.after_sales_person || '-' }}
                    </n-space>
                  </n-descriptions-item>
                  <n-descriptions-item label="EVE实验">
                    <n-tag :type="projectDetail.project.is_eve ? 'success' : 'default'" size="small" round>
                      {{ projectDetail.project.is_eve ? '是' : '否' }}
                    </n-tag>
                  </n-descriptions-item>
                  <n-descriptions-item label="KVM实验">
                    <n-tag :type="projectDetail.project.is_kvm ? 'success' : 'default'" size="small" round>
                      {{ projectDetail.project.is_kvm ? '是' : '否' }}
                    </n-tag>
                  </n-descriptions-item>
                  <n-descriptions-item label="交付开始">
                    <n-space align="center" :size="4">
                      <n-icon size="14" :component="CalendarOutline" />
                      {{ projectDetail.project.delivery_start_date || '-' }}
                    </n-space>
                  </n-descriptions-item>
                  <n-descriptions-item label="交付截止">
                    <n-space align="center" :size="4">
                      <n-icon size="14" :component="CalendarOutline" />
                      {{ projectDetail.project.delivery_end_date || '-' }}
                    </n-space>
                  </n-descriptions-item>
                </n-descriptions>

                <div class="stats-cards">
                  <n-grid :cols="2" :x-gap="16" :y-gap="16">
                    <n-grid-item>
                      <n-card class="stat-card" size="small">
                        <n-space align="center" :size="8">
                          <n-icon size="24" :component="CubeOutline" color="#2080f0" />
                          <div>
                            <div class="stat-value">{{ projectDetail.products?.length || 0 }}</div>
                            <div class="stat-label">交付产品</div>
                          </div>
                        </n-space>
                      </n-card>
                    </n-grid-item>
                    <n-grid-item>
                      <n-card class="stat-card" size="small">
                        <n-space align="center" :size="8">
                          <n-icon size="24" :component="SchoolOutline" color="#18a058" />
                          <div>
                            <div class="stat-value">{{ projectDetail.courses?.length || 0 }}</div>
                            <div class="stat-label">交付课程</div>
                          </div>
                        </n-space>
                      </n-card>
                    </n-grid-item>
                  </n-grid>
                </div>
              </div>
            </n-tab-pane>

            <!-- Tab 2: 交付产品 -->
            <n-tab-pane name="products" tab="交付产品">
              <div class="tab-panel">
                <n-h3 prefix="bar" align-text>交付产品清单</n-h3>
                <n-space vertical :size="12">
                  <n-card
                    v-for="product in projectDetail.products"
                    :key="product.id"
                    size="small"
                    class="detail-card"
                  >
                    <template #header>
                      <n-space align="center" :size="8">
                        <n-icon size="18" :component="CubeOutline" color="#2080f0" />
                        <span class="detail-title">{{ product.name }}</span>
                      </n-space>
                    </template>
                    <n-descriptions
                      class="detail-descriptions"
                      :column="1"
                      label-placement="left"
                      size="small"
                    >
                      <n-descriptions-item label="安装包位置">
                        {{ product.install_path || '-' }}
                      </n-descriptions-item>
                      <n-descriptions-item label="安装手册">
                        {{ product.install_manual_path || '-' }}
                      </n-descriptions-item>
                      <n-descriptions-item label="使用手册">
                        {{ product.usage_manual_path || '-' }}
                      </n-descriptions-item>
                      <n-descriptions-item label="验收参数">
                        {{ product.verification_path || '-' }}
                      </n-descriptions-item>
                    </n-descriptions>
                  </n-card>
                  <n-empty v-if="!projectDetail.products?.length" description="无关联产品" />
                </n-space>
              </div>
            </n-tab-pane>

            <!-- Tab 3: 交付课程 -->
            <n-tab-pane name="courses" tab="交付课程">
              <div class="tab-panel">
                <n-h3 prefix="bar" align-text>交付课程清单</n-h3>
                <n-space vertical :size="12">
                  <n-card
                    v-for="course in projectDetail.courses"
                    :key="course.id"
                    size="small"
                    class="detail-card"
                  >
                    <template #header>
                      <n-space align="center" :size="8">
                        <n-icon size="18" :component="SchoolOutline" color="#18a058" />
                        <span class="detail-title">{{ course.name }}</span>
                        <n-space :size="4">
                          <n-tag
                            v-for="t in parseTypes(course.experiment_type)"
                            :key="t"
                            :type="typeColorMap[t] as any"
                            size="tiny"
                            round
                          >
                            {{ typeMap[t] || t }}
                          </n-tag>
                        </n-space>
                      </n-space>
                    </template>
                    <n-descriptions
                      class="detail-descriptions"
                      :column="1"
                      label-placement="left"
                      size="small"
                    >
                      <n-descriptions-item label="实验镜像">
                        {{ course.experiment_image || '-' }}
                      </n-descriptions-item>
                      <n-descriptions-item label="说明">
                        {{ course.description || '-' }}
                      </n-descriptions-item>
                    </n-descriptions>
                  </n-card>
                  <n-empty v-if="!projectDetail.courses?.length" description="无关联课程" />
                </n-space>
              </div>
            </n-tab-pane>

            <!-- Tab 4: 项目进展 -->
            <n-tab-pane name="progress" tab="项目进展">
              <div class="tab-panel">
                <n-h3 prefix="bar" align-text>项目生命周期进展</n-h3>

                <template v-if="lifecycleData.length > 0">
                  <div class="timeline-wrapper">
                    <div
                      v-for="(phase, idx) in lifecycleData"
                      :key="phase.phase"
                      class="timeline-phase"
                      :class="{ 'is-last': idx === lifecycleData.length - 1 }"
                    >
                      <!-- Phase Header -->
                      <div class="phase-header">
                        <div class="phase-marker">
                          <div
                            class="phase-dot"
                            :class="{
                              'is-completed': getPhaseProgress(phase) === 100,
                              'is-in-progress': getPhaseProgress(phase) > 0 && getPhaseProgress(phase) < 100,
                            }"
                          >
                            <n-icon v-if="getPhaseProgress(phase) === 100" size="18" :component="CheckmarkOutline" />
                            <span v-else class="phase-number">{{ idx + 1 }}</span>
                          </div>
                          <div
                            v-if="idx < lifecycleData.length - 1"
                            class="phase-line"
                            :class="{ 'is-active': getPhaseProgress(phase) === 100 }"
                          />
                        </div>

                        <div class="phase-info">
                          <div class="phase-title-row">
                            <span class="phase-title">{{ phase.label }}</span>
                            <n-tag
                              :type="getPhaseProgress(phase) === 100 ? 'success' : getPhaseProgress(phase) > 0 ? 'warning' : 'default'"
                              size="small"
                              round
                            >
                              {{ getPhasePassedCount(phase) }}/{{ getPhaseTotalCount(phase) }}
                            </n-tag>
                          </div>
                          <n-progress
                            type="line"
                            :percentage="getPhaseProgress(phase)"
                            :show-indicator="false"
                            :status="getPhaseProgress(phase) === 100 ? 'success' : 'default'"
                            :height="6"
                            style="margin-top: 6px; max-width: 200px"
                          />
                        </div>
                      </div>

                      <!-- Phase Items -->
                      <div class="phase-items">
                        <n-card
                          v-for="item in phase.steps"
                          :key="item.id"
                          size="small"
                          class="step-card"
                          :class="{ 'is-completed': getItemProgress(item) === 100 }"
                        >
                          <template #header>
                            <n-space align="center" :size="8">
                              <n-icon
                                size="16"
                                :component="getItemProgress(item) === 100 ? CheckmarkCircleOutline : getItemProgress(item) > 0 ? TimeOutline : EllipseOutline"
                                :color="getItemProgress(item) === 100 ? '#18a058' : getItemProgress(item) > 0 ? '#f0a020' : '#c0c4cc'"
                              />
                              <span class="step-name">{{ item.step_name }}</span>
                              <n-tag
                                v-if="getItemProgress(item) === 100"
                                type="success"
                                size="tiny"
                                round
                              >
                                已完成
                              </n-tag>
                              <n-tag v-else-if="getItemProgress(item) > 0" type="warning" size="tiny" round>
                                {{ getItemProgress(item) }}%
                              </n-tag>
                            </n-space>
                          </template>

                          <!-- Checks -->
                          <div class="checklist">
                            <div
                              v-for="check in item.checks"
                              :key="check.id"
                              class="check-item"
                              :class="{
                                'is-passed': check.is_passed === true,
                                'is-failed': check.is_passed === false,
                                'is-pending': check.is_passed === null,
                              }"
                            >
                              <div class="check-icon" aria-hidden="true">
                                <n-icon
                                  v-if="check.is_passed === true"
                                  size="14"
                                  :component="CheckmarkCircleOutline"
                                  color="#18a058"
                                />
                                <n-icon
                                  v-else-if="check.is_passed === false"
                                  size="14"
                                  :component="CloseCircleOutline"
                                  color="#d03050"
                                />
                                <n-icon v-else size="14" :component="EllipseOutline" color="#c0c4cc" />
                              </div>
                              <span class="check-text">{{ check.check_content }}</span>
                            </div>
                          </div>

                          <!-- Notes -->
                          <div v-if="item.notes" class="notes-section">
                            <n-divider style="margin: 12px 0" />
                            <div class="notes-content" v-html="item.notes" />
                          </div>
                        </n-card>
                      </div>
                    </div>
                  </div>
                </template>

                <n-empty v-else description="暂无生命周期数据" />
              </div>
            </n-tab-pane>
          </n-tabs>
        </template>

        <n-empty v-else-if="!loading && !selectedProjectId" description="请选择一个项目查看详情" />
      </n-spin>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  NCard, NSelect, NSpace, NH2, NH3, NProgress, NTag, NEmpty, NSpin,
  NIcon, NDivider, NDescriptions, NDescriptionsItem, NTabs, NTabPane,
  NGrid, NGridItem,
} from 'naive-ui'
import {
  CheckmarkOutline, CheckmarkCircleOutline, CloseCircleOutline,
  EllipseOutline, TimeOutline, GridOutline, FolderOpenOutline,
  PersonOutline, HeadsetOutline, CalendarOutline, CubeOutline, SchoolOutline,
} from '@vicons/ionicons5'
import request from '../../utils/request'

const loading = ref(false)
const selectedProjectId = ref<number | null>(null)
const projectOptions = ref<{ label: string; value: number }[]>([])
const projectDetail = ref<any>(null)
const lifecycleData = ref<any[]>([])
const activeTab = ref('basic')

const typeMap: Record<string, string> = {
  hardware_rack: '硬件机架',
  kvm: 'KVM虚拟机',
  eve: 'EVE模拟器',
}
const typeColorMap: Record<string, string> = {
  hardware_rack: 'success',
  kvm: 'info',
  eve: 'warning',
}

function parseTypes(val: string | string[]): string[] {
  if (Array.isArray(val)) return val
  if (!val) return []
  return val.split(',').map((s: string) => s.trim()).filter(Boolean)
}

onMounted(async () => {
  try {
    const res: any = await request.get('/public/projects')
    const list = res.data.list || res.data
    projectOptions.value = list.map((p: any) => ({
      label: `${p.name} (${p.responsible_person || '-'})`,
      value: p.id,
    }))
  } catch {
    // May fail silently
  }
})

async function handleProjectChange(id: number | null) {
  if (!id) {
    projectDetail.value = null
    lifecycleData.value = []
    activeTab.value = 'basic'
    return
  }

  loading.value = true
  try {
    // Fetch project detail and lifecycle in parallel
    const [detailRes, lifecycleRes]: any[] = await Promise.all([
      request.get(`/public/projects/${id}`),
      request.get(`/public/lifecycle/project/${id}`),
    ])

    projectDetail.value = detailRes.data
    lifecycleData.value = lifecycleRes.data.phases || []
    activeTab.value = 'basic'
  } catch {
    // error handled by interceptor
  } finally {
    loading.value = false
  }
}

// Progress calculations
function getPhaseProgress(phase: any) {
  const allChecks = phase.steps.flatMap((item: any) => item.checks)
  if (allChecks.length === 0) return 0
  const passed = allChecks.filter((c: any) => c.is_passed === true).length
  return Math.round((passed / allChecks.length) * 100)
}

function getPhasePassedCount(phase: any) {
  const allChecks = phase.steps.flatMap((item: any) => item.checks)
  return allChecks.filter((c: any) => c.is_passed === true).length
}

function getPhaseTotalCount(phase: any) {
  const allChecks = phase.steps.flatMap((item: any) => item.checks)
  return allChecks.length
}

function getItemProgress(item: any) {
  if (!item.checks || item.checks.length === 0) return 0
  const passed = item.checks.filter((c: any) => c.is_passed === true).length
  return Math.round((passed / item.checks.length) * 100)
}

const overallProgress = computed(() => {
  let total = 0
  let passed = 0
  lifecycleData.value.forEach((phase: any) => {
    phase.steps.forEach((item: any) => {
      if (item.checks) {
        total += item.checks.length
        passed += item.checks.filter((c: any) => c.is_passed === true).length
      }
    })
  })
  return total === 0 ? 0 : Math.round((passed / total) * 100)
})
</script>

<style scoped>
.kanban-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #f0f5ff 0%, #f5f7fa 100%);
}

.kanban-header {
  background: #fff;
  border-bottom: 1px solid #e8e8e8;
  padding: 20px 24px;
  position: sticky;
  top: 0;
  z-index: 10;
}

.kanban-header-inner {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
}

.kanban-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 16px;
}

/* Project Title Bar */
.project-title-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e8e8e8;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;
}

.project-title {
  font-size: 18px;
  font-weight: 700;
  color: #1a1a1a;
}

/* Vertical Tabs */
.kanban-tabs {
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e8e8e8;
  min-height: 600px;
}

.kanban-tabs :deep(.n-tabs-nav.n-tabs-nav--left-type) {
  background: #fafbfc;
  border-right: 1px solid #e8e8e8;
  border-radius: 8px 0 0 8px;
  min-width: 140px;
}

.kanban-tabs :deep(.n-tabs-pad) {
  border-bottom: none;
}

.tab-panel {
  padding: 4px 8px 16px;
}

/* Stats Cards */
.stats-cards {
  margin-top: 20px;
}

.stat-card {
  transition: box-shadow 0.2s ease;
}

.stat-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #333;
  line-height: 1.2;
}

.stat-label {
  font-size: 13px;
  color: #888;
  margin-top: 2px;
}

/* Detail Cards */
.detail-card {
  transition: box-shadow 0.2s ease, border-color 0.2s ease;
}

.detail-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
}

.detail-title {
  font-weight: 600;
  font-size: 15px;
}

.detail-descriptions :deep(.n-descriptions-table-header),
.detail-descriptions :deep(.n-descriptions-table-header__content) {
  width: 100px;
  white-space: nowrap;
}

/* Timeline (same as before) */
.timeline-wrapper {
  position: relative;
}

.timeline-phase {
  position: relative;
  padding-bottom: 24px;
}

.timeline-phase.is-last {
  padding-bottom: 0;
}

.phase-header {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 12px;
}

.phase-marker {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
}

.phase-dot {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #e8e8e8;
  color: #8c8c8c;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background 0.3s ease, color 0.3s ease, box-shadow 0.3s ease;
}

.phase-dot.is-completed {
  background: #18a058;
  color: #fff;
  box-shadow: 0 0 0 3px rgba(24, 160, 88, 0.12);
}

.phase-dot.is-in-progress {
  background: #f0a020;
  color: #fff;
  box-shadow: 0 0 0 3px rgba(240, 160, 32, 0.12);
}

.phase-number {
  font-weight: 700;
  font-size: 13px;
}

.phase-line {
  width: 2px;
  flex: 1;
  min-height: 24px;
  background: #e0e0e0;
  margin: 4px 0;
  transition: background 0.3s ease;
}

.phase-line.is-active {
  background: #18a058;
}

.phase-info {
  flex: 1;
  padding-top: 4px;
}

.phase-title-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.phase-title {
  font-weight: 600;
  font-size: 16px;
}

.phase-items {
  margin-left: 15px;
  padding-left: 32px;
  border-left: 2px solid #e0e0e0;
}

.timeline-phase.is-last .phase-items {
  border-left-color: transparent;
}

/* Step Card */
.step-card {
  margin-bottom: 10px;
  transition: box-shadow 0.2s ease, border-color 0.2s ease;
}

.step-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.step-card.is-completed {
  border-color: rgba(24, 160, 88, 0.2);
}

.step-name {
  font-weight: 600;
  font-size: 14px;
}

/* Checklist */
.checklist {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.check-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 4px 6px;
  border-radius: 6px;
  transition: background 0.15s ease;
}

.check-item:hover {
  background: #f5f7fa;
}

.check-icon {
  flex-shrink: 0;
  margin-top: 2px;
}

.check-text {
  font-size: 13px;
  line-height: 1.6;
  color: #333;
}

.check-item.is-passed .check-text {
  color: #18a058;
}

.check-item.is-failed .check-text {
  color: #d03050;
}

.check-item.is-pending .check-text {
  color: #666;
}

/* Notes */
.notes-section {
  margin-top: 4px;
}

.notes-content {
  font-size: 13px;
  line-height: 1.7;
  color: #555;
  background: #f8f9fc;
  border-radius: 6px;
  padding: 10px 12px;
  border-left: 3px solid #2080f0;
}

.notes-content :deep(p) {
  margin: 0 0 6px;
}

.notes-content :deep(p:last-child) {
  margin-bottom: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .kanban-header-inner {
    flex-direction: column;
    align-items: flex-start;
  }

  .kanban-content {
    padding: 12px;
  }

  .kanban-tabs :deep(.n-tabs-nav.n-tabs-nav--left-type) {
    min-width: 100px;
  }

  .tab-panel {
    padding: 8px 12px 16px;
  }

  .project-title-bar {
    padding: 12px 16px;
  }
}

@media (max-width: 640px) {
  .kanban-tabs :deep(.n-tabs-nav.n-tabs-nav--left-type) {
    min-width: 80px;
  }

  .kanban-tabs :deep(.n-tabs-tab) {
    padding: 8px 10px;
    font-size: 13px;
  }

  .phase-items {
    margin-left: 12px;
    padding-left: 22px;
  }
}
</style>