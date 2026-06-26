import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

// GitHub Pages 部署时，需要把 VITE_BASE_URL 设为 /仓库名/
// 例如仓库叫 task-garden，就设 VITE_BASE_URL=/task-garden/
// Cowork 环境不设此变量，走默认 '/'
const base = process.env.VITE_BASE_URL || '/'

export default defineConfig({
  base,
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      base,
      includeAssets: ['icons/*.png'],
      manifest: {
        name: '任务花园',
        short_name: '任务花园',
        description: '个人四象限任务管理 · 文件夹 · AI 梳理',
        theme_color: '#7c3aed',
        background_color: '#f7f5ff',
        display: 'standalone',
        orientation: 'any',
        start_url: base,
        scope: base,
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ],
        shortcuts: [
          {
            name: '快速添加任务',
            short_name: '添加',
            url: base + '?quick=1',
            icons: [{ src: 'icons/icon-192.png', sizes: '192x192' }]
          }
        ],
        categories: ['productivity', 'utilities'],
        lang: 'zh-CN'
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.deepseek\.com\/.*/i,
            handler: 'NetworkOnly'
          }
        ]
      }
    })
  ],
  server: { host: '0.0.0.0', port: 5173 },
  build: { outDir: 'dist', emptyOutDir: true }
})
