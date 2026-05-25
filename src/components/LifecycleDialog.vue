<template>
  <n-modal
    v-model:show="dialogVisible"
    title="项目进展"
    preset="card"
    style="width: 1040px; max-width: 96vw; max-height: 90vh"
    :content-style="{ maxHeight: 'calc(90vh - 88px)', overflowY: 'auto', paddingRight: '12px' }"
  >
    <n-spin :show="loading">
      <!-- Overall Progress -->
      <div class="overall-progress">
        <n-space align="center" :size="16">
          <span class="progress-label">整体进度</span>
          <n-progress
            type="line"
            :percentage="overallProgress"
            :status="overallProgress === 100 ? 'success' : 'default'"
            :height="8"
            style="width: 240px"
          />
          <n-tag
            :type="overallProgress === 100 ? 'success' : overallProgress > 0 ? 'warning' : 'default'"
            size="small"
            round
          >
            {{ overallProgress }}%
          </n-tag>
        </n-space>
      </div>

      <!-- Phase Tabs -->
      <div class="phase-tabs-container">
        <n-tabs v-model:value="activeTab" type="line" animated class="phase-tabs">
          <n-tab-pane
            v-for="phase in lifecycleData"
            :key="phase.phase"
            :name="phase.phase"
            :tab="phase.label"
          >
            <!-- Phase Header -->
            <div class="phase-header">
              <n-space align="center" :size="12">
                <span class="phase-progress-label">{{ phase.label }}进度</span>
                <n-progress
                  type="line"
                  :percentage="getPhaseProgress(phase)"
                  :status="getPhaseProgress(phase) === 100 ? 'success' : 'default'"
                  :height="6"
                  style="width: 200px"
                  :show-indicator="false"
                />
                <span class="phase-progress-text">
                  {{ getPhasePassedCount(phase) }} / {{ getPhaseTotalCount(phase) }}
                </span>
              </n-space>
              <n-space :size="4" class="phase-actions">
                <n-button size="tiny" quaternary @click="openEditPhase(phase)" title="编辑阶段">
                  <template #icon><n-icon size="16" :component="CreateOutline" /></template>
                </n-button>
                <n-button size="tiny" quaternary type="error" @click="handleDeletePhase(phase)" title="删除阶段">
                  <template #icon><n-icon size="16" :component="TrashOutline" /></template>
                </n-button>
              </n-space>
            </div>

            <!-- Sub-items as collapsible panels -->
            <n-collapse @update:expanded-names="handleCollapseToggle">
              <n-collapse-item
                v-for="item in phase.steps"
                :key="item.id"
                :name="item.id"
              >
                <template #header>
                  <div class="step-header">
                    <div class="step-header-left">
                      <n-icon
                        size="18"
                        :component="getItemProgress(item) === 100 ? CheckmarkCircleOutline : getItemProgress(item) > 0 ? TimeOutline : EllipseOutline"
                        :color="getItemProgress(item) === 100 ? '#18a058' : getItemProgress(item) > 0 ? '#f0a020' : '#c0c4cc'"
                        class="step-status-icon"
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
                      <n-tag
                        v-else-if="getItemProgress(item) > 0"
                        type="warning"
                        size="tiny"
                        round
                      >
                        {{ getItemProgress(item) }}%
                      </n-tag>
                    </div>
                    <div class="step-actions">
                      <n-button size="tiny" quaternary @click.stop="openEditStep(item)" title="编辑步骤">
                        <template #icon><n-icon size="14" :component="CreateOutline" /></template>
                      </n-button>
                      <n-button size="tiny" quaternary type="error" @click.stop="handleDeleteStep(item, phase)" title="删除步骤">
                        <template #icon><n-icon size="14" :component="TrashOutline" /></template>
                      </n-button>
                    </div>
                  </div>
                </template>

                <!-- Check list -->
                <div class="checklist" role="list">
                  <div
                    v-for="check in item.checks"
                    :key="check.id"
                    class="check-item"
                    role="listitem"
                    tabindex="0"
                    :aria-label="`${check.check_content}，当前状态：${getCheckStatusText(check.is_passed)}，点击切换状态`"
                    @click="toggleCheck(check)"
                    @keydown.enter="toggleCheck(check)"
                    @keydown.space.prevent="toggleCheck(check)"
                  >
                    <div class="check-status" aria-hidden="true">
                      <div
                        class="status-badge"
                        :class="{
                          'is-passed': check.is_passed === true,
                          'is-failed': check.is_passed === false,
                          'is-pending': check.is_passed === null,
                        }"
                      >
                        <n-icon v-if="check.is_passed === true" size="14" :component="CheckmarkOutline" />
                        <n-icon v-else-if="check.is_passed === false" size="14" :component="CloseOutline" />
                        <n-icon v-else size="14" :component="RemoveOutline" />
                      </div>
                    </div>
                    <span class="check-content">{{ check.check_content }}</span>
                    <div class="check-item-actions">
                      <n-button size="tiny" quaternary @click.stop="openEditCheck(check, item)" title="编辑细项">
                        <template #icon><n-icon size="14" :component="CreateOutline" /></template>
                      </n-button>
                      <n-button size="tiny" quaternary type="error" @click.stop="handleDeleteCheck(check, item)" title="删除细项">
                        <template #icon><n-icon size="14" :component="TrashOutline" /></template>
                      </n-button>
                    </div>
                  </div>
                </div>

                <!-- Add Check Button -->
                <n-button
                  text
                  size="small"
                  class="add-check-btn"
                  @click="openAddCheck(item)"
                >
                  <template #icon><n-icon size="16" :component="AddOutline" /></template>
                  添加细项
                </n-button>

                <!-- Notes -->
                <div class="notes-section">
                  <n-divider style="margin: 16px 0 12px" />
                  <div class="editor-wrapper">
                    <Toolbar
                      :editor="editorInstances[item.id]"
                      :default-config="toolbarConfig"
                      mode="simple"
                      class="editor-toolbar"
                    />
                    <Editor
                      :default-config="getEditorConfig()"
                      mode="simple"
                      v-model="item._noteContent"
                      class="editor-body"
                      @on-created="(editor: any) => handleEditorCreated(item.id, editor)"
                      @on-change="(editor: any) => handleEditorChange(item.id, editor)"
                      @on-blur="(editor: any) => handleEditorBlur(item.id, editor)"
                    />
                  </div>
                </div>
              </n-collapse-item>
            </n-collapse>

            <!-- Empty state -->
            <n-empty
              v-if="phase.steps.length === 0"
              description="暂无步骤，点击下方按钮添加"
              style="padding: 32px 0"
            />

            <!-- Add Step Button -->
            <n-button
              dashed
              block
              class="add-step-btn"
              @click="openAddStep(phase)"
            >
              <template #icon><n-icon :component="AddOutline" /></template>
              添加步骤
            </n-button>
          </n-tab-pane>
        </n-tabs>

        <!-- Add Phase Button -->
        <n-button quaternary size="small" class="add-phase-btn" @click="openAddPhase">
          <template #icon><n-icon :component="AddOutline" /></template>
          添加阶段
        </n-button>
      </div>
    </n-spin>
  </n-modal>

  <!-- Phase Form Modal -->
  <n-modal
    v-model:show="phaseFormVisible"
    preset="dialog"
    :title="phaseFormMode === 'add' ? '添加阶段' : '编辑阶段'"
    positive-text="确认"
    negative-text="取消"
    @positive-click="handlePhaseFormSubmit"
  >
    <n-input v-model:value="phaseFormLabel" placeholder="请输入阶段名称" autofocus />
  </n-modal>

  <!-- Step Form Modal -->
  <n-modal
    v-model:show="stepFormVisible"
    preset="dialog"
    :title="stepFormMode === 'add' ? '添加步骤' : '编辑步骤'"
    positive-text="确认"
    negative-text="取消"
    @positive-click="handleStepFormSubmit"
  >
    <n-input v-model:value="stepFormName" placeholder="请输入步骤名称" autofocus />
  </n-modal>

  <!-- Check Form Modal -->
  <n-modal
    v-model:show="checkFormVisible"
    preset="dialog"
    :title="checkFormMode === 'add' ? '添加细项' : '编辑细项'"
    positive-text="确认"
    negative-text="取消"
    @positive-click="handleCheckFormSubmit"
  >
    <n-input v-model:value="checkFormContent" placeholder="请输入细项内容" autofocus />
  </n-modal>
