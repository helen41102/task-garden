<template>
  <!-- 悬浮球主体 -->
  <div
    class="float-ball-wrap"
    :style="{ bottom: ballPos.y + 'px', right: ballPos.x + 'px' }"
    ref="ballRef"
  >
    <!-- 展开菜单 -->
    <transition name="fab-expand">
      <div class="fab-menu" v-if="expanded">
        <!-- 快速添加表单 -->
        <div class="quick-form" v-if="showForm">
          <div class="qf-header">
            <span>⚡ 快速添加</span>
            <button @click="showForm = false; expanded = false">✕</button>
          </div>
          <input
            ref="quickInput"
            v-model="quickTitle"
            placeholder="任务名称..."
            class="qf-input"
            maxlength="80"
            @keyup.enter="submitQuick"
          />
          <div class="qf-quadrants">
            <button
              v-for="q in quadrants" :key="q.key"
              :class="['qf-q', q.key, { active: quickQ === q.key }]"
              @click="quickQ = q.key"
            >
              {{ q.emoji }}<span>{{ q.short }}</span>
            </button>
          </div>
          <button class="qf-submit" @click="submitQuick" :disabled="!quickTitle.trim()">
            ✨ 添加到「{{ currentQLabel }}」
          </button>
        </div>

        <!-- 快捷按钮组 -->
        <div class="fab-actions" v-else>
          <button class="fab-action" @click="openQuickAdd" title="快速添加任务">
            <span class="fa-icon">📝</span>
            <span class="fa-label">快速添加</span>
          </button>
          <button class="fab-action" @click="$emit('open-ai')" title="AI 助手">
            <span class="fa-icon">🤖</span>
            <span class="fa-label">AI 助手</span>
          </button>
          <button class="fab-action" @click="$emit('scroll-top')" title="回到顶部">
            <span class="fa-icon">⬆️</span>
            <span class="fa-label">回顶部</span>
          </button>
          <button class="fab-action" @click="$emit('toggle-layout')" title="切换视图">
            <span class="fa-icon">{{ layoutIcon }}</span>
            <span class="fa-label">{{ layoutLabel }}</span>
          </button>
        </div>
      </div>
    </transition>

    <!-- 悬浮球按钮 -->
    <button
      class="fab-btn"
      :class="{ expanded, dragging: isDragging }"
      @click="toggleExpand"
      @touchstart.passive="onTouchStart"
      @touchmove.passive="onTouchMove"
      @touchend="onTouchEnd"
      @mousedown="onMouseDown"
    >
      <span class="fab-icon" :class="{ spin: expanded }">{{ expanded ? '✕' : '🌸' }}</span>
      <span class="fab-badge" v-if="urgentCount > 0">{{ urgentCount }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted } from 'vue'
import type { QKey, FileNode } from './MatrixApp.vue'

interface MatrixData { q1: FileNode[]; q2: FileNode[]; q3: FileNode[]; q4: FileNode[] }

const props = defineProps<{
  data: MatrixData
  layout: 'grid' | 'list' | 'focus'
}>()

const emit = defineEmits(['quick-add', 'open-ai', 'scroll-top', 'toggle-layout'])

// ---- 状态 ----
const expanded = ref(false)
const showForm = ref(false)
const quickTitle = ref('')
const quickQ = ref<QKey>('q1')
const quickInput = ref<HTMLInputElement | null>(null)
const ballRef = ref<HTMLElement | null>(null)
const isDragging = ref(false)

// 悬浮球位置（right/bottom 距离）
const ballPos = ref({ x: 20, y: 90 })

// 统计紧急任务数
const urgentCount = computed(() => {
  const countNodes = (nodes: FileNode[]): number =>
    nodes.reduce((acc, n) => acc + (n.type === 'file' ? 1 : countNodes(n.children || [])), 0)
  return countNodes(props.data.q1)
})

const quadrants = [
  { key: 'q1' as QKey, emoji: '🔥', short: '立刻' },
  { key: 'q2' as QKey, emoji: '🌱', short: '计划' },
  { key: 'q3' as QKey, emoji: '🐣', short: '委托' },
  { key: 'q4' as QKey, emoji: '☁️', short: '择机' },
]

const currentQLabel = computed(() => quadrants.find(q => q.key === quickQ.value)?.short || '')

const layoutIcon = computed(() => ({ grid: '≡', list: '⊞', focus: '⊟' }[props.layout]))
const layoutLabel = computed(() => ({ grid: '列表视图', list: '专注视图', focus: '网格视图' }[props.layout]))

function toggleExpand() {
  if (isDragging.value) return
  expanded.value = !expanded.value
  if (!expanded.value) showForm.value = false
}

async function openQuickAdd() {
  showForm.value = true
  await nextTick()
  quickInput.value?.focus()
}

function submitQuick() {
  if (!quickTitle.value.trim()) return
  emit('quick-add', quickQ.value, quickTitle.value.trim())
  quickTitle.value = ''
  showForm.value = false
  expanded.value = false
}

// ---- 拖拽悬浮球（touch） ----
let touchStartX = 0
let touchStartY = 0
let ballStartX = 0
let ballStartY = 0
let moveThreshold = false

function onTouchStart(e: TouchEvent) {
  const t = e.touches[0]
  touchStartX = t.clientX
  touchStartY = t.clientY
  ballStartX = ballPos.value.x
  ballStartY = ballPos.value.y
  moveThreshold = false
  isDragging.value = false
}

