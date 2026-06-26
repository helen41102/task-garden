<template>
  <div class="matrix-app" :class="{ 'is-mobile': isMobile }">
    <!-- TopBar（桌面端） -->
    <header class="topbar" v-if="!isMobile">
      <div class="topbar-left">
        <span class="topbar-avatar">{{ profile.avatar }}</span>
        <div>
          <span class="topbar-name">{{ profile.name }}</span>
          <span class="topbar-sub">的任务花园</span>
        </div>
      </div>
      <div class="topbar-center">
        <span class="q-axis-label urgent">⚡ 紧急</span>
        <div class="axis-divider-v"></div>
        <span class="q-axis-label not-urgent">🌙 不紧急</span>
      </div>
      <div class="topbar-right">
        <button class="icon-pill" @click="showAi = !showAi" :class="{ active: showAi }">
          🤖 AI 助手
        </button>
        <button class="icon-pill secondary" @click="showSettings = !showSettings">⚙️ 设置</button>
        <button class="icon-pill ghost" @click="$emit('logout')">← 切换</button>
      </div>
    </header>

    <!-- 移动端顶部栏 -->
    <header class="mobile-topbar" v-if="isMobile">
      <button class="mobile-back" @click="$emit('logout')">←</button>
      <div class="mobile-title">
        <span>{{ profile.avatar }}</span>
        <span>{{ profile.name }}的花园</span>
      </div>
      <button class="mobile-settings" @click="showSettings = true">⚙️</button>
    </header>

    <!-- 主体 -->
    <div class="main-body">
      <!-- 左侧轴标签（桌面端） -->
      <div class="side-axis" v-if="!isMobile">
        <span class="axis-label important">⭐ 重要</span>
        <div class="axis-divider-h"></div>
        <span class="axis-label not-important">💤 不重要</span>
      </div>

      <!-- 四象限 / 移动端单象限 -->
      <div class="quadrants" :class="viewClass">
        <template v-if="isMobile && mobileActiveQ !== 'all'">
          <!-- 移动端：只显示当前象限 -->
          <Quadrant
            v-for="q in quadrantDefs.filter(q => q.key === mobileActiveQ)"
            :key="q.key"
            :qkey="q.key"
            :label="q.label"
            :sub="q.sub"
            :emoji="q.emoji"
            :color="q.color"
            :nodes="data[q.key]"
            :ai-loading="aiLoadingQ === q.key"
            :ai-summary="aiSummaries[q.key]"
            :is-mobile="isMobile"
            @add="openAdd(q.key, $event)"
            @open-file="openFile"
            @delete-node="deleteNode"
            @rename-node="renameNode"
            @move-node="moveNode"
            @ai-analyze="analyzeQuadrant(q.key)"
            @drop-file="handleFileDrop"
          />
        </template>
        <template v-else>
          <!-- 桌面端 / 全览：显示所有象限 -->
          <Quadrant
            v-for="q in quadrantDefs"
            :key="q.key"
            :qkey="q.key"
            :label="q.label"
            :sub="q.sub"
            :emoji="q.emoji"
            :color="q.color"
            :nodes="data[q.key]"
            :ai-loading="aiLoadingQ === q.key"
            :ai-summary="aiSummaries[q.key]"
            :is-mobile="isMobile"
            @add="openAdd(q.key, $event)"
            @open-file="openFile"
            @delete-node="deleteNode"
            @rename-node="renameNode"
            @move-node="moveNode"
            @ai-analyze="analyzeQuadrant(q.key)"
            @drop-file="handleFileDrop"
          />
        </template>
      </div>

      <!-- AI 侧面板（桌面端） -->
      <transition name="slide-right">
        <AiPanel
          v-if="showAi && !isMobile"
          :api-key="apiKey"
          :api-base="apiBase"
          :data="data"
          @close="showAi = false"
        />
      </transition>

      <!-- AI 全屏面板（移动端） -->
      <transition name="fade">
        <div class="ai-fullscreen" v-if="showAi && isMobile">
          <AiPanel
            :api-key="apiKey"
            :api-base="apiBase"
            :data="data"
            @close="showAi = false"
          />
        </div>
      </transition>
    </div>

    <!-- 移动端底部导航 -->
    <MobileNav
      v-if="isMobile"
      :data="data"
      :active="mobileActiveQ"
      @switch="mobileActiveQ = $event"
    />

    <!-- 悬浮球 -->
    <FloatBall
      :data="data"
      :layout="layout"
      @quick-add="handleQuickAdd"
      @open-ai="showAi = !showAi"
      @scroll-top="scrollTop"
      @toggle-layout="toggleLayout"
    />

    <!-- PWA 安装引导 -->
    <PwaInstall />

    <!-- 文件查看/编辑器 -->
    <transition name="fade">
      <FileEditor
        v-if="openedFile"
        :node="openedFile.node"
        :api-key="apiKey"
        :api-base="apiBase"
        @close="openedFile = null"
        @save="saveFileContent"
        @ai-analyze="analyzeFile"
      />
    </transition>

    <!-- 添加节点弹窗 -->
    <transition name="fade">
      <AddNodeModal
        v-if="addTarget"
        :target="addTarget"
        @confirm="confirmAdd"
        @cancel="addTarget = null"
      />
    </transition>

    <!-- 设置面板 -->
    <transition name="fade">
      <SettingsPanel
        v-if="showSettings"
        :api-key="apiKey"
        :api-base="apiBase"
        :profile="profile"
        @close="showSettings = false"
        @save="saveSettings"
        @export="exportData"
        @import="importData"
      />
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, onUnmounted } from 'vue'
import Quadrant from './Quadrant.vue'
import AiPanel from './AiPanel.vue'
import FileEditor from './FileEditor.vue'
import AddNodeModal from './AddNodeModal.vue'
import SettingsPanel from './SettingsPanel.vue'
import FloatBall from './FloatBall.vue'
import MobileNav from './MobileNav.vue'
import PwaInstall from './PwaInstall.vue'

