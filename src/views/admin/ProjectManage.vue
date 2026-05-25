<template>
  <div class="project-page">
    <!-- Page Header -->
    <div class="page-header">
      <n-space align="center" :size="8">
        <n-icon size="22" color="#2080f0" :component="FolderOpenOutline" />
        <span class="page-title">项目管理</span>
      </n-space>
      <n-button type="primary" size="medium" @click="openCreateModal">
        <template #icon>
          <n-icon :component="AddOutline" />
        </template>
        新增项目
      </n-button>
    </div>

    <!-- Toolbar -->
    <n-space justify="space-between" class="toolbar">
      <n-input
        v-model:value="keyword"
        placeholder="搜索项目名称"
        clearable
        style="width: 300px"
        @update:value="handleSearch"
      >
        <template #prefix>
          <n-icon :component="SearchOutline" />
        </template>
      </n-input>
    </n-space>

    <!-- Card Grid -->
    <n-grid
      class="project-grid"
      :cols="gridCols"
      :x-gap="16"
      :y-gap="16"
      responsive="screen"
    >
      <n-grid-item v-for="project in projects" :key="project.id">
        <n-card class="project-card" size="small" hoverable :bordered="false">
          <template #header>
            <n-space align="center" justify="space-between" style="width: 100%">
              <span class="project-name">{{ project.name }}</span>
              <n-space :size="4">
                <n-tag v-if="project.is_kvm" type="info" size="small" round>KVM</n-tag>
                <n-tag v-if="project.is_eve" type="warning" size="small" round>EVE</n-tag>
              </n-space>
            </n-space>
          </template>

          <n-space vertical :size="10">
            <div class="project-meta">
              <n-icon size="14" :component="PersonOutline" class="meta-icon" />
              <span>负责人：{{ project.responsible_person || '-' }}</span>
            </div>
            <div class="project-meta">
              <n-icon size="14" :component="HeadsetOutline" class="meta-icon" />
              <span>售后：{{ project.after_sales_person || '-' }}</span>
            </div>
            <div class="project-meta">
              <n-icon size="14" :component="CalendarOutline" class="meta-icon" />
              <span>{{ project.delivery_start_date || '-' }} ~ {{ project.delivery_end_date || '-' }}</span>
            </div>

            <div class="project-stats">
              <n-space :size="16">
                <span class="stat-item"><strong>{{ project.product_count || 0 }}</strong> 产品</span>
                <span class="stat-item"><strong>{{ project.course_count || 0 }}</strong> 课程</span>
              </n-space>
            </div>

            <n-progress
              type="line"
              :percentage="project.progress || 0"
              :show-indicator="true"
              :status="(project.progress || 0) === 100 ? 'success' : 'default'"
              :height="6"
            />

            <div class="project-footer">
              <n-space align="center" justify="space-between" style="width: 100%">
                <n-tag :type="phaseTagType(project.current_phase)" size="small" round>
                  {{ formatPhaseLabel(project.current_phase) }}
                </n-tag>
                <span class="project-date">{{ formatShortDate(project.created_at) }}</span>
              </n-space>
            </div>
          </n-space>

          <template #action>
            <n-space justify="end" :size="4">
              <n-button size="small" quaternary @click="showSummary(project.id)">
                <template #icon>
                  <n-icon :component="DocumentTextOutline" />
                </template>
                简介
              </n-button>
              <n-button size="small" quaternary type="info" @click="handleProgress(project)">
                <template #icon>
                  <n-icon :component="TrendingUpOutline" />
                </template>
                进展
              </n-button>
              <n-button size="small" quaternary @click="openEditModal(project)">
                <template #icon>
                  <n-icon :component="CreateOutline" />
                </template>
                编辑
              </n-button>
              <n-button size="small" quaternary type="error" @click="handleDelete(project)">
                <template #icon>
                  <n-icon :component="TrashOutline" />
                </template>
                删除
              </n-button>
            </n-space>
          </template>
        </n-card>
      </n-grid-item>
    </n-grid>

    <n-empty v-if="projects.length === 0 && !loading" description="暂无项目，点击右上角新增" />

    <!-- Pagination -->
    <n-space v-if="projects.length > 0" justify="center" style="margin-top: 24px">
      <n-pagination
        v-model:page="projectPagination.page"
        v-model:page-size="projectPagination.pageSize"
        :item-count="projectPagination.itemCount"
        :page-sizes="projectPagination.pageSizes"
        :prefix="projectPagination.prefix"
        show-size-picker
        show-quick-jumper
        @update:page="handleProjectPageChange"
        @update:page-size="handleProjectPageSizeChange"
      />
    </n-space>

    <!-- Create/Edit Modal -->
    <n-modal
      v-model:show="showFormModal"
      :title="editingId ? '编辑项目' : '新增项目'"
      preset="card"
      style="width: 700px; max-width: 90vw"
      :segmented="{ content: true }"
    >
      <n-form
        ref="formRef"
        :model="formData"
        label-placement="left"
        label-width="100"
        :rules="formRules"
      >
        <n-form-item label="项目名称" path="name">
          <n-input v-model:value="formData.name" placeholder="请输入项目名称" />
        </n-form-item>
        <n-form-item label="引用项目模版">
          <n-select
            v-model:value="formData.template_project_id"
            :options="templateProjectOptions"
            :placeholder="editingId ? (formData.template_project_id ? '' : '未引用模版') : '可选，选择已有项目作为进展模版'"
            :disabled="!!editingId"
            clearable
            filterable
          />
        </n-form-item>
        <n-form-item label="所需产品">
          <n-select
            v-model:value="formData.product_ids"
            multiple
            :options="productOptions"
            placeholder="选择产品"
            clearable
          />
        </n-form-item>
        <n-form-item label="所需课程">
          <n-select
            v-model:value="formData.course_ids"
            multiple
            :options="courseOptions"
            placeholder="选择课程"
            clearable
          />
        </n-form-item>
        <n-grid :cols="2" :x-gap="12">
          <n-grid-item>
            <n-form-item label="EVE实验">
              <n-switch v-model:value="formData.is_eve" />
            </n-form-item>
          </n-grid-item>
          <n-grid-item>
            <n-form-item label="KVM实验">
              <n-switch v-model:value="formData.is_kvm" />
            </n-form-item>
          </n-grid-item>
        </n-grid>
        <n-form-item v-if="formData.is_eve || formData.is_kvm" label="部署方式">
          <n-select
            v-model:value="formData.deploy_method"
            :options="[
              { label: '集中式', value: 'centralized' },
              { label: '分布式', value: 'distributed' },
            ]"
          />
        </n-form-item>
        <n-grid :cols="2" :x-gap="12">
          <n-grid-item>
            <n-form-item label="负责人">
              <n-input v-model:value="formData.responsible_person" placeholder="负责人姓名" />
            </n-form-item>
          </n-grid-item>
          <n-grid-item>
            <n-form-item label="售后人员">
              <n-input v-model:value="formData.after_sales_person" placeholder="售后人员姓名" />
            </n-form-item>
          </n-grid-item>
        </n-grid>
        <n-grid :cols="2" :x-gap="12">
          <n-grid-item>
            <n-form-item label="开始时间">
              <n-date-picker
                v-model:value="formData.delivery_start_date"
                type="date"
                style="width: 100%"
                placeholder="选择开始日期"
              />
            </n-form-item>
          </n-grid-item>
          <n-grid-item>
            <n-form-item label="截止时间">
              <n-date-picker
                v-model:value="formData.delivery_end_date"
                type="date"
                style="width: 100%"
                placeholder="选择截止日期"
              />
            </n-form-item>
          </n-grid-item>
        </n-grid>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showFormModal = false">取消</n-button>
          <n-button type="primary" :loading="submitting" @click="handleFormSubmit">确认</n-button>
        </n-space>
      </template>
    </n-modal>

    <!-- Summary Modal -->
    <n-modal
      v-model:show="showSummaryModal"
      title="项目简介"
      preset="card"
      style="width: 800px; max-width: 92vw; max-height: 85vh"
      :content-style="{ overflowY: 'auto' }"
      :segmented="{ content: true }"
    >
      <template v-if="summaryData">
        <n-tabs type="line" animated>
          <n-tab-pane name="basic" tab="基本信息">
            <n-descriptions bordered :column="2" label-placement="left">
              <n-descriptions-item label="项目名称">{{ summaryData.name || '-' }}</n-descriptions-item>
              <n-descriptions-item label="部署方式">
                {{ summaryData.deploy_method === 'centralized' ? '集中式' : '分布式' }}
              </n-descriptions-item>
              <n-descriptions-item label="负责人">{{ summaryData.responsible_person || '-' }}</n-descriptions-item>
              <n-descriptions-item label="售后人员">{{ summaryData.after_sales_person || '-' }}</n-descriptions-item>
              <n-descriptions-item label="EVE实验">{{ summaryData.is_eve ? '是' : '否' }}</n-descriptions-item>
              <n-descriptions-item label="KVM实验">{{ summaryData.is_kvm ? '是' : '否' }}</n-descriptions-item>
              <n-descriptions-item label="交付开始">{{ summaryData.delivery_start_date || '-' }}</n-descriptions-item>
              <n-descriptions-item label="交付截止">{{ summaryData.delivery_end_date || '-' }}</n-descriptions-item>
            </n-descriptions>
          </n-tab-pane>

          <n-tab-pane name="products" tab="交付产品">
            <n-space vertical :size="12">
              <n-card
                v-for="product in summaryData.products"
                :key="product.name"
                size="small"
                class="detail-card"
              >
                <n-descriptions
                  class="summary-detail-descriptions"
                  bordered
                  :column="1"
                  label-placement="left"
                >
                  <n-descriptions-item label="产品名称">{{ product.name }}</n-descriptions-item>
                  <n-descriptions-item label="安装包位置">{{ product.install_path }}</n-descriptions-item>
                  <n-descriptions-item label="安装手册位置">{{ product.install_manual_path }}</n-descriptions-item>
                  <n-descriptions-item label="使用手册位置">{{ product.usage_manual_path }}</n-descriptions-item>
                  <n-descriptions-item label="验收参数位置">{{ product.verification_path }}</n-descriptions-item>
                </n-descriptions>
              </n-card>
              <n-empty v-if="!summaryData.products?.length" description="无关联产品" />
            </n-space>
          </n-tab-pane>

          <n-tab-pane name="courses" tab="交付课程">
            <n-space vertical :size="12">
              <n-card
                v-for="course in summaryData.courses"
                :key="course.name"
                size="small"
                class="detail-card"
              >
                <n-descriptions
                  class="summary-detail-descriptions"
                  bordered
                  :column="1"
                  label-placement="left"
                >
                  <n-descriptions-item label="课程名称">{{ course.name }}</n-descriptions-item>
                  <n-descriptions-item label="实验类型">{{ formatExperimentType(course.experiment_type) }}</n-descriptions-item>
                  <n-descriptions-item label="实验镜像">{{ course.experiment_image }}</n-descriptions-item>
                  <n-descriptions-item label="说明">{{ course.description }}</n-descriptions-item>
                </n-descriptions>
              </n-card>
              <n-empty v-if="!summaryData.courses?.length" description="无关联课程" />
            </n-space>
          </n-tab-pane>
        </n-tabs>
      </template>
    </n-modal>

    <!-- Lifecycle Dialog -->
    <LifecycleDialog v-model:visible="showLifecycleDialog" :project-id="selectedProjectId" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import {
  NCard, NGrid, NGridItem, NSpace, NButton, NTag, NProgress, NModal,
  NForm, NFormItem, NInput, NSelect, NSwitch, NDatePicker, NDescriptions,
  NDescriptionsItem, NEmpty, NPagination, NIcon, NTabs, NTabPane,
  useMessage, useDialog, type FormInst,
} from 'naive-ui'
import {
  AddOutline, CreateOutline, DocumentTextOutline, TrashOutline,
  TrendingUpOutline, FolderOpenOutline, PersonOutline, CalendarOutline, SearchOutline,
  HeadsetOutline,
} from '@vicons/ionicons5'
import request from '../../utils/request'
import LifecycleDialog from '../../components/LifecycleDialog.vue'

