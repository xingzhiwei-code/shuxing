import { setThemeButton } from '../lib/theme'
import {
  getColors, setupCanvas, makePlot, drawGrid, drawAxes, sx, sy, fmt,
} from '../lib/plot'
import { linearFormula } from '../lib/formula'

const SCALE = 30 // 每单位像素，固定视图（v0 不做缩放平移）

export function renderLinear(root: HTMLElement): () => void {
  root.innerHTML = `
    <div class="navbar">
      <button class="back" id="back">‹ 返回</button>
      <button class="theme-btn" id="themeBtn" aria-label="切换深浅色"></button>
      <h1>一次函数</h1>
      <p class="sub">y = kx + b · 拖参数看直线变化</p>
    </div>
    <div class="wrap">
      <div class="card">
        <h2>概念引入</h2>
        <p class="lead">一次函数的图像是<b>直线</b>：<b>k</b> 管倾斜方向和程度，<b>b</b> 管上下平移。</p>
        <div class="formula"><i>y</i> = <i>k</i><i>x</i> + <i>b</i></div>
      </div>

      <div class="card">
        <h2>交互探索</h2>
        <canvas class="plot" id="plot"></canvas>
        <div class="slider-row">
          <label>k</label>
          <input type="range" class="ios" id="k" min="-3" max="3" step="0.05" value="1" aria-label="斜率 k">
          <output class="tnum" id="kv"></output>
        </div>
        <div class="slider-row">
          <label>b</label>
          <input type="range" class="ios" id="b" min="-5" max="5" step="0.1" value="0" aria-label="截距 b">
          <output class="tnum" id="bv"></output>
        </div>
        <div class="status" id="status"></div>
        <div class="hint">试试：</div>
        <ul class="tasks">
          <li>把 k 拖到 2，再拖到 −2，观察直线怎么转</li>
          <li>固定 k = 1，拖 b，看直线上下走</li>
        </ul>
      </div>

      <div class="card">
        <h2>例题验证</h2>
        <p class="q">已知一次函数 y = 2x − 1，当 x = 3 时，y = ?</p>
        <button class="answer-toggle" id="ans">查看答案</button>
        <div class="answer" id="answer"><div><p>代入 x = 3：y = 2 × 3 − 1 = <b>5</b>。</p></div></div>
      </div>
    </div>
  `

  const canvas = root.querySelector<HTMLCanvasElement>('#plot')!
  const kEl = root.querySelector<HTMLInputElement>('#k')!
  const bEl = root.querySelector<HTMLInputElement>('#b')!
  const kvEl = root.querySelector<HTMLOutputElement>('#kv')!
  const bvEl = root.querySelector<HTMLOutputElement>('#bv')!
  const statusEl = root.querySelector<HTMLElement>('#status')!

  let ctx = setupCanvas(canvas)

  function kValue(): number { return parseFloat(kEl.value) }
  function bValue(): number { return parseFloat(bEl.value) }

  function updateStatus(k: number, b: number): void {
    if (k > 0) {
      statusEl.innerHTML = '<span class="dir">↗ 上升</span> · k &gt; 0，直线从左到右上升'
      statusEl.className = 'status'
    } else if (k < 0) {
      statusEl.innerHTML = '<span class="dir">↘ 下降</span> · k &lt; 0，直线从左到右下降'
      statusEl.className = 'status'
    } else {
      statusEl.innerHTML = '<span class="dir">→ 水平</span> · k = 0，此时为水平直线 y = ' + fmt(b)
      statusEl.className = 'status flat'
    }
  }

  function draw(): void {
    const p = makePlot(canvas, ctx, SCALE)
    const c = getColors()
    const k = kValue()
    const b = bValue()

    ctx.clearRect(0, 0, p.w, p.h)
    drawGrid(p, c)
    drawAxes(p, c)

    // 直线 y = kx + b（两端点，覆盖整幅画布，Canvas 自动裁剪）
    const xL = (0 - p.ox) / p.s
    const xR = (p.w - p.ox) / p.s
    ctx.strokeStyle = c.line
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.moveTo(sx(p, xL), sy(p, k * xL + b))
    ctx.lineTo(sx(p, xR), sy(p, k * xR + b))
    ctx.stroke()

    // 与 y 轴交点 (0, b) 高亮打点
    const ipx = sx(p, 0)
    const ipy = sy(p, b)
    const margin = 8
    if (ipx > -margin && ipx < p.w + margin && ipy > -margin && ipy < p.h + margin) {
      ctx.fillStyle = c.point
      ctx.beginPath()
      ctx.arc(ipx, ipy, 4.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = c.point
      ctx.font = '600 13px -apple-system, sans-serif'
      ctx.textAlign = 'left'
      ctx.textBaseline = 'bottom'
      ctx.fillText(`(0, ${fmt(b)})`, ipx + 9, ipy - 7)
    }

    // 公式标注
    ctx.fillStyle = c.text
    ctx.font = '600 14px -apple-system, sans-serif'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    ctx.fillText(linearFormula(k, b), 12, 14)

    kvEl.textContent = fmt(k, 2)
    bvEl.textContent = fmt(b, 1)
    updateStatus(k, b)
  }

  kEl.addEventListener('input', draw)
  bEl.addEventListener('input', draw)

  const onResize = () => { ctx = setupCanvas(canvas); draw() }
  window.addEventListener('resize', onResize)
  window.addEventListener('themechange', draw)

  const back = root.querySelector<HTMLButtonElement>('#back')!
  const onBack = () => { location.hash = '#/' }
  back.addEventListener('click', onBack)

  const themeBtn = root.querySelector<HTMLButtonElement>('#themeBtn')!
  setThemeButton(themeBtn)

  const ans = root.querySelector<HTMLButtonElement>('#ans')!
  const answer = root.querySelector<HTMLElement>('#answer')!
  let open = false
  const onAns = () => {
    open = !open
    answer.classList.toggle('open', open)
    ans.textContent = open ? '收起答案' : '查看答案'
  }
  ans.addEventListener('click', onAns)

  draw()

  return () => {
    window.removeEventListener('resize', onResize)
    window.removeEventListener('themechange', draw)
    back.removeEventListener('click', onBack)
    ans.removeEventListener('click', onAns)
  }
}
