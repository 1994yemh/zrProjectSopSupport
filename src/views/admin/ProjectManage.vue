<template>
  <div class="project-page">
    <!-- Card Grid -->
    <n-grid class="project-grid" :cols="3" :x-gap="16" :y-gap="16" responsive="screen">
      <n-grid-item v-for="project in projects" :key="project.id">
        <n-card class="glass-project-card" :title="project.name" size="small" hoverable>
          <n-space vertical :size="10">
            <n-space>
              <n-tag v-if="project.is_kvm" type="info" size="small">KVM</n-tag>
              <n-tag v-if="project.is_eve" type="warning" size="small">EVE</n-tag>
              <n-tag size="small">{{ project.deploy_method === 'centralized' ? '集中式' : '分布式' }}</n-tag>
            </n-space>
            <div class="project-meta">负责人：{{ project.responsible_person || '-' }}</div>
            <div class="project-meta">售后人员：{{ project.after_sales_person || '-' }}</div>
            <div class="project-meta">交付时间：{{ project.delivery_start_date || '-' }} ~ {{ project.delivery_end_date || '-' }}</div>
            <n-progress type="line" :percentage="project.progress" :show-indicator="true" />
            <n-tag :type="phaseTagType(project.current_phase)" size="small">{{ project.current_phase }}</n-tag>
            <div class="project-created">{{ project.created_at }}</div>
          </n-space>
          <template #footer>
            <n-space>
              <n-button size="small" @click="showSummary(project.id)">
                <template #icon>
                  <n-icon :component="DocumentTextOutline" />
                </template>
                项目简介
              </n-button>
              <n-button size="small" type="info" @click="handleProgress(project)">
                <template #icon>
                  <n-icon :component="TrendingUpOutline" />
                </template>
                项目进展
              </n-button>
              <n-button size="small" @click="openEditModal(project)">
                <template #icon>
                  <n-icon :component="CreateOutline" />
                </template>
                编辑
              </n-button>
              <n-button size="small" type="error" @click="handleDelete(project)">
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

    <n-empty v-if="projects.length === 0 && !loading" description="暂无项目" />

    <!-- Pagination -->
    <n-space justify="center" style="margin-top: 20px">
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
    <n-modal v-model:show="showFormModal" :title="editingId ? '编辑项目' : '新增项目'" preset="dialog" style="width: 700px" positive-text="确认" negative-text="取消" @positive-click="handleFormSubmit">
      <n-form :model="formData" label-placement="left" label-width="100">
        <n-form-item label="项目名称"><n-input v-model:value="formData.name" /></n-form-item>
        <n-form-item label="所需产品">
          <n-select v-model:value="formData.product_ids" multiple :options="productOptions" placeholder="选择产品" />
        </n-form-item>
        <n-form-item label="所需课程">
          <n-select v-model:value="formData.course_ids" multiple :options="courseOptions" placeholder="选择课程" />
        </n-form-item>
        <n-grid :cols="2" :x-gap="12">
          <n-grid-item>
            <n-form-item label="EVE实验"><n-switch v-model:value="formData.is_eve" /></n-form-item>
          </n-grid-item>
          <n-grid-item>
            <n-form-item label="KVM实验"><n-switch v-model:value="formData.is_kvm" /></n-form-item>
          </n-grid-item>
        </n-grid>
        <n-form-item v-if="formData.is_eve || formData.is_kvm" label="部署方式">
          <n-select v-model:value="formData.deploy_method" :options="[{label:'集中式',value:'centralized'},{label:'分布式',value:'distributed'}]" />
        </n-form-item>
        <n-grid :cols="2" :x-gap="12">
          <n-grid-item>
            <n-form-item label="负责人"><n-input v-model:value="formData.responsible_person" /></n-form-item>
          </n-grid-item>
          <n-grid-item>
            <n-form-item label="售后人员"><n-input v-model:value="formData.after_sales_person" /></n-form-item>
          </n-grid-item>
        </n-grid>
        <n-grid :cols="2" :x-gap="12">
          <n-grid-item>
            <n-form-item label="开始时间"><n-date-picker v-model:value="formData.delivery_start_date" type="date" style="width:100%" /></n-form-item>
          </n-grid-item>
          <n-grid-item>
            <n-form-item label="截止时间"><n-date-picker v-model:value="formData.delivery_end_date" type="date" style="width:100%" /></n-form-item>
          </n-grid-item>
        </n-grid>
      </n-form>
    </n-modal>

    <!-- Summary Modal -->
    <n-modal v-model:show="showSummaryModal" title="项目简介" preset="card" style="width: 800px; max-height: 80vh; overflow: auto">
      <template v-if="summaryData">
        <n-tabs class="summary-tabs" type="line" animated>
          <n-tab-pane name="basic" tab="基本信息">
            <n-descriptions bordered :column="2" label-placement="left">
              <n-descriptions-item label="项目名称">{{ summaryData.name || '-' }}</n-descriptions-item>
              <n-descriptions-item label="部署方式">{{ summaryData.deploy_method === 'centralized' ? '集中式' : '分布式' }}</n-descriptions-item>
              <n-descriptions-item label="负责人">{{ summaryData.responsible_person || '-' }}</n-descriptions-item>
              <n-descriptions-item label="售后人员">{{ summaryData.after_sales_person || '-' }}</n-descriptions-item>
              <n-descriptions-item label="EVE实验">{{ summaryData.is_eve ? '是' : '否' }}</n-descriptions-item>
              <n-descriptions-item label="KVM实验">{{ summaryData.is_kvm ? '是' : '否' }}</n-descriptions-item>
              <n-descriptions-item label="交付开始时间">{{ summaryData.delivery_start_date || '-' }}</n-descriptions-item>
              <n-descriptions-item label="交付截止时间">{{ summaryData.delivery_end_date || '-' }}</n-descriptions-item>
            </n-descriptions>
          </n-tab-pane>

          <n-tab-pane name="products" tab="交付产品">
            <n-space vertical :size="12">
              <n-card v-for="product in summaryData.products" :key="product.name" size="small">
                <n-descriptions class="summary-detail-descriptions" bordered :column="1" label-placement="left">
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
              <n-card v-for="course in summaryData.courses" :key="course.name" size="small">
                <n-descriptions class="summary-detail-descriptions" bordered :column="1" label-placement="left">
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
import { ref, reactive, onMounted } from 'vue'
import {
  NCard, NGrid, NGridItem, NSpace, NButton, NTag, NProgress, NModal,
  NForm, NFormItem, NInput, NSelect, NSwitch, NDatePicker, NDescriptions,
  NDescriptionsItem, NEmpty, NPagination, NIcon, NTabs, NTabPane, useMessage, useDialog
} from 'naive-ui'
import { CreateOutline, DocumentTextOutline, TrashOutline, TrendingUpOutline } from '@vicons/ionicons5'
import request from '../../utils/request'
import LifecycleDialog from '../../components/LifecycleDialog.vue'

