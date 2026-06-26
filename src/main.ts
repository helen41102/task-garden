import { createApp } from 'vue'
import App from './App.vue'
import './style.css'
import { registerSW } from 'virtual:pwa-register'

// PWA 自动更新：有新版本时静默更新，下次启动生效
registerSW({
  onNeedRefresh() {
    // 有新版本，自动刷新
    if (confirm('✨ 任务花园有新版本，点击确定立即更新！')) {
      window.location.reload()
    }
  },
  onOfflineReady() {
    console.log('任务花园已可离线使用 🌸')
  },
})

createApp(App).mount('#app')
