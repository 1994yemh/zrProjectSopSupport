<template>
  <n-modal
    v-model:show="dialogVisible"
    title="项目进展"
    preset="card"
    style="width: 900px; max-height: 85vh"
    :content-style="{ maxHeight: 'calc(85vh - 88px)', overflowY: 'auto', paddingRight: '10px' }"
  >
    <n-spin :show="loading">
      <n-tabs v-model:value="activeTab" type="card">
        <n-tab-pane v-for="phase in lifecycleData" :key="phase.phase" :name="phase.phase" :tab="phase.label">
          <!-- Phase progress -->
          <n-progress type="line" :percentage="getPhaseProgress(phase)" :status="getPhaseProgress(phase) === 100 ? 'success' : 'default'" style="margin-bottom: 16px" />

          <!-- Sub-items as collapsible panels -->
          <n-collapse @update:expanded-names="handleCollapseToggle">
            <n-collapse-item v-for="item in phase.steps" :key="item.id" :name="item.id">
              <template #header>
                <n-space align="center" :size="8">
                  <span>{{ item.step_name }}</span>
                  <n-tag v-if="getItemProgress(item) === 100" type="success" size="tiny">已完成</n-tag>
                </n-space>
              </template>

              <!-- Check list -->
              <n-space vertical :size="8">
                <div v-for="check in item.checks" :key="check.id" style="display: flex; align-items: center; gap: 8px">
                  <n-tag
                    :type="check.is_passed === true ? 'success' : check.is_passed === false ? 'error' : 'default'"
                    size="small"
                    round
                    style="cursor: pointer; min-width: 60px; text-align: center"
                    @click="toggleCheck(check)"
                  >
                    {{ check.is_passed === true ? '通过' : check.is_passed === false ? '不通过' : '未检查' }}
                  </n-tag>
                  <span>{{ check.check_content }}</span>
                </div>
              </n-space>

              <!-- Notes -->
              <n-divider />
              <div class="lifecycle-editor">
                <Toolbar
                  :editor="editorInstances[item.id]"
                  :defaultConfig="toolbarConfig"
                  mode="simple"
                  style="border-bottom: 1px solid #e0e0e6"
                />
                <Editor
                  :defaultConfig="getEditorConfig()"
                  mode="simple"
                  v-model="item._noteContent"
                  style="height: 200px; overflow-y: auto"
                  @onCreated="(editor: any) => handleEditorCreated(item.id, editor)"
                  @onChange="(editor: any) => handleEditorChange(item.id, editor)"
                  @onBlur="(editor: any) => handleEditorBlur(item.id, editor)"
                />
              </div>
            </n-collapse-item>
          </n-collapse>
        </n-tab-pane>
      </n-tabs>
    </n-spin>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, watch, computed, onBeforeUnmount } from 'vue'
import {
  NModal, NTabs, NTabPane, NCollapse, NCollapseItem, NSpace,
  NTag, NProgress, NDivider, NSpin, useMessage
} from 'naive-ui'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import type { IDomEditor, IEditorConfig } from '@wangeditor/editor'
import '@wangeditor/editor/dist/css/style.css'
import request from '../utils/request'

const props = defineProps<{
  visible: boolean
  projectId: number | null
}>()

const emit = defineEmits<{
  (e: 'update:visible', val: boolean): void
}>()

const message = useMessage()
const loading = ref(false)
const lifecycleData = ref<any[]>([])
const activeTab = ref('startup')

// Store editor instances (shallowRef to avoid deep reactivity on editor objects)
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
    if (!silent) message.success('保存成功')
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
  Object.values(editorInstances.value).forEach(editor => {
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

function getPhaseProgress(phase: any) {
  const allChecks = phase.steps.flatMap((item: any) => item.checks)
  if (allChecks.length === 0) return 0
  const passed = allChecks.filter((c: any) => c.is_passed === true).length
  return Math.round(passed / allChecks.length * 100)
}

function getItemProgress(item: any) {
  if (!item.checks || item.checks.length === 0) return 0
  const passed = item.checks.filter((c: any) => c.is_passed === true).length
  return Math.round(passed / item.checks.length * 100)
}

async function toggleCheck(check: any) {
  // Cycle: null -> true -> false -> null
  let newVal: boolean | null
  if (check.is_passed === null) newVal = true
  else if (check.is_passed === true) newVal = false
  else newVal = null

  check.is_passed = newVal
  try {
    await request.put(`/lifecycle/checks/${check.id}`, { is_passed: newVal })
  } catch {
    // revert on failure
    check.is_passed = check.is_passed === true ? null : check.is_passed === false ? true : false
  }
}
</script>

<style scoped>
.lifecycle-editor {
  width: 100%;
  border: 1px solid #e0e0e6;
  border-radius: 4px;
  overflow: hidden;
}

:deep(.n-collapse-item__content-inner) {
  overflow: visible;
}

:deep(.w-e-toolbar) {
  flex-wrap: wrap;
}
</style>
