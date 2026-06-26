<template>
  <transition name="slide-up">
    <div class="install-banner" v-if="show">
      <div class="install-content">
        <span class="install-icon">🌸</span>
        <div class="install-text">
          <strong>添加到桌面</strong>
          <span>像 App 一样使用，支持离线</span>
        </div>
      </div>
      <div class="install-actions">
        <button class="install-btn" @click="doInstall">安装</button>
        <button class="dismiss-btn" @click="dismiss">✕</button>
      </div>
    </div>
  </transition>

  <!-- iOS 专属提示（Safari不支持beforeinstallprompt） -->
  <transition name="slide-up">
    <div class="ios-guide" v-if="showIosGuide">
      <div class="ios-guide-header">
        <span>📱 添加到主屏幕</span>
        <button @click="showIosGuide = false">✕</button>
      </div>
      <div class="ios-guide-steps">
        <div class="ios-step">
          <span class="ios-step-num">1</span>
          <span>点击底部工具栏的 <strong>分享按钮</strong> <code>⎙</code></span>
        </div>
        <div class="ios-step">
          <span class="ios-step-num">2</span>
          <span>向下滚动，点击 <strong>「添加到主屏幕」</strong></span>
        </div>
        <div class="ios-step">
          <span class="ios-step-num">3</span>
          <span>点击右上角 <strong>「添加」</strong>，完成！</span>
        </div>
      </div>
      <p class="ios-tip">之后从主屏幕打开，享受全屏 App 体验 🌸</p>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const show = ref(false)
const showIosGuide = ref(false)
let deferredPrompt: any = null

function isIos() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}
function isInStandaloneMode() {
  return ('standalone' in window.navigator && (window.navigator as any).standalone)
    || window.matchMedia('(display-mode: standalone)').matches
}

function dismiss() {
  show.value = false
  localStorage.setItem('pwa-install-dismissed', '1')
}

async function doInstall() {
  if (!deferredPrompt) return
  deferredPrompt.prompt()
  const { outcome } = await deferredPrompt.userChoice
  deferredPrompt = null
  show.value = false
  if (outcome === 'accepted') {
    localStorage.setItem('pwa-installed', '1')
  }
}

onMounted(() => {
  // 已安装或已关闭提示则不显示
  if (isInStandaloneMode()) return
  if (localStorage.getItem('pwa-install-dismissed')) return

  // iOS Safari 特殊处理
  if (isIos()) {
    setTimeout(() => { showIosGuide.value = true }, 3000)
    return
  }

  // Android Chrome / 其他支持 beforeinstallprompt 的浏览器
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault()
    deferredPrompt = e
    setTimeout(() => { show.value = true }, 2000)
  })
})
</script>

<style scoped>
.install-banner {
  position: fixed;
  bottom: calc(env(safe-area-inset-bottom, 0px) + 70px);
  left: 12px;
  right: 80px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 6px 28px rgba(124, 58, 237, 0.2);
  border: 1.5px solid #ede9fe;
  padding: 12px 14px;
  z-index: 800;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.install-content { display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0; }
.install-icon { font-size: 28px; flex-shrink: 0; }
.install-text { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
.install-text strong { font-size: 13px; color: #7c3aed; }
.install-text span { font-size: 11px; color: #888; }

.install-actions { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
.install-btn {
  padding: 7px 16px;
  background: linear-gradient(135deg, #7c3aed, #db2777);
  color: white;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
}
.install-btn:hover { opacity: 0.9; }
.dismiss-btn {
  width: 26px; height: 26px;
  border-radius: 50%;
  background: #f0f0f0;
  font-size: 12px;
  display: flex; align-items: center; justify-content: center;
  color: #888;
}

/* iOS 引导 */
.ios-guide {
  position: fixed;
  bottom: calc(env(safe-area-inset-bottom, 0px) + 70px);
  left: 12px;
  right: 12px;
  background: white;
  border-radius: 18px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.15);
  border: 1.5px solid #ede9fe;
  z-index: 800;
  overflow: hidden;
}
.ios-guide-header {
  padding: 12px 16px;
  background: linear-gradient(135deg, #ede9fe, #fce7f3);
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 700;
  font-size: 14px;
}
.ios-guide-header button { color: #888; font-size: 14px; padding: 2px 6px; border-radius: 5px; }
.ios-guide-steps { padding: 12px 16px; display: flex; flex-direction: column; gap: 10px; }
.ios-step { display: flex; align-items: flex-start; gap: 10px; font-size: 13px; line-height: 1.5; }
.ios-step-num {
  width: 22px; height: 22px; border-radius: 50%;
  background: #7c3aed; color: white;
  font-size: 12px; font-weight: 800;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; margin-top: 1px;
}
.ios-step code {
  background: #f0f0f0; padding: 1px 5px;
  border-radius: 4px; font-family: monospace; font-size: 13px;
}
.ios-tip { padding: 0 16px 12px; font-size: 11px; color: #888; }

/* transitions */
.slide-up-enter-active, .slide-up-leave-active { transition: all 0.3s cubic-bezier(.4,0,.2,1); }
.slide-up-enter-from, .slide-up-leave-to { opacity: 0; transform: translateY(20px); }
</style>
