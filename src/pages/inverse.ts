import { setThemeButton } from '../lib/theme'
import {
  getColors, setupCanvas, makePlot, drawGrid, drawAxes, sx, sy, fmt,
  drawPoint, dashedLine, type Plot, type Colors,
} from '../lib/plot'

export function renderInverse(root: HTMLElement): () => void {
  root.innerHTML = `
    <div class="navbar">
      <button class="back" id="back">‹ 返回</button>
      <button class="theme-btn" id="themeBtn" aria-label="切换深浅色"></button>
      <h1>反比例函数</h1>
      <p class="sub">y = k/x · 拖 k 看分支跳跃，拖点看矩形面积</p>
    </div>
    <div class="wrap">
      <div class="card">
        <h2>概念引入</h2>
        <p class="lead">反比例函数图像是<b>双曲线</b>：<b>k</b> 决定分支位置，<b>|k|</b> 决定矩形面积。</p>
        <div class="formula"><i>y</i> = <i>k</i> / <i>x</i>　(<i>x</i> ≠ 0)</div>
      </div>

      <div class="card">
        <h2>交互探索</h2>
        <canvas class="plot draggable" id="plot"></canvas>
        <div class="slider-row">
          <label>k</label>
          <input type="range" class="ios" id="k" min="-6" max="6" step="0.5" value="2" aria-label="比例系数 k">
          <output class="tnum" id="kv"></output>
        </div>
        <div class="status" id="status"></div>
        <div class="hint">试试：</div>
        <ul class="tasks">
          <li>拖 k 从 2 到 −2，看分支怎么跳象限</li>
          <li>拖动曲线上的点，看矩形面积变不变（始终 = |k|）</li>
        </ul>
      </div>

      <div class="card">
        <h2>例题验证</h2>
        <p class="q">若点 (2, 3) 在反比例函数图像上，k = ?</p>
        <button class="answer-toggle" id="ans">查看答案</button>
        <div class="answer" id="answer"><div><p>由 x·y = k，得 k = 2 × 3 = <b>6</b>。</p></div></div>
      </div>
    </div>
  `

  const canvas = root.querySelector<HTMLCanvasElement>('#plot')!
  const kEl = root.querySelector<HTMLInputElement>('#k')!
  const kvEl = root.querySelector<HTMLOutputElement>('#kv')!
  const statusEl = root.querySelector<HTMLElement>('#status')!

  let ctx = setupCanvas(canvas)
  let dragging = false
  let pointX = Math.sqrt(Math.abs(parseFloat(kEl.value)))

  const kVal = () => parseFloat(kEl.value)

  function updateStatus(k: number): void {
    if (k === 0) {
      statusEl.innerHTML = '<span class="dir">k = 0</span> · y = k/x 无意义（分母不能为 0），不绘制图像'
      statusEl.className = 'status flat'
      return
    }
    const quad = k > 0 ? '一、三象限' : '二、四象限'
    statusEl.innerHTML = `
      <div class="row"><span class="dir">分布在${quad}</span> · k ${k > 0 ? '&gt;' : '&lt;'} 0</div>
      <div class="row">渐近线：x = 0、y = 0（虚线，双曲线无限接近但永不触及）</div>`
    statusEl.className = 'status'
  }

  function drawHyperbola(p: Plot, c: Colors, k: number): void {
    ctx.strokeStyle = c.line
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    // 右支（x > 0）
    ctx.beginPath()
    let pen = false
    for (let px = Math.ceil(p.ox); px <= p.w; px += 2) {
      const x = (px - p.ox) / p.s
      if (x < 0.02) continue
      const py = sy(p, k / x)
      if (py < -4000 || py > p.h + 4000) { pen = false; continue }
      if (!pen) { ctx.moveTo(px, py); pen = true }
      else ctx.lineTo(px, py)
    }
    ctx.stroke()
    // 左支（x < 0）
    ctx.beginPath()
    pen = false
    for (let px = Math.floor(p.ox); px >= 0; px -= 2) {
      const x = (px - p.ox) / p.s
      if (x > -0.02) continue
      const py = sy(p, k / x)
      if (py < -4000 || py > p.h + 4000) { pen = false; continue }
      if (!pen) { ctx.moveTo(px, py); pen = true }
      else ctx.lineTo(px, py)
    }
    ctx.stroke()
  }

  function draw(): void {
    const s = canvas.clientHeight / 12
    const p = makePlot(canvas, ctx, s)
    const c = getColors()
    const k = kVal()

    ctx.clearRect(0, 0, p.w, p.h)
    drawGrid(p, c)
    drawAxes(p, c, true) // 轴即渐近线，用虚线表示

    // 公式标注
    ctx.fillStyle = c.text
    ctx.font = '600 14px -apple-system, sans-serif'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    ctx.fillText(k === 0 ? 'y = k/x' : `y = ${fmt(k)}/x`, 12, 14)

    if (k !== 0) {
      const yp = k / pointX
      const x1 = sx(p, pointX)
      const y1 = sy(p, yp)

      // 矩形填充（k 的几何意义：面积 = |x·y| = |k|）
      ctx.globalAlpha = 0.14
      ctx.fillStyle = c.line
      ctx.fillRect(Math.min(p.ox, x1), Math.min(p.oy, y1), Math.abs(x1 - p.ox), Math.abs(y1 - p.oy))
      ctx.globalAlpha = 1

      // 双曲线
      drawHyperbola(p, c, k)

      // 向坐标轴作垂线（虚线）
      dashedLine(p, pointX, 0, pointX, yp, c.line, 1.2)
      dashedLine(p, 0, yp, pointX, yp, c.line, 1.2)

      // 可拖动点
      drawPoint(p, pointX, yp, c.point, undefined, 6)

      // 面积标注
      ctx.fillStyle = c.text
      ctx.font = '600 13px -apple-system, sans-serif'
      ctx.textAlign = 'left'
      ctx.textBaseline = 'top'
      ctx.fillText(`面积 = |k| = ${fmt(Math.abs(k))}`, Math.min(p.ox, x1) + 8, Math.min(p.oy, y1) + 8)

      // 渐近线 / 定义域标注
      ctx.fillStyle = c.orange
      ctx.font = '600 12px -apple-system, sans-serif'
      ctx.fillText('x ≠ 0', p.ox + 8, 10)
    }

    kvEl.textContent = fmt(k, 1)
    updateStatus(k)
  }

  function updatePoint(e: PointerEvent): void {
    const rect = canvas.getBoundingClientRect()
    const s = canvas.clientHeight / 12
    const ox = canvas.clientWidth / 2
    const x = (e.clientX - rect.left - ox) / s
    const xmin = 0.35
    const xmax = (canvas.clientWidth - ox) / s - 0.2
    pointX = Math.max(xmin, Math.min(xmax, x))
    draw()
  }

  const onDown = (e: PointerEvent) => {
    if (kVal() === 0) return
    const rect = canvas.getBoundingClientRect()
    const s = canvas.clientHeight / 12
    const ox = canvas.clientWidth / 2
    const oy = canvas.clientHeight / 2
    const px = e.clientX - rect.left
    const py = e.clientY - rect.top
    const spx = ox + pointX * s
    const spy = oy - (kVal() / pointX) * s
    if (Math.hypot(px - spx, py - spy) < 30) {
      dragging = true
      canvas.setPointerCapture(e.pointerId)
      updatePoint(e)
    }
  }
  const onMove = (e: PointerEvent) => { if (dragging) updatePoint(e) }
  const onUp = (e: PointerEvent) => {
    if (dragging) {
      dragging = false
      try { canvas.releasePointerCapture(e.pointerId) } catch { /* 忽略 */ }
    }
  }

  canvas.addEventListener('pointerdown', onDown)
  canvas.addEventListener('pointermove', onMove)
  canvas.addEventListener('pointerup', onUp)
  canvas.addEventListener('pointercancel', onUp)

  const onK = () => {
    const k = kVal()
    if (k !== 0) {
      pointX = Math.sqrt(Math.abs(k)) // 重新锚定到 |x|=|y| 的角点
      dragging = false
    }
    draw()
  }
  kEl.addEventListener('input', onK)

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
    canvas.removeEventListener('pointerdown', onDown)
    canvas.removeEventListener('pointermove', onMove)
    canvas.removeEventListener('pointerup', onUp)
    canvas.removeEventListener('pointercancel', onUp)
    kEl.removeEventListener('input', onK)
    back.removeEventListener('click', onBack)
    ans.removeEventListener('click', onAns)
  }
}