</template>

<script setup lang="ts">
import { ref, watch, computed, onBeforeUnmount } from 'vue'
import {
  NModal, NTabs, NTabPane, NCollapse, NCollapseItem, NSpace,
  NTag, NProgress, NDivider, NSpin, NIcon, NButton, NInput, NEmpty,
  useMessage, useDialog,
} from 'naive-ui'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import type { IDomEditor, IEditorConfig } from '@wangeditor/editor'
import '@wangeditor/editor/dist/css/style.css'
import {
  CheckmarkOutline, CloseOutline, RemoveOutline,
  CheckmarkCircleOutline, TimeOutline, EllipseOutline,
  CreateOutline, TrashOutline, AddOutline,
} from '@vicons/ionicons5'
import request from '../utils/request'

const props = defineProps<{
  visible: boolean
  projectId: number | null
}>()

const emit = defineEmits<{
  (e: 'update:visible', val: boolean): void
}>()

const message = useMessage()
const dialog = useDialog()

const loading = ref(false)
const lifecycleData = ref<any[]>([])
const activeTab = ref('startup')

const editorInstances = ref<Record<number, IDomEditor | null>>({})

const toolbarConfig = {}
const savedHtml: Record<number, string> = {}
const pendingHtml: Record<number, string> = {}
const dirtyMap: Record<number, boolean> = {}
const savingMap: Record<number, boolean> = {}

