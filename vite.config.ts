import { defineConfig } from 'vite'

export default defineConfig({
  // Tauri 预留（ADR-001）：相对 base，构建产物可被任意路径托管 / 直接套壳
  base: './',
  // host: true 绑定 0.0.0.0（与 lianban 一致）：不解析 localhost 域名，
  // 避免 /etc/hosts 缺失 localhost 条目时 getaddrinfo ENOTFOUND；同时允许局域网访问
  server: { host: true, port: 5173 },
  preview: { host: true },
})
