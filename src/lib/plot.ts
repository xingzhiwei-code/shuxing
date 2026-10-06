// 数形 · 手写 Canvas 绘图工具库（不引入第三方图表库，保证 60fps 与包体积）
// 约定：数学 y 轴向上为正，Canvas y 轴向下为正，坐标变换在 sx / sy 内统一处理。

export interface Colors {
  sep: string
  axis: string
  text: string
  line: string
  point: string
  orange: string
}

const DEFAULTS: Colors = {
  sep: 'rgba(60,60,67,.12)',
  axis: '#8E8E93',
  text: '#3A3A3C',
  line: '#007AFF',
  point: '#FF3B30',
  orange: '#FF9500',
}

/** 从 CSS 变量读取当前主题色（主题切换后重绘即生效） */
export function getColors(): Colors {
  const cs = getComputedStyle(document.documentElement)
  const v = (name: string, fallback: string): string => {
    const val = cs.getPropertyValue(name).trim()
    return val || fallback
  }
  return {
    sep: v('--sep', DEFAULTS.sep),
    axis: v('--text-3', DEFAULTS.axis),
    text: v('--text-2', DEFAULTS.text),
    line: v('--blue', DEFAULTS.line),
    point: v('--red', DEFAULTS.point),
    orange: v('--orange', DEFAULTS.orange),
  }
}

export interface Plot {
  ctx: CanvasRenderingContext2D
  w: number
  h: number
  s: number   // 每单位像素
  ox: number  // 原点屏幕 x
  oy: number  // 原点屏幕 y
}

// —— F7 性能降级：低端机自动降低网格密度 ——
function isLowEndDevice(): boolean {
  const nav = navigator as Navigator & { deviceMemory?: number }
  if (typeof nav.deviceMemory === 'number' && nav.deviceMemory > 0) return nav.deviceMemory <= 4
  if (typeof navigator.hardwareConcurrency === 'number') return navigator.hardwareConcurrency <= 4
  return false
}

let gridStep = 1

/** 低端机把网格从每 1 单位降到每 2 单位，减少每帧描边数量 */
export function initPerformance(): void {
  gridStep = isLowEndDevice() ? 2 : 1
}

/** 适配 devicePixelRatio，返回 2D 上下文（须在元素已有布局尺寸后调用；DPR 上限 2 控填充率） */
export function setupCanvas(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const w = canvas.clientWidth
  const h = canvas.clientHeight
  canvas.width = Math.round(w * dpr)
  canvas.height = Math.round(h * dpr)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D 上下文不可用')
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  return ctx
}

export function makePlot(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, scale: number): Plot {
  return {
    ctx,
    w: canvas.clientWidth,
    h: canvas.clientHeight,
    s: scale,
    ox: canvas.clientWidth / 2,
    oy: canvas.clientHeight / 2,
  }
}

/** 世界坐标 → 屏幕 x */
export function sx(p: Plot, x: number): number {
  return p.ox + x * p.s
}
/** 世界坐标 → 屏幕 y（y 轴取反） */
export function sy(p: Plot, y: number): number {
  return p.oy - y * p.s
}

/** 绘制网格（每 1 单位一格，整数对齐） */
export function drawGrid(p: Plot, c: Colors): void {
  const { ctx, w, h, s, ox, oy } = p
  const step = s * gridStep
  ctx.strokeStyle = c.sep
  ctx.lineWidth = 1
  ctx.beginPath()
  const gx0 = ((ox % step) + step) % step
  for (let gx = gx0; gx <= w; gx += step) {
    const px = Math.round(gx) + 0.5
    ctx.moveTo(px, 0); ctx.lineTo(px, h)
  }
  const gy0 = ((oy % step) + step) % step
  for (let gy = gy0; gy <= h; gy += step) {
    const py = Math.round(gy) + 0.5
    ctx.moveTo(0, py); ctx.lineTo(w, py)
  }
  ctx.stroke()
}

/** 绘制坐标轴（含箭头、轴名、整数刻度、原点 O）；dashed=true 时轴为虚线（反比例函数的渐近线） */
export function drawAxes(p: Plot, c: Colors, dashed = false): void {
  const { ctx, w, h, s, ox, oy } = p
  ctx.strokeStyle = c.axis
  ctx.fillStyle = c.axis
  ctx.lineWidth = 1.5
  ctx.font = '11px -apple-system, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  // 轴
  if (dashed) ctx.setLineDash([6, 5])
  ctx.beginPath(); ctx.moveTo(0, oy); ctx.lineTo(w, oy); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(ox, 0); ctx.lineTo(ox, h); ctx.stroke()
  ctx.setLineDash([])

  // 箭头
  ctx.beginPath(); ctx.moveTo(w - 1, oy); ctx.lineTo(w - 7, oy - 3); ctx.lineTo(w - 7, oy + 3); ctx.closePath(); ctx.fill()
  ctx.beginPath(); ctx.moveTo(ox, 1); ctx.lineTo(ox - 3, 7); ctx.lineTo(ox + 3, 7); ctx.closePath(); ctx.fill()

  // 轴名
  ctx.fillText('x', w - 10, oy - 11)
  ctx.fillText('y', ox + 12, 8)

  // x 轴整数刻度
  const x0 = Math.ceil((0 - ox) / s)
  const x1 = Math.floor((w - ox) / s)
  for (let x = x0; x <= x1; x++) {
    if (x === 0) continue
    ctx.fillText(String(x), sx(p, x), oy + 14)
  }
  // y 轴整数刻度
  const y0 = Math.ceil((oy - h) / s)
  const y1 = Math.floor(oy / s)
  for (let y = y0; y <= y1; y++) {
    if (y === 0) continue
    ctx.fillText(String(y), ox - 13, sy(p, y))
  }
  // 原点
  ctx.textAlign = 'left'
  ctx.fillText('O', ox + 5, oy + 13)
}

/** 绘制数据点：实心圆 + 可选坐标文字（label 默认在点右上） */
export function drawPoint(
  p: Plot,
  x: number, y: number,
  color: string,
  label?: string,
  radius = 4.5,
  dx = 10, dy = -8,
): void {
  const { ctx } = p
  const px = sx(p, x)
  const py = sy(p, y)
  if (px < -40 || px > p.w + 40 || py < -40 || py > p.h + 40) return
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(px, py, radius, 0, Math.PI * 2)
  ctx.fill()
  if (label) {
    ctx.fillStyle = color
    ctx.font = '600 13px -apple-system, sans-serif'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'bottom'
    ctx.fillText(label, px + dx, py + dy)
  }
}

/** 绘制虚线（世界坐标 → 屏幕） */
export function dashedLine(
  p: Plot,
  x1: number, y1: number, x2: number, y2: number,
  color: string,
  width = 1.5,
): void {
  const { ctx } = p
  ctx.save()
  ctx.strokeStyle = color
  ctx.lineWidth = width
  ctx.setLineDash([6, 5])
  ctx.beginPath()
  ctx.moveTo(sx(p, x1), sy(p, y1))
  ctx.lineTo(sx(p, x2), sy(p, y2))
  ctx.stroke()
  ctx.restore()
}

/** 数值格式化：去尾零、去负零（用于标注与滑杆读数） */
export function fmt(n: number, decimals = 2): string {
  const eps = 0.5 * Math.pow(10, -decimals)
  if (Math.abs(n) < eps) return '0'
  const s = n.toFixed(decimals).replace(/\.?0+$/, '')
  return s === '-0' ? '0' : s
}