function normalizeEditorHtml(content = '') {
  const trimmed = content.trim()
  return trimmed === '<p><br></p>' ? '' : trimmed
}

function getEditorConfig(): Partial<IEditorConfig> {
  return {
    placeholder: '请输入备注...',
    autoFocus: false,
  }
}

function handleEditorCreated(itemId: number, editor: IDomEditor) {
  editorInstances.value[itemId] = editor
}

function handleEditorChange(itemId: number, editor: IDomEditor) {
  const html = editor.getHtml()
  const normalizedHtml = normalizeEditorHtml(html)
  pendingHtml[itemId] = html
  dirtyMap[itemId] = normalizedHtml !== savedHtml[itemId]
}

async function saveNotes(itemId: number, silent = false) {
  if (!dirtyMap[itemId] || savingMap[itemId]) return

  const content = pendingHtml[itemId] ?? ''
  savingMap[itemId] = true
  try {
    await request.put(`/lifecycle/notes/${itemId}`, { content })
    savedHtml[itemId] = normalizeEditorHtml(content)
    dirtyMap[itemId] = false
    if (!silent) {
      message.success('保存成功')
    }
  } catch {
    // error already handled by interceptor
  } finally {
    savingMap[itemId] = false
  }
}

async function flushDirtyNotes(silent = true) {
  const dirtyIds = Object.keys(dirtyMap).filter((id) => dirtyMap[Number(id)])
  for (const id of dirtyIds) {
    await saveNotes(Number(id), silent)
  }
}

function handleEditorBlur(itemId: number, editor: IDomEditor) {
  handleEditorChange(itemId, editor)
  void saveNotes(itemId, false)
}

function handleCollapseToggle() {
  void flushDirtyNotes(true)
}

const dialogVisible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val),
})

watch(() => props.visible, async (val) => {
  if (val && props.projectId) {
    activeTab.value = 'startup'
    await fetchLifecycle()
  }
  if (!val) {
    await flushDirtyNotes(true)
    destroyEditors()
  }
})

watch(activeTab, async () => {
  await flushDirtyNotes(true)
})

function destroyEditors() {
  Object.values(editorInstances.value).forEach((editor) => {
    if (editor) {
      editor.destroy()
    }
  })
  editorInstances.value = {}
}

onBeforeUnmount(() => {
  void flushDirtyNotes(true)
  destroyEditors()
})

