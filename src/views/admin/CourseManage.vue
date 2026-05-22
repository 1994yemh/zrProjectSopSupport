<template>
  <div>
    <!-- Page Header -->
    <div class="page-header">
      <n-space align="center" :size="8">
        <n-icon size="22" color="#2080f0" :component="SchoolOutline" />
        <span class="page-title">课程管理</span>
      </n-space>
      <n-button type="primary" size="medium" @click="openModal()">
        <template #icon>
          <n-icon :component="AddOutline" />
        </template>
        新增课程
      </n-button>
    </div>

    <!-- Toolbar -->
    <n-space justify="space-between" style="margin-bottom: 16px">
      <n-input
        v-model:value="keyword"
        placeholder="搜索课程名称"
        clearable
        style="width: 300px"
        @update:value="handleSearch"
      >
        <template #prefix>
          <n-icon :component="SearchOutline" />
        </template>
      </n-input>
    </n-space>

    <n-data-table
      remote
      :columns="columns"
      :data="tableData"
      :pagination="pagination"
      :loading="loading"
      @update:page="handlePageChange"
      @update:page-size="handlePageSizeChange"
    />

    <!-- Modal -->
    <n-modal
      v-model:show="showModal"
      :title="editingId ? '编辑课程' : '新增课程'"
      preset="card"
      style="width: 560px; max-width: 90vw"
      :segmented="{ content: true }"
    >
      <n-form :model="formData" label-placement="left" label-width="80">
        <n-form-item label="课程名称">
          <n-input v-model:value="formData.name" placeholder="请输入课程名称" />
        </n-form-item>
        <n-form-item label="实验类型">
          <n-select
            v-model:value="formData.experiment_type"
            :options="typeOptions"
            multiple
            placeholder="可选择多个实验类型"
            clearable
          />
        </n-form-item>
        <n-form-item label="实验镜像">
          <n-input v-model:value="formData.experiment_image" placeholder="多个镜像用顿号分隔" />
        </n-form-item>
        <n-form-item label="说明">
          <n-input v-model:value="formData.description" type="textarea" :rows="3" placeholder="课程说明" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showModal = false">取消</n-button>
          <n-button type="primary" @click="handleSubmit">确认</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, h, onMounted } from 'vue'
import {
  NInput, NButton, NDataTable, NModal, NForm, NFormItem, NSelect,
  NSpace, NTag, NIcon, useMessage, useDialog,
} from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import {
  AddOutline, CreateOutline, SearchOutline, TrashOutline, SchoolOutline,
} from '@vicons/ionicons5'
import request from '../../utils/request'

const message = useMessage()
const dialog = useDialog()
const loading = ref(false)
const tableData = ref([])
const keyword = ref('')
const showModal = ref(false)
const editingId = ref<number | null>(null)

const typeOptions = [
  { label: '硬件机架', value: 'hardware_rack' },
  { label: 'KVM虚拟机', value: 'kvm' },
  { label: 'EVE模拟器', value: 'eve' },
]

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

function buttonIcon(icon: any) {
  return () => h(NIcon, null, { default: () => h(icon) })
}

const formData = reactive({
  name: '',
  experiment_type: [] as string[],
  experiment_image: '',
  description: '',
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50],
  showQuickJumper: true,
  prefix: ({ itemCount }: any) => `共 ${itemCount} 条`,
})

function parseTypes(val: string | string[]): string[] {
  if (Array.isArray(val)) return val
  if (!val) return []
  return val.split(',').map((s: string) => s.trim()).filter(Boolean)
}

const columns: DataTableColumns = [
  { title: '课程名称', key: 'name', ellipsis: { tooltip: true } },
  {
    title: '实验类型',
    key: 'experiment_type',
    width: 220,
    render: (row: any) => {
      const types = parseTypes(row.experiment_type)
      return h(NSpace, { size: 4 }, () => types.map((t: string) =>
        h(NTag, { type: typeColorMap[t] as any, size: 'small', round: true }, () => typeMap[t] || t)
      ))
    },
  },
  { title: '实验镜像', key: 'experiment_image', ellipsis: { tooltip: true } },
  { title: '说明', key: 'description', ellipsis: { tooltip: true } },
  {
    title: '操作',
    key: 'actions',
    width: 140,
    fixed: 'right',
    render: (row: any) => h(NSpace, { size: 4 }, () => [
      h(NButton, {
        text: true,
        type: 'primary',
        size: 'small',
        renderIcon: buttonIcon(CreateOutline),
        onClick: () => openModal(row),
      }, () => '编辑'),
      h(NButton, {
        text: true,
        type: 'error',
        size: 'small',
        renderIcon: buttonIcon(TrashOutline),
        onClick: () => handleDelete(row),
      }, () => '删除'),
    ]),
  },
]

async function fetchData() {
  loading.value = true
  try {
    const res: any = await request.get('/courses', {
      params: {
        page: pagination.page,
        pageSize: pagination.pageSize,
        keyword: keyword.value,
      },
    })
    tableData.value = res.data.list
    pagination.itemCount = res.data.total
  } finally {
    loading.value = false
  }
}

function handlePageChange(page: number) {
  pagination.page = page
  fetchData()
}

function handlePageSizeChange(pageSize: number) {
  pagination.pageSize = pageSize
  pagination.page = 1
  fetchData()
}

let searchTimer: any
function handleSearch() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    pagination.page = 1
    fetchData()
  }, 300)
}

function openModal(row?: any) {
  if (row) {
    editingId.value = row.id
    Object.assign(formData, {
      name: row.name,
      experiment_type: parseTypes(row.experiment_type),
      experiment_image: row.experiment_image,
      description: row.description,
    })
  } else {
    editingId.value = null
    Object.assign(formData, { name: '', experiment_type: [], experiment_image: '', description: '' })
  }
  showModal.value = true
}

async function handleSubmit() {
  if (!formData.name) {
    message.warning('请输入课程名称')
    return
  }
  const payload = {
    ...formData,
    experiment_type: formData.experiment_type.join(','),
  }
  if (editingId.value) {
    await request.put(`/courses/${editingId.value}`, payload)
    message.success('更新成功')
  } else {
    await request.post('/courses', payload)
    message.success('创建成功')
  }
  showModal.value = false
  fetchData()
}

function handleDelete(row: any) {
  dialog.warning({
    title: '确认删除',
    content: `确定删除课程「${row.name}」吗？`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      await request.delete(`/courses/${row.id}`)
      message.success('删除成功')
      fetchData()
    },
  })
}

onMounted(fetchData)
</script>

<style scoped>
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
</style>
