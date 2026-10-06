import './style.css'
import { initTheme } from './lib/theme'
import { renderHome } from './pages/home'
import { renderLinear } from './pages/linear'

const app = document.getElementById('app')
if (!app) throw new Error('缺少 #app 根节点')

let cleanup: (() => void) | null = null

function renderComingSoon(root: HTMLElement, name: string): () => void {
  root.innerHTML = `
    <div class="navbar">
      <button class="back" id="back">‹ 返回</button>
      <h1>${name}</h1>
      <p class="sub">M2 里程碑（F2 / F3）上线</p>
    </div>
    <div class="wrap">
      <div class="card"><p class="lead">该知识点将在 M2 里程碑交付，敬请期待。</p></div>
    </div>
  `
  const back = root.querySelector<HTMLButtonElement>('#back')!
  const onBack = () => { location.hash = '#/' }
  back.addEventListener('click', onBack)
  return () => back.removeEventListener('click', onBack)
}

function route(): void {
  const hash = location.hash.replace(/^#\/?/, '').split('?')[0]
  if (cleanup) { cleanup(); cleanup = null }
  switch (hash) {
    case 'linear':
      cleanup = renderLinear(app!)
      break
    case 'quadratic':
      cleanup = renderComingSoon(app!, '二次函数')
      break
    case 'inverse':
      cleanup = renderComingSoon(app!, '反比例函数')
      break
    default:
      cleanup = renderHome(app!)
  }
  window.scrollTo(0, 0)
}

window.addEventListener('hashchange', route)
initTheme()
route()
