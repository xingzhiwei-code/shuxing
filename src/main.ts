import './style.css'
import { initTheme } from './lib/theme'
import { renderHome } from './pages/home'
import { renderLinear } from './pages/linear'
import { renderQuadratic } from './pages/quadratic'
import { renderInverse } from './pages/inverse'

const app = document.getElementById('app')
if (!app) throw new Error('缺少 #app 根节点')

let cleanup: (() => void) | null = null

function route(): void {
  const hash = location.hash.replace(/^#\/?/, '').split('?')[0]
  if (cleanup) { cleanup(); cleanup = null }
  switch (hash) {
    case 'linear':
      cleanup = renderLinear(app!)
      break
    case 'quadratic':
      cleanup = renderQuadratic(app!)
      break
    case 'inverse':
      cleanup = renderInverse(app!)
      break
    default:
      cleanup = renderHome(app!)
  }
  window.scrollTo(0, 0)
}

window.addEventListener('hashchange', route)
initTheme()
route()
