<template>
  <div>
    <!-- Page Header -->
    <div class="page-header">
      <n-space align="center" :size="8">
        <n-icon size="22" color="#2080f0" :component="CubeOutline" />
        <span class="page-title">产品管理</span>
      </n-space>
      <n-button type="primary" size="medium" @click="openModal()">
        <template #icon>
          <n-icon :component="AddOutline" />
        </template>
        新增产品
      </n-button>
    </div>

    <!-- Toolbar -->
    <n-space justify="space-between" style="margin-bottom: 16px">
      <n-input
        v-model:value="keyword"
        placeholder="搜索产品名称"
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
      :title="editingId ? '编辑产品' : '新增产品'"
      preset="card"
      style="width: 600px; max-width: 90vw"
      :segmented="{ content: true }"
    >
      <n-form :model="formData" label-placement="left" label-width="110">
        <n-form-item label="产品名称">
          <n-input v-model:value="formData.name" placeholder="请输入产品名称" />
        </n-form-item>
        <n-form-item label="安装包位置">
          <n-input v-model:value="formData.install_path" placeholder="NAS路径或URL" />
        </n-form-item>
        <n-form-item label="安装手册位置">
          <n-input v-model:value="formData.install_manual_path" placeholder="手册文件路径" />
        </n-form-item>
        <n-form-item label="使用手册位置">
          <n-input v-model:value="formData.usage_manual_path" placeholder="手册文件路径" />
        </n-form-item>
        <n-form-item label="验收参数位置">
          <n-input v-model:value="formData.verification_path" placeholder="验收参数文件路径" />
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
  NInput, NButton, NDataTable, NModal, NForm, NFormItem,
  NSpace, NIcon, useMessage, useDialog,
} from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import {
  AddOutline, CreateOutline, SearchOutline, TrashOutline, CubeOutline,
} from '@vicons/ionicons5'
import request from '../../utils/request'

const message = useMessage()
const dialog = useDialog()
const loading = ref(false)
const tableData = ref([])
const keyword = ref('')
const showModal = ref(false)
const editingId = ref<number | null>(null)

const formData = reactive({
  name: '',
  install_path: '',
  install_manual_path: '',
  usage_manual_path: '',
  verification_path: '',
})

function buttonIcon(icon: any) {
  return () => h(NIcon, null, { default: () => h(icon) })
}

const pagination = reactive({
  page: 1,
  pageSize: 10,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50],
  showQuickJumper: true,
  prefix: ({ itemCount }: any) => `共 ${itemCount} 条`,
})

const columns: DataTableColumns = [
  { title: '产品名称', key: 'name', ellipsis: { tooltip: true }, width: 180 },
  { title: '安装包位置', key: 'install_path', ellipsis: { tooltip: true } },
  { title: '安装手册', key: 'install_manual_path', ellipsis: { tooltip: true } },
  { title: '使用手册', key: 'usage_manual_path', ellipsis: { tooltip: true } },
  { title: '验收参数', key: 'verification_path', ellipsis: { tooltip: true } },
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
    const res: any = await request.get('/products', {
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
      install_path: row.install_path,
      install_manual_path: row.install_manual_path,
      usage_manual_path: row.usage_manual_path,
      verification_path: row.verification_path,
    })
  } else {
    editingId.value = null
    Object.assign(formData, {
      name: '',
      install_path: '',
      install_manual_path: '',
      usage_manual_path: '',
      verification_path: '',
    })
  }
  showModal.value = true
}

async function handleSubmit() {
  if (!formData.name) {
    message.warning('请输入产品名称')
    return
  }
  if (editingId.value) {
    await request.put(`/products/${editingId.value}`, formData)
    message.success('更新成功')
  } else {
    await request.post('/products', formData)
    message.success('创建成功')
  }
  showModal.value = false
  fetchData()
}

function handleDelete(row: any) {
  dialog.warning({
    title: '确认删除',
    content: `确定删除产品「${row.name}」吗？`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      await request.delete(`/products/${row.id}`)
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