const message = useMessage()
const dialog = useDialog()
const loading = ref(false)
const submitting = ref(false)
const projects = ref<any[]>([])
const keyword = ref('')

const projectPagination = reactive({
  page: 1,
  pageSize: 9,
  itemCount: 0,
  pageSizes: [9, 18, 36],
  prefix: ({ itemCount }: any) => `共 ${itemCount} 条`,
})

// Responsive grid columns
const gridCols = computed(() => {
  // Naive UI responsive: 1 for s, 2 for m, 3 for l
  return '1 s:1 m:2 l:3 xl:3 2k:3'
})

// Form
const formRef = ref<FormInst | null>(null)
const showFormModal = ref(false)
const editingId = ref<number | null>(null)
const productOptions = ref<{ label: string; value: number }[]>([])
const courseOptions = ref<{ label: string; value: number }[]>([])

const typeMap: Record<string, string> = {
  hardware_rack: '硬件机架',
  kvm: 'KVM虚拟机',
  eve: 'EVE模拟器',
}

const formRules = {
  name: { required: true, message: '请输入项目名称', trigger: 'blur' },
}

const formData = reactive({
  name: '',
  is_kvm: false,
  is_eve: false,
  deploy_method: 'centralized',
  responsible_person: '',
  after_sales_person: '',
  delivery_start_date: null as number | null,
  delivery_end_date: null as number | null,
  product_ids: [] as number[],
  course_ids: [] as number[],
  template_project_id: null as number | null,
})