// ---- Types ----
export interface FileNode {
  id: string
  type: 'file' | 'folder'
  name: string
  content?: string
  children?: FileNode[]
  createdAt: string
  updatedAt: string
  aiSummary?: string
}

export type QKey = 'q1' | 'q2' | 'q3' | 'q4'
interface MatrixData { q1: FileNode[]; q2: FileNode[]; q3: FileNode[]; q4: FileNode[] }

const props = defineProps<{ profile: { id: string; name: string; avatar: string; createdAt?: string } }>()
const emit = defineEmits(['logout'])

// ---- 响应式 ----
const isMobile = ref(false)
const mobileActiveQ = ref<QKey | 'all'>('all')
const layout = ref<'grid' | 'list' | 'focus'>('grid')

function checkMobile() {
  isMobile.value = window.innerWidth < 768
}

const viewClass = computed(() => {
  if (isMobile.value && mobileActiveQ.value !== 'all') return 'single-view'
  return 'grid-view'
})

// ---- State ----
const data = reactive<MatrixData>({ q1: [], q2: [], q3: [], q4: [] })
const apiKey = ref('')
const apiBase = ref('https://api.deepseek.com/v1')
const showAi = ref(false)
const showSettings = ref(false)
const addTarget = ref<{ qkey: QKey; parentId?: string; type: 'file'|'folder' } | null>(null)
const openedFile = ref<{ node: FileNode; qkey: QKey } | null>(null)
const aiLoadingQ = ref<QKey | null>(null)
const aiSummaries = reactive<Partial<Record<QKey, string>>>({})

const quadrantDefs = [
  { key: 'q1' as QKey, label: '立刻去做', sub: '紧急 & 重要', emoji: '🔥', color: 'q1' },
  { key: 'q2' as QKey, label: '计划安排', sub: '不紧急 & 重要', emoji: '🌱', color: 'q2' },
  { key: 'q3' as QKey, label: '委托他人', sub: '紧急 & 不重要', emoji: '🐣', color: 'q3' },
  { key: 'q4' as QKey, label: '择机处理', sub: '不紧急 & 不重要', emoji: '☁️', color: 'q4' },
]