async function fetchLifecycle() {
  if (!props.projectId) return
  loading.value = true
  try {
    const res: any = await request.get(`/lifecycle/project/${props.projectId}`)
    lifecycleData.value = res.data.phases.map((phase: any) => ({
      ...phase,
      steps: phase.steps.map((item: any) => {
        const noteContent = item.notes || ''
        savedHtml[item.id] = normalizeEditorHtml(noteContent)
        pendingHtml[item.id] = noteContent
        dirtyMap[item.id] = false
        return {
          ...item,
          _noteContent: noteContent,
        }
      }),
    }))
  } catch {
    // error already handled by interceptor
  } finally {
    loading.value = false
  }
}

// ===================== Phase CRUD =====================

const phaseFormVisible = ref(false)
const phaseFormMode = ref<'add' | 'edit'>('add')
const phaseFormLabel = ref('')
const editingPhase = ref<any>(null)

function openAddPhase() {
  phaseFormMode.value = 'add'
  phaseFormLabel.value = ''
  phaseFormVisible.value = true
}

function openEditPhase(phase: any) {
  phaseFormMode.value = 'edit'
  phaseFormLabel.value = phase.label
  editingPhase.value = phase
  phaseFormVisible.value = true
}

async function handlePhaseFormSubmit(): Promise<boolean | void> {
  const label = phaseFormLabel.value.trim()
  if (!label) {
    message.warning('请输入阶段名称')
    return false
  }

  try {
    if (phaseFormMode.value === 'add') {
      const res: any = await request.post('/lifecycle/phases', {
        project_id: props.projectId,
        label,
      })
      lifecycleData.value.push({
        phase: res.data.phase,
        label,
        steps: [],
      })
      activeTab.value = res.data.phase
      message.success('添加成功')
    } else {
      await request.put(`/lifecycle/phases/${editingPhase.value.phase}`, {
        project_id: props.projectId,
        label,
      })
      const target = lifecycleData.value.find((p: any) => p.phase === editingPhase.value.phase)
      if (target) target.label = label
      message.success('更新成功')
    }
  } catch {
    return false
  }
}

function handleDeletePhase(phase: any) {
  dialog.warning({
    title: '确认删除',
    content: `确定删除阶段「${phase.label}」及其所有步骤吗？此操作不可恢复。`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await request.delete(`/lifecycle/phases/${phase.phase}`, {
          data: { project_id: props.projectId },
        })
        lifecycleData.value = lifecycleData.value.filter((p: any) => p.phase !== phase.phase)
        if (activeTab.value === phase.phase) {
          activeTab.value = lifecycleData.value[0]?.phase || ''
        }
        message.success('删除成功')
      } catch {
        // error handled by interceptor
      }
    },
  })
}

// ===================== Step CRUD =====================

const stepFormVisible = ref(false)
const stepFormMode = ref<'add' | 'edit'>('add')
const stepFormName = ref('')
const editingStep = ref<any>(null)
const targetPhaseForStep = ref<any>(null)

function openAddStep(phase: any) {
  stepFormMode.value = 'add'
  stepFormName.value = ''
  targetPhaseForStep.value = phase
  stepFormVisible.value = true
}

function openEditStep(step: any) {
  stepFormMode.value = 'edit'
  stepFormName.value = step.step_name
  editingStep.value = step
  stepFormVisible.value = true
}

async function handleStepFormSubmit(): Promise<boolean | void> {
  const name = stepFormName.value.trim()
  if (!name) {
    message.warning('请输入步骤名称')
    return false
  }

  try {
    if (stepFormMode.value === 'add') {
      const res: any = await request.post('/lifecycle/steps', {
        project_id: props.projectId,
        phase: targetPhaseForStep.value.phase,
        step_name: name,
      })
      targetPhaseForStep.value.steps.push({
        ...res.data,
        _noteContent: '',
        checks: [],
      })
      message.success('添加成功')
    } else {
      await request.put(`/lifecycle/steps/${editingStep.value.id}`, {
        step_name: name,
      })
      editingStep.value.step_name = name
      message.success('更新成功')
    }
  } catch {
    return false
  }
}

