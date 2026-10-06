import { defineConfig } from 'vite'

export default defineConfig({
  // Tauri 预留（ADR-001）：相对 base，构建产物可被任意路径托管 / 直接套壳
  base: './',
})
