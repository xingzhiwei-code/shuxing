import { setThemeButton } from '../lib/theme'
import {
  getColors, setupCanvas, makePlot, drawGrid, drawAxes, sx, sy, fmt,
  drawPoint, dashedLine,
} from '../lib/plot'
import { linearFormula, quadraticFormula } from '../lib/formula'

const EPS = 1e-9

export function renderQuadratic(root: HTMLElement): () => void {
  root.innerHTML = `
    <div class="navbar">
      <button class="back" id="back">‹ 返回</button>
      <button class="theme-btn" id="themeBtn" aria-label="切换深浅色"></button>
      <h1>二次函数</h1>
      <p class="sub">y = ax² + bx + c · 拖参数看开口、顶点、对称轴</p>
    </div>
    <div class="wrap">
      <div class="card">
        <h2>概念引入</h2>
        <p class="lead">二次函数图像是<b>抛物线</b>：<b>a</b> 管开口方向和宽窄，<b>顶点</b>是最值点。</p>
        <div class="formula"><i>y</i> = <i>a</i><i>x</i><sup>2</sup> + <i>b</i><i>x</i> + <i>c</i></div>
      </div>

      <div class="card">
        <h2>交互探索</h2>
        <canvas class="plot" id="plot"></canvas>
        <div class="slider-row">
          <label>a</label>
          <input type="range" class="ios" id="a" min="-3" max="3" step="0.1" value="1" aria-label="二次项系数 a">
          <output class="tnum" id="av"></output>
        </div>
        <div class="slider-row">
          <label>b</label>
          <input type="range" class="ios" id="b" min="-6" max="6" step="0.2" value="-4" aria-label="一次项系数 b">
          <output class="tnum" id="bv"></output>
        </div>
        <div class="slider-row">
          <label>c</label>
          <input type="range" class="ios" id="c" min="-6" max="6" step="0.5" value="3" aria-label="常数项 c">
          <output class="tnum" id="cv"></output>
        </div>
        <div class="status" id="status"></div>
        <div class="hint">试试：</div>
        <ul class="tasks">
          <li>把 a 从 1 拖到 −1，看抛物线怎么翻过来</li>
          <li>调 b、c，观察顶点和对称轴怎么变</li>
        </ul>
      </div>

      <div class="card">
        <h2>例题验证</h2>
        <p class="q">抛物线 y = x² − 4x + 3 的顶点坐标是？</p>
        <button class="answer-toggle" id="ans">查看答案</button>
        <div class="answer" id="answer"><div><p>配方：y = (x − 2)² − 1，顶点为 <b>(2, −1)</b>。</p></div></div>
      </div>
    </div>
  `

  const canvas = root.querySelector<HTMLCanvasElement>('#plot')!
  const aEl = root.querySelector<HTMLInputElement>('#a')!
  const bEl = root.querySelector<HTMLInputElement>('#b')!
  const cEl = root.querySelector<HTMLInputElement>('#c')!
  const avEl = root.querySelector<HTMLOutputElement>('#av')!
  const bvEl = root.querySelector<HTMLOutputElement>('#bv')!
  const cvEl = root.querySelector<HTMLOutputElement>('#cv')!
  const statusEl = root.querySelector<HTMLElement>('#status')!

  let ctx = setupCanvas(canvas)

  const aVal = () => parseFloat(aEl.value)
  const bVal = () => parseFloat(bEl.value)
  const cVal = () => parseFloat(cEl.value)

  function updateStatus(a: number, b: number, c: number): void {
    if (a === 0) {
      const name = b === 0 ? '常数函数' : '一次函数'
      const shape = b === 0 ? '水平直线' : '直线'
      statusEl.innerHTML = `<span class="dir">a = 0</span> · 已退化为${name} ${linearFormula(b, c)}（图像为${shape}）`
      statusEl.className = 'status flat'
      return
    }
    const xv = -b / (2 * a)
    const yv = a * xv * xv + b * xv + c
    const delta = b * b - 4 * a * c
    const open = a > 0 ? '开口向上' : '开口向下'
    let roots: string
    if (delta > EPS) {
      const r = [(-b - Math.sqrt(delta)) / (2 * a), (-b + Math.sqrt(delta)) / (2 * a)].sort((m, n) => m - n)
      roots = `两个交点 x₁ = ${fmt(r[0])}，x₂ = ${fmt(r[1])}`
    } else if (delta < -EPS) {
      roots = '无交点（Δ &lt; 0）'
    } else {
      roots = `一个交点（相切）x = ${fmt(xv)}`
    }
    statusEl.innerHTML = `
      <div class="row"><span class="dir">${open}</span> · a ${a > 0 ? '&gt;' : '&lt;'} 0，|a| 越大开口越窄</div>
      <div class="row">顶点 <span class="num">(${fmt(xv)}, ${fmt(yv)})</span> · 对称轴 <span class="num">x = ${fmt(xv)}</span></div>
      <div class="row">与 x 轴：${roots}</div>`
    statusEl.className = 'status'
  }

  function draw(): void {
    const s = canvas.clientHeight / 12
    const p = makePlot(canvas, ctx, s)
    const c = getColors()
    const a = aVal(), b = bVal(), cc = cVal()

    ctx.clearRect(0, 0, p.w, p.h)
    drawGrid(p, c)
    drawAxes(p, c)

    // 公式标注
    ctx.fillStyle = c.text
    ctx.font = '600 14px -apple-system, sans-serif'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    ctx.fillText(quadraticFormula(a, b, cc), 12, 14)

    ctx.strokeStyle = c.line
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    if (a === 0) {
      // 边界诚实：a = 0 退化为直线 y = bx + c，不得画抛物线
      const xL = (0 - p.ox) / p.s
      const xR = (p.w - p.ox) / p.s
      ctx.beginPath()
      ctx.moveTo(sx(p, xL), sy(p, b * xL + cc))
      ctx.lineTo(sx(p, xR), sy(p, b * xR + cc))
      ctx.stroke()
      drawPoint(p, 0, cc, c.point, `(0, ${fmt(cc)})`)
    } else {
      // 抛物线（逐点，覆盖整幅画布）
      ctx.beginPath()
      for (let px = 0; px <= p.w; px += 2) {
        const x = (px - p.ox) / p.s
        const y = a * x * x + b * x + cc
        const py = sy(p, y)
        if (px === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.stroke()

      // 顶点
      const xv = -b / (2 * a)
      const yv = a * xv * xv + b * xv + cc
      drawPoint(p, xv, yv, c.point, `顶点(${fmt(xv)}, ${fmt(yv)})`, 5)

      // 对称轴（虚线）
      const yBottom = (p.oy - p.h) / p.s
      const yTop = p.oy / p.s
      dashedLine(p, xv, yBottom, xv, yTop, c.axis, 1.5)
      ctx.fillStyle = c.axis
      ctx.font = '12px -apple-system, sans-serif'
      ctx.textAlign = 'left'
      ctx.textBaseline = 'top'
      ctx.fillText(`x = ${fmt(xv)}`, sx(p, xv) + 6, 12)

      // 与 y 轴交点 (0, c)
      drawPoint(p, 0, cc, c.point, `(0, ${fmt(cc)})`)

      // 与 x 轴交点（按判别式）
      const delta = b * b - 4 * a * cc
      if (delta > EPS) {
        const r1 = (-b - Math.sqrt(delta)) / (2 * a)
        const r2 = (-b + Math.sqrt(delta)) / (2 * a)
        drawPoint(p, r1, 0, c.point)
        drawPoint(p, r2, 0, c.point)
      } else if (delta >= -EPS) {
        const r0 = -b / (2 * a)
        drawPoint(p, r0, 0, c.point)
      }
    }

    avEl.textContent = fmt(a, 1)
    bvEl.textContent = fmt(b, 1)
    cvEl.textContent = fmt(cc, 1)
    updateStatus(a, b, cc)
  }

  aEl.addEventListener('input', draw)
  bEl.addEventListener('input', draw)
  cEl.addEventListener('input', draw)

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