const message = useMessage()
const dialog = useDialog()
const loading = ref(false)
const projects = ref<any[]>([])
const projectPagination = reactive({
  page: 1,
  pageSize: 9,
  itemCount: 0,
  pageSizes: [9, 18, 36],
  prefix: ({ itemCount }: any) => `共 ${itemCount} 条`,
})

// Form
const showFormModal = ref(false)
const editingId = ref<number | null>(null)
const productOptions = ref<{label:string,value:number}[]>([])
const courseOptions = ref<{label:string,value:number}[]>([])

const typeMap: Record<string, string> = { hardware_rack: '硬件机架', kvm: 'KVM虚拟机', eve: 'EVE模拟器' }

function formatExperimentType(value: string) {
  if (!value) return '-'
  return value.split(',').map(type => typeMap[type] || type).join('、')
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
})

// Summary
const showSummaryModal = ref(false)
const summaryData = ref<any>(null)

function phaseTagType(phase: string) {
  const map: Record<string, string> = { '项目启动': 'default', '项目规划': 'info', '项目执行': 'warning', '项目监控': 'success', '项目收尾': 'error' }
  return (map[phase] || 'default') as any
}

function formatDate(ts: number | null) {
  if (!ts) return ''
  const d = new Date(ts)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

async function fetchProjects() {
  loading.value = true
  try {
    const res: any = await request.get('/projects', { params: { page: projectPagination.page, pageSize: projectPagination.pageSize } })
    projects.value = res.data.list
    projectPagination.itemCount = res.data.total
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

async function fetchOptions() {
  const [pRes, cRes]: any[] = await Promise.all([
    request.get('/products/all'),
    request.get('/courses/all'),
  ])
  productOptions.value = pRes.data.map((p: any) => ({ label: p.name, value: p.id }))
  courseOptions.value = cRes.data.map((c: any) => ({ label: c.name, value: c.id }))
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
    delivery_start_date: detail.delivery_start_date ? new Date(detail.delivery_start_date).getTime() : null,
    delivery_end_date: detail.delivery_end_date ? new Date(detail.delivery_end_date).getTime() : null,
    product_ids: res.data.products.map((item: any) => item.id),
    course_ids: res.data.courses.map((item: any) => item.id),
  })
  showFormModal.value = true
}

async function handleFormSubmit() {
  if (!formData.name) { message.warning('请输入项目名称'); return false }
  const payload = {
    ...formData,
    delivery_start_date: formatDate(formData.delivery_start_date),
    delivery_end_date: formatDate(formData.delivery_end_date),
  }
  if (editingId.value) {
    await request.put(`/projects/${editingId.value}`, payload)
    message.success('更新成功')
  } else {
    const res: any = await request.post('/projects', payload)
    message.success('创建成功')
    // Auto show summary after create
    showSummary(res.data.id)
  }
  showFormModal.value = false
  fetchProjects()
  return true
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
  padding: 2px;
  background:
    radial-gradient(circle at 12% 8%, rgba(91, 141, 239, 0.16), transparent 28%),
    radial-gradient(circle at 86% 20%, rgba(99, 179, 237, 0.14), transparent 30%);
}

.project-grid {
  position: relative;
}

.glass-project-card {
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(116, 166, 235, 0.38);
  border-radius: 12px;
  background: linear-gradient(145deg, rgba(247, 251, 255, 0.82), rgba(222, 237, 255, 0.58));
  box-shadow: 0 14px 34px rgba(65, 112, 180, 0.13);
  backdrop-filter: blur(14px);
  transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease;
}

.glass-project-card::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(120deg, rgba(255, 255, 255, 0.58), transparent 42%);
}

.glass-project-card:hover {
  transform: translateY(-4px);
  border-color: rgba(74, 126, 218, 0.58);
  box-shadow: 0 20px 46px rgba(65, 112, 180, 0.22);
}

.glass-project-card :deep(.n-card-header),
.glass-project-card :deep(.n-card__content),
.glass-project-card :deep(.n-card__footer) {
  position: relative;
  z-index: 1;
}

.glass-project-card :deep(.n-card-header__main) {
  color: #1f4f8f;
  font-weight: 700;
}

.project-meta {
  color: #31506f;
  line-height: 1.5;
}

.project-created {
  color: #7a91aa;
  font-size: 12px;
}

.summary-detail-descriptions :deep(.n-descriptions-table-header),
.summary-detail-descriptions :deep(.n-descriptions-table-header__content) {
  width: 132px;
  white-space: nowrap;
}

.summary-detail-descriptions :deep(.n-descriptions-table-content) {
  word-break: break-word;
}
</style>
