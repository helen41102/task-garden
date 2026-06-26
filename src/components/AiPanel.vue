<template>
  <div class="ai-panel">
    <div class="ai-header">
      <span>🤖 AI 全局助手</span>
      <button @click="$emit('close')">✕</button>
    </div>

    <div class="ai-chat" ref="chatBox">
      <div v-for="(msg, i) in messages" :key="i" class="msg" :class="msg.role">
        <div class="msg-avatar">{{ msg.role === 'user' ? '👤' : '🤖' }}</div>
        <div class="msg-bubble" v-html="renderMd(msg.content)"></div>
      </div>
      <div v-if="loading" class="msg assistant">
        <div class="msg-avatar">🤖</div>
        <div class="msg-bubble loading"><span></span><span></span><span></span></div>
      </div>
    </div>

    <div class="quick-actions">
      <button @click="send('分析我所有象限的任务总体情况，给出今日工作建议')">📊 全局分析</button>
      <button @click="send('哪个象限任务最多？如何合理分配精力？')">⚖️ 精力分配</button>
      <button @click="send('帮我梳理所有待处理的文件和任务，按重要程度排序')">📋 任务梳理</button>
      <button @click="send('给我一个今天的时间块规划建议')">🕐 时间规划</button>
    </div>

    <div class="ai-input-area">
      <textarea
        v-model="input"
        placeholder="输入问题，AI 会结合你的任务数据回答..."
        rows="2"
        @keydown.enter.prevent="(e) => { if(!e.shiftKey) send(input) }"
      ></textarea>
      <button class="send-btn" @click="send(input)" :disabled="loading || !input.trim()">
        {{ loading ? '⏳' : '发送' }}
      </button>
    </div>
    <p class="shift-tip">Shift+Enter 换行 · Enter 发送</p>
    <p v-if="!apiKey" class="no-key-tip">⚠️ 请先在 ⚙️ 设置中填写 DeepSeek API Key</p>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'
import type { QKey, FileNode } from './MatrixApp.vue'

interface MatrixData { q1: FileNode[]; q2: FileNode[]; q3: FileNode[]; q4: FileNode[] }

const props = defineProps<{ apiKey: string; apiBase: string; data: MatrixData }>()
const emit = defineEmits(['close'])

const messages = ref([{
  role: 'assistant',
  content: '👋 你好！我是你的 AI 任务助手。我已掌握你所有象限的任务信息，可以帮你分析、规划和梳理。点击快捷按钮或直接问我吧！'
}])
const input = ref('')
const loading = ref(false)
const chatBox = ref<HTMLElement|null>(null)

function getContext(): string {
  const labels: Record<QKey,string> = { q1:'紧急且重要🔥', q2:'不紧急但重要🌱', q3:'紧急但不重要🐣', q4:'不紧急也不重要☁️' }
  const parts: string[] = []
  for (const qk of ['q1','q2','q3','q4'] as QKey[]) {
    const nodes = props.data[qk]
    if (nodes.length === 0) continue
    parts.push(`【${labels[qk]}】\n${summarize(nodes, 0)}`)
  }
  return parts.join('\n\n') || '（暂无任务）'
}

function summarize(nodes: FileNode[], d: number): string {
  return nodes.map(n => {
    const pad = '  '.repeat(d)
    if (n.type === 'folder') return `${pad}📁 ${n.name}\n${summarize(n.children||[], d+1)}`
    const preview = (n.content||'').slice(0,300).replace(/\n/g,' ')
    return `${pad}📄 ${n.name}${preview ? '：'+preview : ''}`
  }).join('\n')
}

async function send(msg: string) {
  if (!msg.trim() || loading.value) return
  if (!props.apiKey) { messages.value.push({ role: 'assistant', content: '⚠️ 请先配置 DeepSeek API Key（点击右上角 ⚙️）' }); return }
  input.value = ''
  messages.value.push({ role: 'user', content: msg })
  loading.value = true
  scrollToBottom()

  try {
    const systemMsg = `你是一个专业的任务管理 AI 助手，用户正在使用艾森豪威尔四象限任务管理器。
当前用户的任务数据如下：
${getContext()}
请结合以上数据，用简洁友好的方式（可用 emoji）回答用户问题。如果任务为空，建议用户添加任务。`

    const historyMsgs = messages.value.slice(-8).map(m => ({ role: m.role, content: m.content }))

    const resp = await fetch(`${props.apiBase}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${props.apiKey}` },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'system', content: systemMsg }, ...historyMsgs],
        max_tokens: 800, stream: false,
      })
    })
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
    const d = await resp.json()
    messages.value.push({ role: 'assistant', content: d.choices?.[0]?.message?.content || '（无内容）' })
  } catch(e: any) {
    messages.value.push({ role: 'assistant', content: `❌ 请求失败：${e.message}` })
  } finally {
    loading.value = false
    scrollToBottom()
  }
}

