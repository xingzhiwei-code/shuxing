import { setThemeButton } from '../lib/theme'

export function renderHome(root: HTMLElement): () => void {
  root.innerHTML = `
    <div class="navbar">
      <button class="theme-btn" id="themeBtn" aria-label="切换深浅色"></button>
      <h1>数形</h1>
      <p class="sub">中文交互式数学可视化 · S1a 函数系列</p>
    </div>
    <div class="wrap">
      <div class="group-label">函数系列</div>
      <div class="list">
        <a class="list-item" href="#/linear">
          <span class="li-title">一次函数<span class="li-sub">y = kx + b</span></span>
          <span class="arrow">›</span>
        </a>
        <div class="list-item disabled">
          <span class="li-title">二次函数<span class="li-sub">y = ax² + bx + c</span></span>
          <span class="tag">即将上线</span>
        </div>
        <div class="list-item disabled">
          <span class="li-title">反比例函数<span class="li-sub">y = k/x</span></span>
          <span class="tag">即将上线</span>
        </div>
      </div>
      <p class="foot-note">拖参数，看图像——30 秒看懂 k / b / a 是干嘛的。</p>
    </div>
  `

  const themeBtn = root.querySelector<HTMLButtonElement>('#themeBtn')
  if (themeBtn) setThemeButton(themeBtn)
  return () => {}
}
