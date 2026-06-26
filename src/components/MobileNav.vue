<template>
  <div class="mobile-nav">
    <button
      v-for="q in tabs" :key="q.key"
      class="mnav-tab"
      :class="[q.key, { active: active === q.key }]"
      @click="$emit('switch', q.key)"
    >
      <span class="mnav-emoji">{{ q.emoji }}</span>
      <span class="mnav-label">{{ q.short }}</span>
      <span class="mnav-badge" v-if="counts[q.key] > 0">{{ counts[q.key] }}</span>
    </button>
    <button class="mnav-tab all" :class="{ active: active === 'all' }" @click="$emit('switch', 'all')">
      <span class="mnav-emoji">⊞</span>
      <span class="mnav-label">全览</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { FileNode, QKey } from './MatrixApp.vue'

interface MatrixData { q1: FileNode[]; q2: FileNode[]; q3: FileNode[]; q4: FileNode[] }

const props = defineProps<{
  data: MatrixData
  active: QKey | 'all'
}>()

defineEmits(['switch'])

const tabs = [
  { key: 'q1' as QKey, emoji: '🔥', short: '立刻做' },
  { key: 'q2' as QKey, emoji: '🌱', short: '计划' },
  { key: 'q3' as QKey, emoji: '🐣', short: '委托' },
  { key: 'q4' as QKey, emoji: '☁️', short: '择机' },
]

const countNodes = (nodes: FileNode[]): number =>
  nodes.reduce((acc, n) => acc + (n.type === 'file' ? 1 : countNodes(n.children || [])), 0)

const counts = computed(() => ({
  q1: countNodes(props.data.q1),
  q2: countNodes(props.data.q2),
  q3: countNodes(props.data.q3),
  q4: countNodes(props.data.q4),
}))
</script>

<style scoped>
.mobile-nav {
  display: flex;
  background: white;
  border-top: 1px solid #ebebeb;
  padding-bottom: env(safe-area-inset-bottom, 0);
  box-shadow: 0 -2px 12px rgba(0,0,0,0.07);
}

.mnav-tab {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 8px 4px;
  gap: 2px;
  cursor: pointer;
  position: relative;
  transition: all 0.15s;
  border-radius: 0;
  -webkit-tap-highlight-color: transparent;
}
.mnav-tab:hover { background: #fafafa; }
.mnav-tab.active { background: #faf5ff; }

.mnav-emoji { font-size: 20px; transition: transform 0.15s; }
.mnav-tab.active .mnav-emoji { transform: scale(1.2); }

.mnav-label {
  font-size: 10px;
  font-weight: 600;
  color: #aaa;
  transition: color 0.15s;
}
.mnav-tab.q1.active .mnav-label { color: #ff6b6b; }
.mnav-tab.q2.active .mnav-label { color: #059669; }
.mnav-tab.q3.active .mnav-label { color: #d97706; }
.mnav-tab.q4.active .mnav-label { color: #7c3aed; }
.mnav-tab.all.active .mnav-label { color: #7c3aed; }

.mnav-badge {
  position: absolute;
  top: 4px;
  right: calc(50% - 14px);
  background: #ef4444;
  color: white;
  font-size: 9px;
  font-weight: 800;
  min-width: 14px;
  height: 14px;
  border-radius: 7px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 3px;
}
</style>