// ---- Persistence ----
const storageKey = () => `tg-data-${props.profile.id}`
const settingsKey = () => `tg-settings-${props.profile.id}`

function load() {
  try {
    const raw = localStorage.getItem(storageKey())
    if (raw) Object.assign(data, JSON.parse(raw))
  } catch {}
  try {
    const raw = localStorage.getItem(settingsKey())
    if (raw) {
      const s = JSON.parse(raw)
      apiKey.value = s.apiKey || ''
      apiBase.value = s.apiBase || 'https://api.deepseek.com/v1'
    }
  } catch {}
  localStorage.setItem('tg-last-profile', props.profile.id)
}

function save() {
  localStorage.setItem(storageKey(), JSON.stringify(data))
}

watch(data, save, { deep: true })

// ---- Node CRUD ----
function openAdd(qkey: QKey, payload: { parentId?: string; type: 'file'|'folder' }) {
  addTarget.value = { qkey, ...payload }
}

function makeId() { return `n-${Date.now()}-${Math.random().toString(36).slice(2,7)}` }

function confirmAdd(name: string, type: 'file'|'folder') {
  if (!addTarget.value) return
  const { qkey, parentId } = addTarget.value
  const now = new Date().toLocaleString('zh-CN', { hour12: false })
  const node: FileNode = {
    id: makeId(), type, name,
    content: type === 'file' ? '' : undefined,
    children: type === 'folder' ? [] : undefined,
    createdAt: now, updatedAt: now,
  }
  if (parentId) {
    const parent = findNode(data[qkey], parentId)
    if (parent?.children) parent.children.push(node)
  } else {
    data[qkey].push(node)
  }
  addTarget.value = null
  save()
  if (type === 'file') openedFile.value = { node, qkey }
}

function findNode(nodes: FileNode[], id: string): FileNode | null {
  for (const n of nodes) {
    if (n.id === id) return n
    if (n.children) { const f = findNode(n.children, id); if (f) return f }
  }
  return null
}

function deleteNode(qkey: QKey, nodeId: string) {
  deleteFromList(data[qkey], nodeId); save()
}

function deleteFromList(nodes: FileNode[], id: string): boolean {
  const idx = nodes.findIndex(n => n.id === id)
  if (idx !== -1) { nodes.splice(idx, 1); return true }
  for (const n of nodes) {
    if (n.children && deleteFromList(n.children, id)) return true
  }
  return false
}

function renameNode(qkey: QKey, nodeId: string, newName: string) {
  const n = findNode(data[qkey], nodeId)
  if (n) { n.name = newName; n.updatedAt = new Date().toLocaleString('zh-CN', { hour12: false }) }
  save()
}

function moveNode(fromQ: QKey, toQ: QKey, nodeId: string) {
  const node = findNode(data[fromQ], nodeId)
  if (!node) return
  deleteFromList(data[fromQ], nodeId)
  data[toQ].push(node)
  save()
}

function openFile(qkey: QKey, node: FileNode) {
  openedFile.value = { node, qkey }
}

function saveFileContent(nodeId: string, content: string, qkey: QKey) {
  const n = findNode(data[qkey], nodeId)
  if (n) { n.content = content; n.updatedAt = new Date().toLocaleString('zh-CN', { hour12: false }) }
  if (openedFile.value) openedFile.value.node.content = content
  save()
}

// ---- 悬浮球快速添加 ----
function handleQuickAdd(qkey: QKey, title: string) {
  const now = new Date().toLocaleString('zh-CN', { hour12: false })
  const node: FileNode = {
    id: makeId(), type: 'file', name: title,
    content: '', createdAt: now, updatedAt: now,
  }
  data[qkey].push(node)
  save()
  // 移动端切换到对应象限
  if (isMobile.value) mobileActiveQ.value = qkey
}