const templateProjectOptions = ref<{ label: string; value: number }[]>([])

// Summary
const showSummaryModal = ref(false)
const summaryData = ref<any>(null)

const phaseLabelMap: Record<string, string> = {
  startup: '项目启动',
  planning: '项目规划',
  execution: '项目执行',
  monitoring: '项目监控',
  closure: '项目收尾',
  completed: '已完成',
}

function phaseTagType(phase: string) {
  const map: Record<string, string> = {
    startup: 'default',
    planning: 'info',
    execution: 'warning',
    monitoring: 'success',
    closure: 'error',
    completed: 'success',
  }
  return (map[phase] || 'default') as any
}

function formatPhaseLabel(phase: string) {
  return phaseLabelMap[phase] || phase
}

function formatExperimentType(value: string) {
  if (!value) return '-'
  return value.split(',').map((type) => typeMap[type] || type).join('、')
}

function formatDate(ts: number | null) {
  if (!ts) return ''
  const d = new Date(ts)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatShortDate(dateStr: string) {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

async function fetchProjects() {
  loading.value = true
  try {
    const res: any = await request.get('/projects', {
      params: {
        page: projectPagination.page,
        pageSize: projectPagination.pageSize,
        keyword: keyword.value,
      },
    })
    projects.value = res.data.list
    projectPagination.itemCount = res.data.total
  } catch (err: any) {
    console.error('获取项目列表失败:', err)
  } finally {
    loading.value = false
  }
}

function handleProjectPageChange(page: number) {
  projectPagination.page = page
  fetchProjects()
}

function handleProjectPageSizeChange(pageSize: number) {
  projectPagination.pageSize = pageSize
  projectPagination.page = 1
  fetchProjects()
}

let searchTimer: any
function handleSearch() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    projectPagination.page = 1
    fetchProjects()
  }, 300)
}

