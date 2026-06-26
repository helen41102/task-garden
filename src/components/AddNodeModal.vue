<template>
  <div class="modal-mask" @click.self="$emit('cancel')">
    <div class="modal">
      <div class="modal-header">
        <span>{{ target?.type === 'folder' ? '📁 新建文件夹' : '📄 新建文件' }}</span>
        <button @click="$emit('cancel')">✕</button>
      </div>
      <div class="modal-body">
        <input
          ref="inp"
          v-model="name"
          :placeholder="target?.type === 'folder' ? '文件夹名称...' : '文件名称（如 todo.md）'"
          class="name-inp"
          maxlength="60"
          @keyup.enter="confirm"
          @keyup.escape="$emit('cancel')"
        />
        <div class="type-toggle" v-if="!target?.parentId">
          <button :class="{ active: localType === 'file' }" @click="localType = 'file'">📄 文件</button>
          <button :class="{ active: localType === 'folder' }" @click="localType = 'folder'">📁 文件夹</button>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-cancel" @click="$emit('cancel')">取消</button>
        <button class="btn-ok" @click="confirm" :disabled="!name.trim()">创建</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onMounted } from 'vue'

const props = defineProps<{
  target: { qkey: string; parentId?: string; type: 'file' | 'folder' } | null
}>()
const emit = defineEmits(['confirm', 'cancel'])

const name = ref('')
const localType = ref<'file'|'folder'>('file')
const inp = ref<HTMLInputElement|null>(null)

watch(() => props.target, (t) => {
  if (t) { localType.value = t.type; name.value = '' }
})
onMounted(async () => { await nextTick(); inp.value?.focus() })

function confirm() {
  if (!name.value.trim()) return
  emit('confirm', name.value.trim(), localType.value)
}
</script>

<style scoped>
.modal-mask {
  position: fixed; inset: 0;
  background: rgba(0,0,0,.35);
  z-index: 400;
  display: flex; align-items: center; justify-content: center;
  padding: 20px;
}
.modal {
  background: white;
  border-radius: 18px;
  width: 100%;
  max-width: 360px;
  box-shadow: var(--shadow-lg);
  overflow: hidden;
}
.modal-header {
  padding: 14px 18px;
  background: linear-gradient(135deg, #ede9fe, #dbeafe);
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 700;
  font-size: 15px;
}
.modal-header button { background: rgba(0,0,0,.08); border-radius: 50%; width: 26px; height: 26px; font-size: 13px; display:flex;align-items:center;justify-content:center; }
.modal-body { padding: 16px 18px; display: flex; flex-direction: column; gap: 12px; }
.name-inp {
  width: 100%; padding: 10px 14px;
  border: 1.5px solid var(--border); border-radius: 10px;
  font-size: 14px; transition: border-color .2s;
}
.name-inp:focus { border-color: var(--accent); }
.type-toggle { display: flex; gap: 8px; }
.type-toggle button {
  flex: 1; padding: 8px; border-radius: 10px;
  border: 1.5px solid var(--border);
  font-size: 13px; transition: all .15s;
}
.type-toggle button.active { border-color: var(--accent); background: var(--accent-light); color: var(--accent); font-weight: 700; }
.modal-footer { padding: 10px 18px 16px; display: flex; gap: 10px; justify-content: flex-end; }
.btn-cancel { padding: 9px 20px; background: var(--surface2); border-radius: 10px; color: var(--text2); font-size: 14px; }
.btn-ok {
  padding: 9px 24px; background: var(--accent); color: white;
  border-radius: 10px; font-size: 14px; font-weight: 700; transition: opacity .15s;
}
.btn-ok:disabled { opacity: .4; cursor: not-allowed; }
.btn-ok:hover:not(:disabled) { opacity: .85; }
</style>
