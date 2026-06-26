<template>
  <div class="editor-overlay">
    <div class="editor-panel">
      <!-- Header -->
      <div class="editor-header">
        <div class="editor-header-left">
          <span class="file-icon">{{ fileIcon }}</span>
          <div>
            <div class="file-name">{{ node.name }}</div>
            <div class="file-meta">{{ node.updatedAt }} 最后更新</div>
          </div>
        </div>
        <div class="editor-header-right">
          <button class="hbtn ai" @click="doAiAnalyze" :disabled="aiLoading">
            {{ aiLoading ? '⏳ 分析中...' : '🤖 AI 梳理' }}
          </button>
          <button class="hbtn save" @click="doSave">💾 保存</button>
          <button class="hbtn close" @click="$emit('close')">✕</button>
        </div>
      </div>

      <!-- AI 摘要 -->
      <transition name="slide-up">
        <div class="ai-result" v-if="aiResult">
          <div class="ai-result-header">
            <span>🤖 AI 梳理结果</span>
            <button @click="aiResult = ''">✕</button>
          </div>
          <div class="ai-result-body" v-html="renderMd(aiResult)"></div>
        </div>
      </transition>

      <!-- 编辑器主体 -->
      <div class="editor-body">
        <!-- 工具栏 -->
        <div class="toolbar">
          <button @click="insert('**', '**')" title="粗体">B</button>
          <button @click="insert('*', '*')" title="斜体" style="font-style:italic">I</button>
          <button @click="insert('# ', '')" title="标题">H</button>
          <button @click="insert('- ', '')" title="列表">≡</button>
          <button @click="insert('- [ ] ', '')" title="待办">☐</button>
          <button @click="insert('`', '`')" title="代码">{'<>'}</button>
          <button @click="insert('> ', '')" title="引用">❝</button>
          <span class="toolbar-sep"></span>
          <button @click="togglePreview" :class="{ active: showPreview }">
            {{ showPreview ? '✏️ 编辑' : '👁 预览' }}
          </button>
          <span class="char-count">{{ content.length }} 字</span>
        </div>

        <!-- 编辑区 / 预览区 -->
        <div class="editor-split" :class="{ 'preview-mode': showPreview }">
          <textarea
            v-if="!showPreview"
            ref="editorRef"
            v-model="content"
            class="editor-textarea"
            placeholder="在这里写点什么...支持 Markdown 语法"
            @keydown.tab.prevent="insertTab"
          ></textarea>
          <div v-else class="preview" v-html="renderFull(content)"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { FileNode, QKey } from './MatrixApp.vue'

const props = defineProps<{
  node: FileNode
  apiKey: string
  apiBase: string
}>()
const emit = defineEmits(['close', 'save', 'ai-analyze'])

const content = ref(props.node.content || '')
const showPreview = ref(false)
const aiResult = ref(props.node.aiSummary || '')
const aiLoading = ref(false)
const editorRef = ref<HTMLTextAreaElement|null>(null)

const fileExt = computed(() => props.node.name.split('.').pop()?.toLowerCase() || '')
const fileIcon = computed(() => {
  const ext = fileExt.value
  if (['md','txt','text'].includes(ext)) return '📝'
  if (['png','jpg','jpeg','gif','webp'].includes(ext)) return '🖼️'
  if (['js','ts','jsx','tsx','vue','py'].includes(ext)) return '💻'
  return '📄'
})

function doSave() {
  emit('save', props.node.id, content.value)
}

async function doAiAnalyze() {
  if (!props.apiKey) { alert('请先配置 DeepSeek API Key'); return }
  aiLoading.value = true
  try {
    const resp = await fetch(`${props.apiBase}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${props.apiKey}` },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{
          role: 'user',
          content: `请对以下文件「${props.node.name}」做深度梳理：
1. 核心内容摘要（2-3句）
2. 关键点/行动项 列表
3. 需要注意的事项

文件内容：
${content.value.slice(0, 4000)}`
        }],
        max_tokens: 600,
        stream: false,
      })
    })
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
    const d = await resp.json()
    aiResult.value = d.choices?.[0]?.message?.content || ''
    emit('ai-analyze', props.node, aiResult.value)
  } catch(e: any) {
    aiResult.value = `❌ 分析失败：${e.message}`
  } finally {
    aiLoading.value = false
  }
}

function togglePreview() {
  if (!showPreview.value) doSave()
  showPreview.value = !showPreview.value
}

function insert(before: string, after: string) {
  const el = editorRef.value
  if (!el) return
  const start = el.selectionStart
  const end = el.selectionEnd
  const selected = content.value.slice(start, end)
  const replacement = before + selected + after
  content.value = content.value.slice(0, start) + replacement + content.value.slice(end)
  const newPos = start + before.length + selected.length
  setTimeout(() => { el.focus(); el.setSelectionRange(newPos, newPos) }, 0)
}

function insertTab() {
  insert('  ', '')
}