function scrollToBottom() {
  nextTick(() => { if (chatBox.value) chatBox.value.scrollTop = chatBox.value.scrollHeight })
}

function renderMd(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/^### (.*)/gm, '<h3>$1</h3>')
    .replace(/^## (.*)/gm, '<h2>$1</h2>')
    .replace(/^# (.*)/gm, '<h1>$1</h1>')
    .replace(/^- (.*)/gm, '<li>• $1</li>')
    .replace(/\n/g, '<br>')
}
</script>

<style scoped>
.ai-panel {
  width: 320px;
  flex-shrink: 0;
  background: white;
  border-radius: var(--radius);
  box-shadow: var(--shadow-lg);
  display: flex; flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--border);
}

.ai-header {
  padding: 12px 14px;
  background: linear-gradient(135deg, #7c3aed, #db2777);
  color: white;
  display: flex; justify-content: space-between; align-items: center;
  font-weight: 700; font-size: 14px; flex-shrink: 0;
}
.ai-header button {
  background: rgba(255,255,255,.2); border-radius: 50%;
  width: 26px; height: 26px; color: white; font-size: 13px;
  display:flex;align-items:center;justify-content:center;
}

.ai-chat {
  flex: 1; overflow-y: auto; padding: 10px;
  display: flex; flex-direction: column; gap: 8px;
  min-height: 0;
}

.msg { display: flex; gap: 6px; align-items: flex-start; }
.msg.user { flex-direction: row-reverse; }
.msg-avatar { font-size: 18px; flex-shrink: 0; }
.msg-bubble {
  background: #f5f5f5; padding: 8px 12px;
  border-radius: 12px; font-size: 12px; line-height: 1.6;
  max-width: calc(100% - 32px);
}
.msg-bubble :deep(h1), .msg-bubble :deep(h2), .msg-bubble :deep(h3) { font-size: 13px; margin: 3px 0; color: var(--accent); }
.msg-bubble :deep(li) { margin: 1px 0; }
.msg-bubble :deep(code) { background: rgba(0,0,0,.08); padding: 1px 3px; border-radius: 3px; font-size: 11px; }
.msg.user .msg-bubble { background: linear-gradient(135deg, #7c3aed, #9333ea); color: white; }
.msg.user .msg-bubble :deep(h2), .msg.user .msg-bubble :deep(h3) { color: rgba(255,255,255,.8); }

.msg-bubble.loading {
  display: flex; gap: 3px; align-items: center; padding: 10px 14px;
}
.msg-bubble.loading span {
  width: 5px; height: 5px; background: #aaa; border-radius: 50%;
  animation: bounce 1.2s infinite;
}
.msg-bubble.loading span:nth-child(2) { animation-delay: .2s }
.msg-bubble.loading span:nth-child(3) { animation-delay: .4s }
@keyframes bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-5px)} }

.quick-actions {
  padding: 6px 8px;
  display: flex; flex-wrap: wrap; gap: 4px;
  border-top: 1px solid var(--border); flex-shrink: 0;
}
.quick-actions button {
  padding: 5px 10px; border-radius: 14px;
  background: var(--accent-light); color: var(--accent);
  font-size: 11px; font-weight: 600;
  border: 1px solid #ddd9fe;
  transition: background .15s;
}
.quick-actions button:hover { background: #ddd6fe; }

.ai-input-area {
  padding: 8px 10px;
  display: flex; gap: 6px;
  border-top: 1px solid var(--border); flex-shrink: 0;
}
.ai-input-area textarea {
  flex: 1; border: 1.5px solid var(--border); border-radius: 10px;
  padding: 8px 10px; font-size: 12px; resize: none;
  transition: border-color .2s;
}
.ai-input-area textarea:focus { border-color: var(--accent); outline: none; }

.send-btn {
  padding: 0 14px; background: var(--accent); color: white;
  border-radius: 10px; font-size: 13px; font-weight: 700;
  align-self: flex-end; height: 36px;
  transition: opacity .15s;
}
.send-btn:disabled { opacity: .4; cursor: not-allowed; }
.send-btn:hover:not(:disabled) { opacity: .85; }

.shift-tip, .no-key-tip { text-align: center; font-size: 10px; padding: 2px 6px 6px; flex-shrink: 0; }
.shift-tip { color: var(--text3); }
.no-key-tip { color: #e65100; font-weight: 600; }
</style>
