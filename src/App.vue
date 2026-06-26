<template>
  <!-- 登录/选择个人空间 -->
  <div v-if="!currentProfile" class="login-screen">
    <div class="login-card">
      <div class="login-logo">🌸</div>
      <h1 class="login-title">任务花园</h1>
      <p class="login-sub">你的私人四象限任务空间，支持文件夹 &amp; AI 梳理</p>

      <div class="profile-list" v-if="profiles.length">
        <p class="section-label">选择已有空间</p>
        <div
          v-for="p in profiles" :key="p.id"
          class="profile-item"
          @click="enterProfile(p)"
        >
          <span class="profile-avatar">{{ p.avatar }}</span>
          <div class="profile-info">
            <span class="profile-name">{{ p.name }}</span>
            <span class="profile-meta">{{ p.taskCount }} 个任务 · {{ p.updatedAt }}</span>
          </div>
          <button class="profile-del" @click.stop="deleteProfile(p.id)" title="删除">🗑</button>
        </div>
      </div>

      <div class="divider" v-if="profiles.length"><span>或</span></div>

      <div class="new-profile-form">
        <p class="section-label">创建新空间</p>
        <div class="avatar-picker">
          <button
            v-for="av in avatarOptions" :key="av"
            :class="['av-btn', { active: newAvatar === av }]"
            @click="newAvatar = av"
          >{{ av }}</button>
        </div>
        <input
          v-model="newName"
          placeholder="给你的空间起个名字（如：阿花的任务板）"
          class="name-input"
          maxlength="20"
          @keyup.enter="createProfile"
        />
        <button class="create-btn" @click="createProfile" :disabled="!newName.trim()">
          ✨ 创建我的空间
        </button>
      </div>
    </div>
  </div>

  <!-- 主应用 -->
  <div v-else class="app-shell">
    <MatrixApp :profile="currentProfile" @logout="currentProfile = null" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import MatrixApp from './components/MatrixApp.vue'

interface Profile {
  id: string
  name: string
  avatar: string
  createdAt: string
  updatedAt: string
  taskCount: number
}

const profiles = ref<Profile[]>([])
const currentProfile = ref<Profile | null>(null)
const newName = ref('')
const newAvatar = ref('🌸')

const avatarOptions = ['🌸', '🦊', '🐼', '🐱', '🐸', '🦋', '🌻', '🍀', '⭐', '🎀', '🐣', '🌈']

function loadProfiles() {
  try {
    const raw = localStorage.getItem('task-garden-profiles')
    if (raw) profiles.value = JSON.parse(raw)
  } catch {}
}

function saveProfiles() {
  localStorage.setItem('task-garden-profiles', JSON.stringify(profiles.value))
}

function getTaskCount(profileId: string): number {
  try {
    const raw = localStorage.getItem(`tg-data-${profileId}`)
    if (!raw) return 0
    const data = JSON.parse(raw)
    let count = 0
    for (const q of ['q1','q2','q3','q4']) {
      count += countNodes(data[q] || [])
    }
    return count
  } catch { return 0 }
}

function countNodes(nodes: any[]): number {
  let n = 0
  for (const node of nodes) {
    if (node.type === 'file') n++
    else if (node.children) n += countNodes(node.children)
  }
  return n
}

function createProfile() {
  if (!newName.value.trim()) return
  const id = `p-${Date.now()}`
  const now = new Date().toLocaleDateString('zh-CN')
  const p: Profile = {
    id,
    name: newName.value.trim(),
    avatar: newAvatar.value,
    createdAt: now,
    updatedAt: now,
    taskCount: 0,
  }
  profiles.value.unshift(p)
  saveProfiles()
  newName.value = ''
  enterProfile(p)
}

function enterProfile(p: Profile) {
  p.taskCount = getTaskCount(p.id)
  p.updatedAt = new Date().toLocaleDateString('zh-CN')
  saveProfiles()
  currentProfile.value = p
}

function deleteProfile(id: string) {
  if (!confirm('确定删除此空间？数据将无法恢复。')) return
  profiles.value = profiles.value.filter(p => p.id !== id)
  localStorage.removeItem(`tg-data-${id}`)
  saveProfiles()
}

onMounted(() => {
  loadProfiles()
  // 自动进入上次使用的空间
  const lastId = localStorage.getItem('tg-last-profile')
  if (lastId) {
    const p = profiles.value.find(x => x.id === lastId)
    if (p) enterProfile(p)
  }
})
</script>

<style scoped>
.login-screen {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f8f4ff 0%, #ffeef8 50%, #fff8f0 100%);
  padding: 20px;
}

.login-card {
  background: white;
  border-radius: 24px;
  padding: 36px 32px;
  width: 100%;
  max-width: 460px;
  box-shadow: 0 20px 60px rgba(124,58,237,0.1);
}

.login-logo {
  font-size: 52px;
  text-align: center;
  margin-bottom: 8px;
  animation: float 3s ease-in-out infinite;
}
@keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }

.login-title {
  text-align: center;
  font-size: 26px;
  font-weight: 800;
  background: linear-gradient(135deg, #7c3aed, #db2777);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 6px;
}

.login-sub {
  text-align: center;
  color: var(--text3);
  font-size: 13px;
  margin-bottom: 24px;
  line-height: 1.6;
}

.section-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text3);
  text-transform: uppercase;
  letter-spacing: .5px;
  margin-bottom: 10px;
}

.profile-list { margin-bottom: 20px; }

.profile-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: var(--radius);
  border: 1.5px solid var(--border);
  cursor: pointer;
  margin-bottom: 8px;
  transition: all .18s;
}
.profile-item:hover { border-color: var(--accent); background: var(--accent-light); }

.profile-avatar { font-size: 26px; }
.profile-info { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.profile-name { font-weight: 700; font-size: 15px; }
.profile-meta { font-size: 11px; color: var(--text3); }

.profile-del {
  opacity: 0;
  font-size: 14px;
  padding: 4px;
  border-radius: 6px;
  transition: opacity .15s, background .15s;
}
.profile-item:hover .profile-del { opacity: 1; }
.profile-del:hover { background: #ffe0e0; }

.divider {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--text3);
  font-size: 12px;
  margin: 16px 0;
}
.divider::before, .divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--border);
}

.avatar-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
}
.av-btn {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  border: 2px solid transparent;
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all .15s;
  background: var(--surface2);
}
.av-btn:hover { border-color: #ccc; }
.av-btn.active { border-color: var(--accent); background: var(--accent-light); }

.name-input {
  width: 100%;
  padding: 12px 16px;
  border: 1.5px solid var(--border);
  border-radius: var(--radius);
  font-size: 14px;
  margin-bottom: 12px;
  transition: border-color .2s;
}
.name-input:focus { border-color: var(--accent); }

.create-btn {
  width: 100%;
  padding: 13px;
  background: linear-gradient(135deg, #7c3aed, #db2777);
  color: white;
  border-radius: var(--radius);
  font-size: 15px;
  font-weight: 700;
  transition: opacity .2s, transform .2s;
}
.create-btn:hover:not(:disabled) { opacity: .9; transform: scale(1.01); }
.create-btn:disabled { opacity: .4; cursor: not-allowed; }

.app-shell { height: 100%; display: flex; flex-direction: column; }
</style>
