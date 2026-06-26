<template>
  <div class="modal-mask" @click.self="$emit('close')">
    <div class="settings-modal">
      <div class="s-header">
        <span>⚙️ 设置</span>
        <button @click="$emit('close')">✕</button>
      </div>
      <div class="s-body">
        <!-- 个人信息 -->
        <section>
          <h3>👤 个人空间</h3>
          <div class="s-row">
            <label>空间名称</label>
            <span class="s-val">{{ profile.avatar }} {{ profile.name }}</span>
          </div>
          <div class="s-row">
            <label>创建时间</label>
            <span class="s-val">{{ profile.createdAt }}</span>
          </div>
        </section>

        <section>
          <h3>🤖 DeepSeek AI</h3>
          <div class="s-field">
            <label>API Key</label>
            <div class="s-input-row">
              <input
                v-model="localKey"
                :type="showKey ? 'text' : 'password'"
                placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxx"
              />
              <button class="toggle-key" @click="showKey = !showKey">{{ showKey ? '🙈' : '👁' }}</button>
            </div>
          </div>
          <div class="s-field">
            <label>接口地址</label>
            <input v-model="localBase" type="text" placeholder="https://api.deepseek.com/v1" />
          </div>
          <p class="s-tip">
            💡 <a href="https://platform.deepseek.com" target="_blank">获取 DeepSeek API Key</a>
            · 也可替换为 OpenAI 兼容接口地址
          </p>
          <div class="s-tip-box">
            <strong>⚠️ GitHub Pages 使用说明</strong><br>
            若部署在 GitHub Pages 使用，DeepSeek API 需确保网络可访问。API Key 存储在你的浏览器本地，不会上传到任何服务器。
          </div>
        </section>

        <section>
          <h3>📦 数据管理</h3>
          <div class="data-btns">
            <button class="data-btn export" @click="$emit('export')">
              ⬇️ 导出数据（JSON）
            </button>
            <label class="data-btn import">
              ⬆️ 导入数据
              <input type="file" accept=".json" style="display:none" @change="onImport" />
            </label>
          </div>
          <p class="s-tip">数据自动保存在浏览器本地 localStorage，导出备份防止丢失</p>
        </section>

        <section>
          <h3>🌐 GitHub Pages 部署</h3>
          <p class="s-tip">本应用完全静态，可部署到 GitHub Pages 脱离内网使用：</p>
          <ol class="deploy-steps">
            <li>Fork 或克隆本项目到你的 GitHub 仓库</li>
            <li>在仓库 Settings → Pages 中启用 GitHub Pages</li>
            <li>选择 <code>gh-pages</code> 分支或 <code>main</code> 的 <code>/docs</code> 目录</li>
            <li>等待部署完成，访问 <code>https://你的名字.github.io/仓库名</code></li>
          </ol>
          <div class="s-tip-box github">
            项目源码：<a href="#" target="_blank">在 ⚙️ 中导出数据后，数据会保留在浏览器本地</a>
          </div>
        </section>
      </div>

      <div class="s-footer">
        <button class="btn-cancel" @click="$emit('close')">取消</button>
        <button class="btn-save" @click="save">保存设置</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  apiKey: string
  apiBase: string
  profile: { id: string; name: string; avatar: string; createdAt: string }
}>()
const emit = defineEmits(['close', 'save', 'export', 'import'])

const localKey = ref(props.apiKey)
const localBase = ref(props.apiBase)
const showKey = ref(false)

function save() {
  emit('save', localKey.value.trim(), localBase.value.trim() || 'https://api.deepseek.com/v1')
}

function onImport(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (ev) => emit('import', ev.target?.result as string)
  reader.readAsText(file)
}
</script>

<style scoped>
.modal-mask {
  position: fixed; inset: 0; background: rgba(0,0,0,.4);
  z-index: 500; display: flex; align-items: center; justify-content: center; padding: 20px;
}
.settings-modal {
  background: white; border-radius: 20px;
  width: 100%; max-width: 520px; max-height: 85vh;
  display: flex; flex-direction: column;
  box-shadow: var(--shadow-lg); overflow: hidden;
}
.s-header {
  padding: 14px 20px;
  background: linear-gradient(135deg, #ede9fe, #fce7f3);
  display: flex; justify-content: space-between; align-items: center;
  font-weight: 800; font-size: 16px; flex-shrink: 0;
}
.s-header button {
  background: rgba(0,0,0,.1); border-radius: 50%;
  width: 28px; height: 28px; font-size: 14px;
  display:flex;align-items:center;justify-content:center;
}
.s-body { flex: 1; overflow-y: auto; padding: 16px 20px; display: flex; flex-direction: column; gap: 20px; }

section h3 { font-size: 13px; font-weight: 800; color: var(--accent); margin-bottom: 12px; }

.s-row { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
.s-row label { font-size: 12px; color: var(--text3); width: 70px; flex-shrink: 0; }
.s-val { font-size: 14px; font-weight: 600; }

.s-field { margin-bottom: 12px; }
.s-field label { display: block; font-size: 12px; color: var(--text2); font-weight: 600; margin-bottom: 5px; }
.s-field input, .s-input-row input {
  width: 100%; padding: 9px 12px;
  border: 1.5px solid var(--border); border-radius: 10px;
  font-size: 13px; transition: border-color .2s;
}
.s-field input:focus, .s-input-row input:focus { border-color: var(--accent); outline: none; }

.s-input-row { display: flex; gap: 6px; }
.toggle-key {
  padding: 0 12px; border-radius: 10px;
  background: var(--surface2); border: 1.5px solid var(--border);
  font-size: 14px; flex-shrink: 0;
}

.s-tip { font-size: 11px; color: var(--text3); line-height: 1.6; }
.s-tip a { color: var(--accent); }
.s-tip-box {
  margin-top: 8px; padding: 10px 12px;
  background: #fffbeb; border: 1px solid #fcd34d; border-radius: 10px;
  font-size: 11px; line-height: 1.6;
}
.s-tip-box.github { background: #f0f9ff; border-color: #7dd3fc; }

.data-btns { display: flex; gap: 8px; margin-bottom: 8px; }
.data-btn {
  flex: 1; padding: 10px; border-radius: 10px;
  border: 1.5px solid var(--border);
  font-size: 13px; font-weight: 600;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: background .15s;
  text-align: center;
}
.data-btn.export { background: #f0fdf4; border-color: #86efac; color: #15803d; }
.data-btn.export:hover { background: #dcfce7; }
.data-btn.import { background: #eff6ff; border-color: #93c5fd; color: #1d4ed8; }
.data-btn.import:hover { background: #dbeafe; }

.deploy-steps {
  font-size: 12px; line-height: 2; padding-left: 18px; color: var(--text2); margin: 8px 0;
}
.deploy-steps code { background: #f0f0f0; padding: 1px 5px; border-radius: 4px; font-family: monospace; }

.s-footer {
  padding: 12px 20px; border-top: 1px solid var(--border);
  display: flex; gap: 10px; justify-content: flex-end; flex-shrink: 0;
}
.btn-cancel { padding: 9px 20px; background: var(--surface2); border-radius: 10px; color: var(--text2); font-size: 14px; }
.btn-save { padding: 9px 24px; background: var(--accent); color: white; border-radius: 10px; font-size: 14px; font-weight: 700; }
.btn-save:hover { opacity: .85; }
</style>