async function fetchOptions() {
  const [pRes, cRes, projRes]: any[] = await Promise.all([
    request.get('/products/all'),
    request.get('/courses/all'),
    request.get('/projects/all'),
  ])
  productOptions.value = pRes.data.map((p: any) => ({
    label: p.name,
    value: p.id,
  }))
  courseOptions.value = cRes.data.map((c: any) => ({
    label: c.name,
    value: c.id,
  }))
  templateProjectOptions.value = projRes.data.map((p: any) => ({
    label: p.name,
    value: p.id,
  }))
}

function resetForm() {
  Object.assign(formData, {
    name: '',
    is_kvm: false,
    is_eve: false,
    deploy_method: 'centralized',
    responsible_person: '',
    after_sales_person: '',
    delivery_start_date: null,
    delivery_end_date: null,
    product_ids: [],
    course_ids: [],
    template_project_id: null,
  })
}

function openCreateModal() {
  editingId.value = null
  resetForm()
  showFormModal.value = true
}

async function openEditModal(project: any) {
  editingId.value = project.id
  const res: any = await request.get(`/projects/${project.id}`)
  const detail = res.data.project
  Object.assign(formData, {
    name: detail.name,
    is_kvm: Boolean(detail.is_kvm),
    is_eve: Boolean(detail.is_eve),
    deploy_method: detail.deploy_method || 'centralized',
    responsible_person: detail.responsible_person,
    after_sales_person: detail.after_sales_person,
    delivery_start_date: detail.delivery_start_date
      ? new Date(detail.delivery_start_date).getTime()
      : null,
    delivery_end_date: detail.delivery_end_date
      ? new Date(detail.delivery_end_date).getTime()
      : null,
    product_ids: res.data.products.map((item: any) => item.id),
    course_ids: res.data.courses.map((item: any) => item.id),
    template_project_id: detail.template_project_id || null,
  })
  showFormModal.value = true
}