function renderMd(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/^## (.*)/gm, '<h2>$1</h2>')
    .replace(/^# (.*)/gm, '<h1>$1</h1>')
    .replace(/^- \[x\] (.*)/gm, '<li class="done">✅ $1</li>')
    .replace(/^- \[ \] (.*)/gm, '<li class="todo">☐ $1</li>')
    .replace(/^- (.*)/gm, '<li>• $1</li>')
    .replace(/^> (.*)/gm, '<blockquote>$1</blockquote>')
    .replace(/\n/g, '<br>')
}

function renderFull(text: string): string {
  return renderMd(text)
}

onMounted(() => {
  editorRef.value?.focus()
})
</script>

<style scoped>
.editor-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,.45);
  z-index: 300;
  display: flex; align-items: center; justify-content: center;
  padding: 16px;
}

.editor-panel {
  background: white;
  border-radius: 18px;
  width: 100%;
  max-width: 800px;
  height: 90vh;
  max-height: 700px;
  display: flex; flex-direction: column;
  box-shadow: var(--shadow-lg);
  overflow: hidden;
}

.editor-header {
  padding: 12px 16px;
  display: flex; align-items: center; justify-content: space-between;
  border-bottom: 1px solid var(--border);
  background: var(--surface2);
  flex-shrink: 0;
}
.editor-header-left { display: flex; align-items: center; gap: 10px; }
.file-icon { font-size: 28px; }
.file-name { font-weight: 700; font-size: 15px; }
.file-meta { font-size: 11px; color: var(--text3); }
.editor-header-right { display: flex; gap: 8px; align-items: center; }

.hbtn {
  padding: 7px 16px; border-radius: 20px; font-size: 13px; font-weight: 600;
  transition: opacity .15s, transform .15s;
}
.hbtn:hover { opacity: .85; }
.hbtn.ai { background: #ede9fe; color: var(--accent); }
.hbtn.ai:disabled { opacity: .5; cursor: not-allowed; }
.hbtn.save { background: var(--accent); color: white; }
.hbtn.close {
  background: var(--surface2); color: var(--text2);
  width: 30px; height: 30px; padding: 0; border-radius: 50%;
  display:flex;align-items:center;justify-content:center;
}

.ai-result {
  background: #fafafa;
  border-bottom: 1px solid var(--border);
  max-height: 160px;
  overflow-y: auto;
  flex-shrink: 0;
}
.ai-result-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 8px 14px;
  font-size: 12px; font-weight: 700; color: var(--accent);
  background: var(--accent-light);
  position: sticky; top: 0;
}
.ai-result-header button { font-size: 12px; color: var(--text3); padding: 2px 6px; border-radius: 4px; }
.ai-result-header button:hover { background: #ddd; }
.ai-result-body {
  padding: 10px 14px;
  font-size: 13px;
  line-height: 1.7;
  color: var(--text);
}
.ai-result-body :deep(h1) { font-size: 16px; margin: 6px 0 3px; }
.ai-result-body :deep(h2) { font-size: 14px; margin: 4px 0 2px; color: var(--accent); }
.ai-result-body :deep(li) { margin: 2px 0; }
.ai-result-body :deep(blockquote) { border-left: 3px solid var(--accent); padding-left: 8px; color: var(--text2); }
.ai-result-body :deep(code) { background: #f0f0f0; padding: 1px 4px; border-radius: 4px; font-size: 12px; }

.editor-body { flex: 1; display: flex; flex-direction: column; overflow: hidden; }

.toolbar {
  display: flex; align-items: center; gap: 2px;
  padding: 6px 10px;
  border-bottom: 1px solid var(--border);
  background: var(--surface2);
  flex-shrink: 0;
  flex-wrap: wrap;
}
.toolbar button {
  width: 28px; height: 28px;
  border-radius: 6px;
  font-size: 13px;
  display:flex;align-items:center;justify-content:center;
  transition: background .12s;
  font-weight: 600;
}
.toolbar button:hover, .toolbar button.active { background: var(--accent-light); color: var(--accent); }
.toolbar-sep { width: 1px; height: 20px; background: var(--border); margin: 0 4px; }
.char-count { margin-left: auto; font-size: 11px; color: var(--text3); }

.editor-split { flex: 1; overflow: hidden; }
.editor-textarea {
  width: 100%; height: 100%;
  border: none; resize: none;
  padding: 16px 18px;
  font-size: 14px;
  line-height: 1.8;
  color: var(--text);
  font-family: 'Menlo', 'Consolas', 'PingFang SC', monospace;
}
.editor-textarea:focus { outline: none; }

.preview {
  padding: 16px 18px;
  overflow-y: auto;
  height: 100%;
  font-size: 14px;
  line-height: 1.8;
}
.preview :deep(h1) { font-size: 20px; margin: 8px 0 6px; border-bottom: 2px solid var(--border); padding-bottom: 4px; }
.preview :deep(h2) { font-size: 17px; margin: 6px 0 4px; color: var(--accent); }
.preview :deep(li.done) { color: var(--text3); text-decoration: line-through; }
.preview :deep(li.todo) { color: var(--q1); }
.preview :deep(blockquote) { border-left: 3px solid var(--accent); padding-left: 12px; color: var(--text2); margin: 6px 0; }
.preview :deep(code) { background: #f0f0f0; padding: 1px 5px; border-radius: 4px; font-size: 12px; font-family: monospace; }
.preview :deep(strong) { font-weight: 700; }
</style>
