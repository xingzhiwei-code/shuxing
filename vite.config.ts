import { defineConfig } from 'vite'

export default defineConfig({
  // Tauri 预留（ADR-001）：相对 base，构建产物可被任意路径托管 / 直接套壳
  base: './',
  // 直接绑定 127.0.0.1：绕过 localhost 域名解析，
  // 避免 /etc/hosts 缺失 localhost 条目时 getaddrinfo ENOTFOUND 导致 dev/preview 起不来
  server: { host: '127.0.0.1' },
  preview: { host: '127.0.0.1' },
})