// ---- 文件拖入 ----
function handleFileDrop(qkey: QKey, files: File[], parentId?: string) {
  for (const file of files) {
    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string || ''
      const now = new Date().toLocaleString('zh-CN', { hour12: false })
      const node: FileNode = { id: makeId(), type: 'file', name: file.name, content, createdAt: now, updatedAt: now }
      if (parentId) {
        const parent = findNode(data[qkey], parentId)
        if (parent?.children) parent.children.push(node)
      } else {
        data[qkey].push(node)
      }
      save()
      if (apiKey.value) autoAnalyzeFile(node, qkey)
    }
    reader.readAsText(file, 'utf-8')
  }
}

// ---- AI ----
async function callDeepSeek(messages: {role:string; content:string}[], maxTokens=800): Promise<string> {
  const resp = await fetch(`${apiBase.value}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey.value}` },
    body: JSON.stringify({ model: 'deepseek-chat', messages, max_tokens: maxTokens, stream: false }),
  })
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
  const d = await resp.json()
  return d.choices?.[0]?.message?.content || ''
}

async function analyzeQuadrant(qkey: QKey) {
  if (!apiKey.value) { alert('请先在 ⚙️ 设置中填写 DeepSeek API Key'); return }
  aiLoadingQ.value = qkey
  try {
    const nodesSummary = summarizeNodes(data[qkey], 0)
    const qLabels: Record<QKey,string> = { q1:'紧急且重要', q2:'不紧急但重要', q3:'紧急但不重要', q4:'不紧急也不重要' }
    const reply = await callDeepSeek([{
      role: 'user',
      content: `梳理【${qLabels[qkey]}】象限的任务/文件（200字内，用emoji）：\n\n${nodesSummary || '（空）'}`
    }], 400)
    aiSummaries[qkey] = reply
  } catch(e: any) {
    aiSummaries[qkey] = `❌ 失败：${e.message}`
  } finally {
    aiLoadingQ.value = null
  }
}

async function analyzeFile(node: FileNode, qkey: QKey): Promise<string> {
  if (!apiKey.value) return ''
  try {
    const reply = await callDeepSeek([{
      role: 'user',
      content: `对文件「${node.name}」做简洁摘要和关键点提炼（150字内）：\n${(node.content||'').slice(0,3000)}`
    }], 300)
    const found = findNode(data[qkey], node.id)
    if (found) found.aiSummary = reply
    save()
    return reply
  } catch { return '' }
}

async function autoAnalyzeFile(node: FileNode, qkey: QKey) {
  if (!node.content?.trim()) return
  await analyzeFile(node, qkey)
}

function summarizeNodes(nodes: FileNode[], depth: number): string {
  return nodes.map(n => {
    const indent = '  '.repeat(depth)
    if (n.type === 'folder') return `${indent}📁 ${n.name}\n${summarizeNodes(n.children||[], depth+1)}`
    const preview = (n.content||'').slice(0,200).replace(/\n/g,' ')
    return `${indent}📄 ${n.name}${preview ? '：'+preview : ''}`
  }).join('\n')
}

// ---- 工具 ----
function scrollTop() {
  document.querySelector('.quadrants')?.scrollTo({ top: 0, behavior: 'smooth' })
}

function toggleLayout() {
  const order: Array<'grid'|'list'|'focus'> = ['grid', 'list', 'focus']
  const idx = order.indexOf(layout.value)
  layout.value = order[(idx + 1) % order.length]
}

function saveSettings(key: string, base: string) {
  apiKey.value = key
  apiBase.value = base
  localStorage.setItem(settingsKey(), JSON.stringify({ apiKey: key, apiBase: base }))
  showSettings.value = false
}

