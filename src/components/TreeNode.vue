<template>
  <div class="tree-node">
    <!-- 行 -->
    <div
      class="node-row"
      :class="{ 'is-folder': node.type === 'folder', 'is-file': node.type === 'file', renaming }"
      :style="{ paddingLeft: `${depth * 16 + 4}px` }"
      @click="handleClick"
      @dblclick="startRename"
      @contextmenu.prevent="showCtx = !showCtx"
      @dragover.prevent
      @drop.stop.prevent="onDrop"
    >
      <!-- 折叠图标（folder） -->
      <span v-if="node.type === 'folder'" class="fold-icon" @click.stop="open = !open">
        {{ open ? '▾' : '▸' }}
      </span>
      <span v-else class="fold-icon file-dot">·</span>

      <!-- 图标 -->
      <span class="node-icon">{{ node.type === 'folder' ? (open ? '📂' : '📁') : fileIcon }}</span>

      <!-- 名称 / 重命名 -->
      <input
        v-if="renaming"
        ref="renameInput"
        v-model="renameBuf"
        class="rename-input"
        @keyup.enter="confirmRename"
        @keyup.escape="renaming = false"
        @blur="confirmRename"
        @click.stop
      />
      <span v-else class="node-name">{{ node.name }}</span>

      <!-- AI 摘要小标 -->
      <span v-if="node.aiSummary && node.type === 'file'" class="ai-badge" :title="node.aiSummary">🤖</span>

      <!-- 操作 -->
      <div class="node-ops" v-if="!renaming" @click.stop>
        <template v-if="node.type === 'folder'">
          <button @click.stop="$emit('add', { parentId: node.id, type: 'folder' })" title="新建子文件夹">📁</button>
          <button @click.stop="$emit('add', { parentId: node.id, type: 'file' })" title="新建文件">📄</button>
        </template>
        <button @click.stop="startRename" title="重命名">✏️</button>
        <button @click.stop="showMove = !showMove" title="移动到其他象限">↗️</button>
        <button @click.stop="confirmDelete" title="删除">🗑</button>
      </div>
    </div>

    <!-- 移动菜单 -->
    <transition name="fade">
      <div class="move-menu" v-if="showMove" v-click-outside="() => showMove = false">
        <p class="move-title">移动到</p>
        <button v-for="q in moveTargets" :key="q.key" @click="doMove(q.key)">
          {{ q.emoji }} {{ q.label }}
        </button>
      </div>
    </transition>

    <!-- 子节点 -->
    <transition name="slide-up">
      <div class="children" v-if="node.type === 'folder' && open">
        <div v-if="node.children?.length === 0" class="children-empty">空文件夹</div>
        <TreeNode
          v-for="child in node.children"
          :key="child.id"
          :node="child"
          :qkey="qkey"
          :depth="depth + 1"
          @open-file="$emit('open-file', $event)"
          @add="$emit('add', $event)"
          @delete="$emit('delete', $event)"
          @rename="$emit('rename', $event, $event)"
          @move="$emit('move', $event, $event)"
        />
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import type { FileNode, QKey } from './MatrixApp.vue'

const props = defineProps<{
  node: FileNode
  qkey: QKey
  depth: number
}>()

const emit = defineEmits(['open-file', 'add', 'delete', 'rename', 'move'])

const open = ref(true)
const renaming = ref(false)
const renameBuf = ref('')
const renameInput = ref<HTMLInputElement | null>(null)
const showMove = ref(false)

const fileExt = computed(() => props.node.name.split('.').pop()?.toLowerCase() || '')
const fileIcon = computed(() => {
  const ext = fileExt.value
  if (['md','txt','text'].includes(ext)) return '📝'
  if (['png','jpg','jpeg','gif','webp','svg'].includes(ext)) return '🖼️'
  if (['pdf'].includes(ext)) return '📑'
  if (['js','ts','jsx','tsx','vue','py','java','go','rs'].includes(ext)) return '💻'
  if (['json','yaml','yml','toml'].includes(ext)) return '⚙️'
  if (['zip','tar','gz'].includes(ext)) return '📦'
  return '📄'
})