function onTouchMove(e: TouchEvent) {
  const t = e.touches[0]
  const dx = t.clientX - touchStartX
  const dy = t.clientY - touchStartY
  if (!moveThreshold && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
    moveThreshold = true
    isDragging.value = true
  }
  if (!moveThreshold) return

  const vw = window.innerWidth
  const vh = window.innerHeight
  const bSize = 56

  // right = 初始right - dx，bottom = 初始bottom - dy
  const newX = Math.max(8, Math.min(vw - bSize - 8, ballStartX - dx))
  const newY = Math.max(80, Math.min(vh - bSize - 8, ballStartY - dy))
  ballPos.value = { x: newX, y: newY }
}

function onTouchEnd() {
  setTimeout(() => { isDragging.value = false }, 100)
  // 吸附到两侧
  const vw = window.innerWidth
  const bSize = 56
  if (ballPos.value.x < vw / 2 - bSize / 2) {
    ballPos.value.x = 8
  } else {
    ballPos.value.x = 20
  }
  // 保存位置
  localStorage.setItem('fab-pos', JSON.stringify(ballPos.value))
}

// ---- 鼠标拖拽（桌面端） ----
function onMouseDown(e: MouseEvent) {
  const startX = e.clientX
  const startY = e.clientY
  const startBX = ballPos.value.x
  const startBY = ballPos.value.y
  let moved = false

  const onMove = (me: MouseEvent) => {
    const dx = me.clientX - startX
    const dy = me.clientY - startY
    if (!moved && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) moved = true
    if (!moved) return
    isDragging.value = true
    const vw = window.innerWidth, vh = window.innerHeight, b = 56
    ballPos.value = {
      x: Math.max(8, Math.min(vw - b - 8, startBX - dx)),
      y: Math.max(80, Math.min(vh - b - 8, startBY - dy))
    }
  }
  const onUp = () => {
    setTimeout(() => { isDragging.value = false }, 100)
    localStorage.setItem('fab-pos', JSON.stringify(ballPos.value))
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', onUp)
  }
  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', onUp)
}

onMounted(() => {
  const saved = localStorage.getItem('fab-pos')
  if (saved) {
    try { ballPos.value = JSON.parse(saved) } catch {}
  }
})
</script>

<style scoped>
.float-ball-wrap {
  position: fixed;
  z-index: 999;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
  /* 让 bottom/right 通过 style 控制 */
}

/* 悬浮球 */
.fab-btn {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #7c3aed, #db2777);
  box-shadow: 0 4px 20px rgba(124, 58, 237, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  position: relative;
  -webkit-tap-highlight-color: transparent;
  touch-action: none;
  user-select: none;
}
.fab-btn:hover { transform: scale(1.08); box-shadow: 0 6px 28px rgba(124, 58, 237, 0.55); }
.fab-btn.expanded { background: linear-gradient(135deg, #dc2626, #7c3aed); }
.fab-btn.dragging { opacity: 0.85; }

.fab-icon { font-size: 24px; transition: transform 0.3s; line-height: 1; }
.fab-icon.spin { transform: rotate(90deg); }

.fab-badge {
  position: absolute;
  top: -2px;
  right: -2px;
  background: #ef4444;
  color: white;
  font-size: 10px;
  font-weight: 800;
  min-width: 18px;
  height: 18px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
  border: 2px solid white;
}

/* 展开菜单 */
.fab-menu {
  background: white;
  border-radius: 18px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
  overflow: hidden;
  width: 220px;
}

.fab-expand-enter-active, .fab-expand-leave-active {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  transform-origin: bottom right;
}
.fab-expand-enter-from, .fab-expand-leave-to {
  opacity: 0;
  transform: scale(0.85) translateY(10px);
}

/* 快捷按钮组 */
.fab-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1px;
  background: #f0f0f0;
}
.fab-action {
  background: white;
  padding: 14px 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  cursor: pointer;
  transition: background 0.15s;
}
.fab-action:hover { background: #faf5ff; }
.fa-icon { font-size: 22px; }
.fa-label { font-size: 11px; font-weight: 600; color: #555; }

/* 快速添加表单 */
.quick-form { padding: 14px; }
.qf-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 800;
  font-size: 14px;
  margin-bottom: 10px;
  color: #7c3aed;
}
.qf-header button { color: #aaa; font-size: 14px; padding: 2px 6px; border-radius: 5px; }
.qf-header button:hover { background: #f0f0f0; }

.qf-input {
  width: 100%;
  padding: 9px 12px;
  border: 1.5px solid #e0e0fe;
  border-radius: 10px;
  font-size: 13px;
  margin-bottom: 10px;
  outline: none;
  transition: border-color 0.2s;
}
.qf-input:focus { border-color: #7c3aed; }

.qf-quadrants {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 5px;
  margin-bottom: 10px;
}
.qf-q {
  padding: 6px 4px;
  border-radius: 8px;
  border: 1.5px solid #eee;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  cursor: pointer;
  transition: all 0.15s;
}
.qf-q span { font-size: 11px; font-weight: 600; }
.qf-q.q1.active { border-color: #ff6b6b; background: #fff5f5; color: #ff6b6b; }
.qf-q.q2.active { border-color: #26de81; background: #f0fff8; color: #059669; }
.qf-q.q3.active { border-color: #fd9644; background: #fff9f0; color: #d97706; }
.qf-q.q4.active { border-color: #a29bfe; background: #f8f7ff; color: #7c3aed; }

.qf-submit {
  width: 100%;
  padding: 10px;
  background: linear-gradient(135deg, #7c3aed, #db2777);
  color: white;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 700;
  transition: opacity 0.15s;
}
.qf-submit:disabled { opacity: 0.4; cursor: not-allowed; }
.qf-submit:hover:not(:disabled) { opacity: 0.88; }
</style>
