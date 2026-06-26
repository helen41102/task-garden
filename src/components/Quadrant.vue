<template>
  <div
    class="quadrant"
    :class="[`q-${qkey}`, { 'drag-over': isDragOver }]"
    @dragover.prevent="isDragOver = true"
    @dragleave="isDragOver = false"
    @drop.prevent="onDrop"
  >
    <!-- Header -->
    <div class="q-header">
      <span class="q-emoji">{{ emoji }}</span>
      <div class="q-titles">
        <span class="q-label">{{ label }}</span>
        <span class="q-sub">{{ sub }}</span>
      </div>
      <div class="q-actions">
        <button class="q-btn" @click="$emit('ai-analyze')" :title="`AI 梳理${label}象限`">
          {{ aiLoading ? '⏳' : '🤖' }}
        </button>
        <button class="q-btn" @click="$emit('add', { type: 'folder' })" title="新建文件夹">📁</button>
        <button class="q-btn" @click="$emit('add', { type: 'file' })" title="新建文件">📄</button>
      </div>
    </div>

    <!-- AI 摘要 -->
    <transition name="slide-up">
      <div class="ai-summary" v-if="aiSummary">
        <span class="ai-summary-icon">🤖</span>
        <span class="ai-summary-text">{{ aiSummary }}</span>
        <button class="ai-summary-close" @click="$emit('clear-summary')">✕</button>
      </div>
    </transition>

    <!-- 文件树 -->
    <div class="q-body" ref="dropZone">
      <div v-if="nodes.length === 0" class="q-empty">
        <span>拖入文件 或 点击 📄📁 添加</span>
      </div>
      <TreeNode
        v-for="node in nodes"
        :key="node.id"
        :node="node"
        :qkey="qkey"
        :depth="0"
        @open-file="(n) => $emit('open-file', qkey, n)"
        @add="(payload) => $emit('add', payload)"
        @delete="(id) => $emit('delete-node', qkey, id)"
        @rename="(id, name) => $emit('rename-node', qkey, id, name)"
        @move="(toQ, id) => $emit('move-node', qkey, toQ, id)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import TreeNode from './TreeNode.vue'
import type { FileNode, QKey } from './MatrixApp.vue'

defineProps<{
  qkey: QKey
  label: string
  sub: string
  emoji: string
  color: string
  nodes: FileNode[]
  aiLoading?: boolean
  aiSummary?: string
  isMobile?: boolean
}>()

const emit = defineEmits([
  'add', 'open-file', 'delete-node', 'rename-node', 'move-node',
  'ai-analyze', 'clear-summary', 'drop-file'
])

const isDragOver = ref(false)

const props2 = undefined // qkey already in main props
function onDrop(e: DragEvent) {
  isDragOver.value = false
  if (e.dataTransfer?.files?.length) {
    emit('drop-file', Array.from(e.dataTransfer.files))
  }
}
</script>

<style scoped>
.quadrant {
  background: white;
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: box-shadow .2s, border-color .2s;
  border: 2px solid transparent;
}
.quadrant.drag-over { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-light); }

/* color themes */
.q-q1 { border-top: 3px solid var(--q1); }
.q-q2 { border-top: 3px solid var(--q2); }
.q-q3 { border-top: 3px solid var(--q3); }
.q-q4 { border-top: 3px solid var(--q4); }

.q-q1 .q-header { background: var(--q1-light); }
.q-q2 .q-header { background: var(--q2-light); }
.q-q3 .q-header { background: var(--q3-light); }
.q-q4 .q-header { background: var(--q4-light); }

.q-header {
  padding: 8px 10px;
  display: flex;
  align-items: center;
  gap: 7px;
  flex-shrink: 0;
}

.q-emoji { font-size: 20px; animation: float 3s ease-in-out infinite; }
.q-q2 .q-emoji { animation-delay: .5s }
.q-q3 .q-emoji { animation-delay: 1s }
.q-q4 .q-emoji { animation-delay: 1.5s }
@keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }

.q-titles { flex: 1; min-width: 0; }
.q-label { font-weight: 800; font-size: 13px; display: block; }
.q-q1 .q-label { color: var(--q1); }
.q-q2 .q-label { color: var(--q2); }
.q-q3 .q-label { color: var(--q3); }
.q-q4 .q-label { color: var(--q4); }
.q-sub { font-size: 10px; color: var(--text3); }

.q-actions { display: flex; gap: 3px; }
.q-btn {
  width: 26px; height: 26px;
  border-radius: 7px;
  font-size: 14px;
  display: flex; align-items: center; justify-content: center;
  transition: background .15s;
}
.q-btn:hover { background: rgba(0,0,0,0.08); }

.ai-summary {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  padding: 8px 10px;
  background: #f0f0ff;
  border-bottom: 1px solid #e0e0ef;
  font-size: 11px;
  line-height: 1.5;
  color: #444;
}
.ai-summary-icon { flex-shrink: 0; font-size: 14px; }
.ai-summary-text { flex: 1; }
.ai-summary-close {
  flex-shrink: 0;
  font-size: 11px;
  color: var(--text3);
  padding: 1px 4px;
  border-radius: 4px;
}
.ai-summary-close:hover { background: #ddd; }

.q-body {
  flex: 1;
  overflow-y: auto;
  padding: 6px;
}

.q-empty {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text3);
  font-size: 12px;
  flex-direction: column;
  gap: 6px;
  min-height: 60px;
}
</style>