const moveTargets = computed(() => {
  const all = [
    { key: 'q1' as QKey, emoji: '🔥', label: '立刻去做' },
    { key: 'q2' as QKey, emoji: '🌱', label: '计划安排' },
    { key: 'q3' as QKey, emoji: '🐣', label: '委托他人' },
    { key: 'q4' as QKey, emoji: '☁️', label: '择机处理' },
  ]
  return all.filter(q => q.key !== props.qkey)
})

function handleClick() {
  if (props.node.type === 'file') {
    emit('open-file', props.node)
  } else {
    open.value = !open.value
  }
}

async function startRename() {
  renameBuf.value = props.node.name
  renaming.value = true
  await nextTick()
  renameInput.value?.focus()
  renameInput.value?.select()
}

function confirmRename() {
  if (renameBuf.value.trim() && renameBuf.value !== props.node.name) {
    emit('rename', props.node.id, renameBuf.value.trim())
  }
  renaming.value = false
}

function confirmDelete() {
  if (props.node.type === 'folder' && (props.node.children?.length || 0) > 0) {
    if (!confirm(`删除文件夹「${props.node.name}」及其所有内容？`)) return
  }
  emit('delete', props.node.id)
}

function doMove(toQ: QKey) {
  emit('move', toQ, props.node.id)
  showMove.value = false
}

function onDrop(e: DragEvent) {
  // 拖拽系统文件到文件夹
  if (props.node.type === 'folder' && e.dataTransfer?.files?.length) {
    // TODO: handled by parent
  }
}

// v-click-outside directive (inline simple)
const vClickOutside = {
  mounted(el: HTMLElement, binding: any) {
    (el as any)._clickOutside = (e: Event) => {
      if (!el.contains(e.target as Node)) binding.value(e)
    }
    document.addEventListener('click', (el as any)._clickOutside)
  },
  unmounted(el: HTMLElement) {
    document.removeEventListener('click', (el as any)._clickOutside)
  }
}
</script>

<style scoped>
.tree-node { position: relative; }

.node-row {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 6px;
  border-radius: 7px;
  cursor: pointer;
  transition: background .15s;
  position: relative;
  min-height: 28px;
}
.node-row:hover { background: var(--surface2); }
.node-row.is-file:hover { background: var(--accent-light); }

.fold-icon {
  width: 14px;
  flex-shrink: 0;
  font-size: 11px;
  color: var(--text3);
  text-align: center;
}
.file-dot { color: var(--text3); }

.node-icon { font-size: 14px; flex-shrink: 0; }

.node-name {
  flex: 1;
  font-size: 13px;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rename-input {
  flex: 1;
  font-size: 13px;
  border: 1.5px solid var(--accent);
  border-radius: 5px;
  padding: 1px 6px;
  background: white;
}

.ai-badge {
  font-size: 11px;
  flex-shrink: 0;
  opacity: .7;
}

.node-ops {
  display: none;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
}
.node-row:hover .node-ops { display: flex; }
.node-ops button {
  width: 22px; height: 22px;
  border-radius: 5px;
  font-size: 12px;
  display: flex; align-items: center; justify-content: center;
  transition: background .12s;
}
.node-ops button:hover { background: rgba(0,0,0,0.08); }

.move-menu {
  position: absolute;
  right: 0;
  top: 30px;
  background: white;
  border: 1px solid var(--border);
  border-radius: 10px;
  box-shadow: var(--shadow-lg);
  padding: 8px;
  z-index: 100;
  min-width: 140px;
}
.move-title { font-size: 11px; color: var(--text3); margin-bottom: 4px; padding: 0 4px; }
.move-menu button {
  display: block;
  width: 100%;
  text-align: left;
  padding: 6px 8px;
  border-radius: 7px;
  font-size: 13px;
  transition: background .12s;
}
.move-menu button:hover { background: var(--accent-light); }

.children { padding-left: 4px; }
.children-empty { padding: 4px 24px; font-size: 11px; color: var(--text3); font-style: italic; }
</style>