async function handleFormSubmit() {
  try {
    await formRef.value?.validate()
  } catch {
    return
  }

  if (!formData.name) {
    message.warning('请输入项目名称')
    return
  }

  if (formData.delivery_start_date && formData.delivery_end_date
      && formData.delivery_end_date <= formData.delivery_start_date) {
    message.warning('截止时间必须大于开始时间')
    return
  }

  submitting.value = true
  try {
    const payload = {
      ...formData,
      delivery_start_date: formatDate(formData.delivery_start_date),
      delivery_end_date: formatDate(formData.delivery_end_date),
    }
    if (editingId.value) {
      await request.put(`/projects/${editingId.value}`, payload)
      message.success('更新成功')
      showFormModal.value = false
      fetchProjects()
    } else {
      const res: any = await request.post('/projects', payload)
      message.success('创建成功')
      showFormModal.value = false
      fetchProjects()
      fetchOptions()
      // Show summary after create
      setTimeout(() => showSummary(res.data.id), 200)
    }
  } finally {
    submitting.value = false
  }
}

async function showSummary(id: number) {
  const res: any = await request.get(`/projects/${id}/summary`)
  summaryData.value = res.data
  showSummaryModal.value = true
}

// Lifecycle
const showLifecycleDialog = ref(false)
const selectedProjectId = ref<number | null>(null)

function handleProgress(project: any) {
  selectedProjectId.value = project.id
  showLifecycleDialog.value = true
}

function handleDelete(project: any) {
  dialog.warning({
    title: '确认删除',
    content: `确定删除项目「${project.name}」吗？`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      await request.delete(`/projects/${project.id}`)
      message.success('删除成功')
      fetchProjects()
      fetchOptions()
    },
  })
}

onMounted(() => {
  fetchProjects()
  fetchOptions()
})
</script>

<style scoped>
.project-page {
  min-height: 100%;
  color: #15233a;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.page-title {
  font-size: 20px;
  font-weight: 700;
  color: #1a1a1a;
}

.toolbar {
  margin-bottom: 18px;
}

/* Project Card */
.project-card {
  position: relative;
  min-height: 310px;
  overflow: hidden;
  border: 1px solid rgba(90, 166, 224, 0.22);
  border-radius: 16px;
  background:
    linear-gradient(145deg, rgba(255, 255, 255, 0.82), rgba(222, 242, 255, 0.64)),
    radial-gradient(circle at top right, rgba(51, 178, 255, 0.16), transparent 42%);
  box-shadow: 0 18px 44px rgba(42, 104, 152, 0.12);
  backdrop-filter: blur(18px);
  transition: box-shadow 0.22s ease, transform 0.22s ease, border-color 0.22s ease;
}

.project-card::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    linear-gradient(90deg, rgba(17, 119, 208, 0.18), rgba(38, 202, 213, 0.1), transparent 58%);
  height: 4px;
}

.project-card:hover {
  transform: translateY(-4px);
  border-color: rgba(40, 145, 220, 0.38);
  box-shadow: 0 24px 54px rgba(42, 104, 152, 0.18);
}

.project-card :deep(.n-card-header) {
  padding: 18px 18px 8px;
}

.project-card :deep(.n-card__content) {
  padding: 8px 18px 14px;
}

.project-card :deep(.n-card__action) {
  padding: 12px 14px;
  border-top: 1px solid rgba(102, 160, 205, 0.16);
  background: rgba(247, 252, 255, 0.68);
}

.project-name {
  font-size: 16px;
  font-weight: 700;
  color: #102849;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 200px;
}

.project-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #4f6380;
  line-height: 1.5;
}

.meta-icon {
  color: #6aa7d9;
  flex-shrink: 0;
}

.project-stats {
  padding: 10px 0;
  border-top: 1px solid rgba(108, 160, 205, 0.18);
  border-bottom: 1px solid rgba(108, 160, 205, 0.18);
}

.stat-item {
  font-size: 13px;
  color: #516a88;
}

.stat-item strong {
  font-size: 16px;
  font-weight: 700;
  color: #0f6fb8;
}

.project-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.project-date {
  font-size: 12px;
  color: #7a8ca5;
}

/* Detail card in summary */
.detail-card {
  border: 1px solid #e8e8e8;
}

.summary-detail-descriptions :deep(.n-descriptions-table-header),
.summary-detail-descriptions :deep(.n-descriptions-table-header__content) {
  width: 132px;
  white-space: nowrap;
}

.summary-detail-descriptions :deep(.n-descriptions-table-content) {
  word-break: break-word;
}

/* Responsive */
@media (max-width: 640px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .project-name {
    max-width: 160px;
  }
}
</style>