function handleDeleteStep(step: any, phase: any) {
  dialog.warning({
    title: '确认删除',
    content: `确定删除步骤「${step.step_name}」吗？`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await request.delete(`/lifecycle/steps/${step.id}`)
        // Clean up editor if exists
        if (editorInstances.value[step.id]) {
          editorInstances.value[step.id]!.destroy()
          delete editorInstances.value[step.id]
        }
        delete savedHtml[step.id]
        delete pendingHtml[step.id]
        delete dirtyMap[step.id]
        phase.steps = phase.steps.filter((s: any) => s.id !== step.id)
        message.success('删除成功')
      } catch {
        // error handled by interceptor
      }
    },
  })
}

// ===================== Check CRUD =====================

const checkFormVisible = ref(false)
const checkFormMode = ref<'add' | 'edit'>('add')
const checkFormContent = ref('')
const editingCheck = ref<any>(null)
const targetStepForCheck = ref<any>(null)

function openAddCheck(step: any) {
  checkFormMode.value = 'add'
  checkFormContent.value = ''
  targetStepForCheck.value = step
  checkFormVisible.value = true
}

function openEditCheck(check: any, step: any) {
  checkFormMode.value = 'edit'
  checkFormContent.value = check.check_content
  editingCheck.value = check
  targetStepForCheck.value = step
  checkFormVisible.value = true
}

async function handleCheckFormSubmit(): Promise<boolean | void> {
  const content = checkFormContent.value.trim()
  if (!content) {
    message.warning('请输入细项内容')
    return false
  }

  try {
    if (checkFormMode.value === 'add') {
      const res: any = await request.post('/lifecycle/checks', {
        project_lifecycle_id: targetStepForCheck.value.id,
        check_content: content,
      })
      targetStepForCheck.value.checks.push({
        id: res.data.id,
        check_content: content,
        is_passed: null,
        sort_order: res.data.sort_order,
      })
      message.success('添加成功')
    } else {
      await request.put(`/lifecycle/checks/${editingCheck.value.id}`, {
        check_content: content,
      })
      editingCheck.value.check_content = content
      message.success('更新成功')
    }
  } catch {
    return false
  }
}

function handleDeleteCheck(check: any, step: any) {
  dialog.warning({
    title: '确认删除',
    content: `确定删除细项「${check.check_content}」吗？`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await request.delete(`/lifecycle/checks/${check.id}`)
        step.checks = step.checks.filter((c: any) => c.id !== check.id)
        message.success('删除成功')
      } catch {
        // error handled by interceptor
      }
    },
  })
}

// ===================== Progress calculations =====================

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

function getCheckStatusText(is_passed: boolean | null) {
  if (is_passed === true) return '通过'
  if (is_passed === false) return '不通过'
  return '未检查'
}

async function toggleCheck(check: any) {
  let newVal: boolean | null
  if (check.is_passed === null) newVal = true
  else if (check.is_passed === true) newVal = false
  else newVal = null

  const oldVal = check.is_passed
  check.is_passed = newVal

  try {
    await request.put(`/lifecycle/checks/${check.id}`, { is_passed: newVal })
  } catch {
    check.is_passed = oldVal
  }
}
</script>

<style scoped>
.overall-progress {
  padding: 12px 16px;
  margin-bottom: 16px;
  background: #f8f9fc;
  border-radius: 8px;
  border: 1px solid #e8e8e8;
}

.progress-label {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

/* Phase Tabs Container */
.phase-tabs-container {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.phase-tabs {
  flex: 1;
  min-width: 0;
}

.add-phase-btn {
  margin-top: 4px;
  flex-shrink: 0;
  color: #5e7492;
  border-color: rgba(90, 166, 224, 0.22);
  transition: color 0.2s, border-color 0.2s;
}

.add-phase-btn:hover {
  color: #2080f0;
  border-color: rgba(32, 128, 240, 0.3);
}

/* Phase Header */
.phase-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  margin-bottom: 12px;
  background: #fafbfc;
  border-radius: 6px;
  transition: background 0.2s ease;
}

.phase-header:hover {
  background: #f5f7fb;
}

.phase-actions {
  opacity: 0;
  transition: opacity 0.2s ease;
}

.phase-header:hover .phase-actions {
  opacity: 1;
}

.phase-progress-label {
  font-size: 13px;
  font-weight: 600;
  color: #555;
}

.phase-progress-text {
  font-size: 13px;
  color: #888;
  font-variant-numeric: tabular-nums;
}

/* Step Header */
.step-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex: 1;
  min-width: 0;
}

