# 🌸 任务花园 Task Garden

> 个人四象限任务管理器 · 文件夹树 · Markdown 编辑 · DeepSeek AI 实时梳理 · PWA 支持

**在线体验：** https://helen41102.github.io/task-garden/  
（部署完成后替换上面链接）

## ✨ 功能

- 📊 **艾森豪威尔四象限** — 立刻去做 / 计划安排 / 委托他人 / 择机处理
- 📁 **文件夹树** — 每个象限可建多级文件夹和文件，自由命名
- ✏️ **Markdown 编辑器** — 支持实时预览、工具栏、待办框
- 🤖 **DeepSeek AI** — 象限分析、文件梳理、全局对话
- 👤 **多用户空间** — 本地账号系统，每人独立数据
- 🌸 **悬浮球** — 可拖动，快速添加任务、呼出 AI
- 📱 **PWA** — 添加到手机桌面，支持离线使用
- 💾 **本地存储** — 数据存浏览器，支持导出/导入 JSON

## 🚀 部署到 GitHub Pages

### 方法一：自动部署（推荐）

1. Fork 本仓库
2. 进入仓库 **Settings → Pages**
3. Source 选 **GitHub Actions**
4. 推送任意代码 → 自动构建部署

### 方法二：手动上传

```bash
# 本地构建
npm install --include=dev
VITE_BASE_URL=/task-garden/ npx vite build

# 把 dist/ 目录内容推送到 gh-pages 分支
```

## ⚙️ 配置

进入应用后点击右上角 ⚙️，填写 **DeepSeek API Key**：
- 获取地址：https://platform.deepseek.com
- Key 格式：`sk-xxxxxxxxxxxxxxxx`
- Key **只存在你的浏览器本地**，不会上传任何服务器

## 📦 本地开发

```bash
npm install --include=dev
npm run dev
```

## 🌐 数据说明

- 所有数据存储在浏览器 `localStorage`，不依赖服务器
- 建议定期在 ⚙️ 中**导出 JSON 备份**
- 换设备时导入即可恢复
