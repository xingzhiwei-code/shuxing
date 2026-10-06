// 深浅色模式：v0 架构预留，全站颜色走 CSS 变量（宪法附录标准 9 / AC7）

const KEY = 'shuxing-theme'

export function isDark(): boolean {
  return document.documentElement.getAttribute('data-theme') === 'dark'
}

export function initTheme(): void {
  let stored: string | null = null
  try { stored = localStorage.getItem(KEY) } catch { /* 忽略存储不可用 */ }
  if (stored === 'dark' || stored === 'light') {
    document.documentElement.setAttribute('data-theme', stored)
  } else {
    const dark = window.matchMedia('(prefers-color-scheme: dark)').matches
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
  }
}

export function toggleTheme(): void {
  const dark = !isDark()
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
  try { localStorage.setItem(KEY, dark ? 'dark' : 'light') } catch { /* 忽略 */ }
  window.dispatchEvent(new Event('themechange'))
}

/** 绑定导航栏里的深浅色切换按钮（☾ / ☀），点击即切换并刷新按钮图标 */
export function setThemeButton(btn: HTMLButtonElement): void {
  const render = () => { btn.textContent = isDark() ? '☀' : '☾' }
  render()
  btn.addEventListener('click', () => { toggleTheme(); render() })
}