.step-header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex: 1;
  line-height: 1;
}

.step-status-icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

.step-name {
  font-weight: 600;
  font-size: 15px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.step-actions {
  display: flex;
  align-items: center;
  gap: 2px;
  opacity: 0;
  transition: opacity 0.2s ease;
  flex-shrink: 0;
  margin-left: 8px;
}

.step-header:hover .step-actions {
  opacity: 1;
}

/* Add Step Button */
.add-step-btn {
  margin-top: 16px;
  border-color: rgba(90, 166, 224, 0.28);
  color: #5e7492;
  border-radius: 8px;
  transition: color 0.2s, border-color 0.2s, background 0.2s;
}

.add-step-btn:hover {
  color: #2080f0;
  border-color: rgba(32, 128, 240, 0.36);
  background: rgba(32, 128, 240, 0.04);
}

/* Add Check Button */
.add-check-btn {
  margin-top: 6px;
  color: #8a9ab5;
  padding-left: 10px;
  transition: color 0.2s;
}

.add-check-btn:hover {
  color: #2080f0;
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
  padding: 8px 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.15s ease;
  outline: none;
}

.check-item:hover {
  background: #f0f5ff;
}

.check-item:focus-visible {
  background: #f0f5ff;
  box-shadow: 0 0 0 2px #2080f0;
}

.check-item-actions {
  display: flex;
  align-items: center;
  gap: 2px;
  opacity: 0;
  transition: opacity 0.2s ease;
  flex-shrink: 0;
  padding-top: 1px;
}

.check-item:hover .check-item-actions {
  opacity: 1;
}

.check-status {
  flex-shrink: 0;
  padding-top: 1px;
}

.status-badge {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.status-badge.is-passed {
  background: #e6f7e6;
  color: #18a058;
}

.status-badge.is-failed {
  background: #fde8e8;
  color: #d03050;
}

.status-badge.is-pending {
  background: #f0f0f0;
  color: #999;
}

.check-content {
  font-size: 14px;
  line-height: 1.6;
  color: #333;
  flex: 1;
  padding-top: 2px;
}

.check-item.is-passed .check-content {
  color: #18a058;
}

.check-item.is-failed .check-content {
  color: #d03050;
}

/* Notes Section */
.notes-section {
  margin-top: 4px;
}

.editor-wrapper {
  border: 1px solid rgba(84, 151, 205, 0.28);
  border-radius: 10px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.82);
  box-shadow: 0 14px 34px rgba(40, 112, 168, 0.08);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.editor-wrapper:focus-within {
  border-color: #2080f0;
  box-shadow: 0 0 0 3px rgba(32, 128, 240, 0.1), 0 18px 40px rgba(40, 112, 168, 0.12);
}

.editor-toolbar {
  border-bottom: 1px solid rgba(84, 151, 205, 0.2);
  background: linear-gradient(180deg, rgba(248, 252, 255, 0.96), rgba(235, 247, 255, 0.92));
}

.editor-body {
  min-height: 340px;
  height: 340px;
  overflow-y: auto;
  background: #fff;
}

/* Override collapse content to allow editor overflow */
:deep(.n-collapse-item__content-inner) {
  overflow: visible;
}

:deep(.w-e-toolbar) {
  flex-wrap: wrap;
}

/* Responsive */
@media (max-width: 640px) {
  .overall-progress {
    padding: 10px 12px;
  }

  .phase-header {
    padding: 8px 10px;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .phase-actions {
    opacity: 1;
  }

  .step-actions {
    opacity: 1;
  }

  .check-item-actions {
    opacity: 1;
  }

  .editor-body {
    min-height: 260px;
    height: 260px;
  }

  .add-phase-btn span {
    display: none;
  }
}
</style>