function exportData() {
  const blob = new Blob([JSON.stringify({ profile: props.profile, data }, null, 2)], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `${props.profile.name}-任务花园.json`
  a.click()
}

function importData(raw: string) {
  try {
    const d = JSON.parse(raw)
    if (d.data) { Object.assign(data, d.data); save() }
    alert('导入成功！')
  } catch { alert('导入失败，格式不正确') }
  showSettings.value = false
}

onMounted(() => {
  load()
  checkMobile()
  window.addEventListener('resize', checkMobile)
  // URL 参数快速添加
  if (new URLSearchParams(location.search).get('quick') === '1') {
    setTimeout(() => {
      if (isMobile.value) mobileActiveQ.value = 'q1'
    }, 500)
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})
</script>

<style scoped>
.matrix-app { height: 100%; display: flex; flex-direction: column; overflow: hidden; }

/* ===== Desktop TopBar ===== */
.topbar {
  background: white;
  border-bottom: 1px solid var(--border);
  padding: 0 16px;
  height: 52px;
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
  box-shadow: 0 1px 8px rgba(0,0,0,0.05);
  z-index: 50;
}
.topbar-left { display: flex; align-items: center; gap: 8px; }
.topbar-avatar { font-size: 24px; }
.topbar-name { font-weight: 700; font-size: 15px; color: var(--accent); }
.topbar-sub { font-size: 12px; color: var(--text3); margin-left: 2px; }
.topbar-center { flex: 1; display: flex; align-items: center; justify-content: center; gap: 16px; }
.q-axis-label { font-size: 12px; font-weight: 600; }
.q-axis-label.urgent { color: var(--q1); }
.q-axis-label.not-urgent { color: var(--q4); }
.axis-divider-v { width: 1px; height: 20px; background: var(--border); }
.topbar-right { display: flex; gap: 8px; flex-shrink: 0; }

.icon-pill {
  padding: 6px 14px; border-radius: 20px;
  font-size: 13px; font-weight: 600;
  transition: all .18s;
}
.icon-pill { background: var(--accent-light); color: var(--accent); }
.icon-pill:hover { background: #ddd6fe; }
.icon-pill.active { background: var(--accent); color: white; }
.icon-pill.secondary { background: #fff3e0; color: #e65100; }
.icon-pill.secondary:hover { background: #ffe0b2; }
.icon-pill.ghost { background: transparent; color: var(--text3); border: 1px solid var(--border); }
.icon-pill.ghost:hover { background: var(--surface2); }

/* ===== Mobile TopBar ===== */
.mobile-topbar {
  background: white;
  border-bottom: 1px solid var(--border);
  padding: 0 12px;
  height: 50px;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
  box-shadow: 0 1px 8px rgba(0,0,0,0.05);
  padding-top: env(safe-area-inset-top, 0);
}
.mobile-back {
  font-size: 20px; color: var(--accent);
  padding: 4px 8px; border-radius: 8px;
}
.mobile-title {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 700;
  font-size: 15px;
  color: var(--accent);
}
.mobile-settings { font-size: 20px; padding: 4px 8px; border-radius: 8px; }

/* ===== Main body ===== */
.main-body {
  flex: 1;
  display: flex;
  overflow: hidden;
  padding: 10px;
  gap: 8px;
}

.is-mobile .main-body { padding: 8px 8px 0; }

/* ===== Side axis ===== */
.side-axis {
  width: 28px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.axis-label { writing-mode: vertical-rl; font-size: 11px; font-weight: 700; letter-spacing: 1px; }
.axis-label.important { color: var(--q2); }
.axis-label.not-important { color: var(--text3); }
.axis-divider-h { width: 1px; background: var(--border); height: 60px; }

/* ===== Quadrants ===== */
.quadrants {
  flex: 1;
  overflow: hidden;
}
.quadrants.grid-view {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 8px;
}
.quadrants.single-view {
  display: flex;
  flex-direction: column;
}

/* ===== AI 全屏（移动端） ===== */
.ai-fullscreen {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  flex-direction: column;
  padding-top: env(safe-area-inset-top, 0);
}
.ai-fullscreen > * { flex: 1; border-radius: 0 !important; }
</style>
