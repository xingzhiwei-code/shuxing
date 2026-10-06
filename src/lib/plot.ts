// 数形 · 手写 Canvas 绘图工具库（不引入第三方图表库，保证 60fps 与包体积）
// 约定：数学 y 轴向上为正，Canvas y 轴向下为正，坐标变换在 sx / sy 内统一处理。

export interface Colors {
  sep: string
  axis: string
  text: string
  line: string
  point: string
}

const DEFAULTS: Colors = {
  sep: 'rgba(60,60,67,.12)',
  axis: '#8E8E93',
  text: '#3A3A3C',
  line: '#007AFF',
  point: '#FF3B30',
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

/** 适配 devicePixelRatio，返回 2D 上下文（须在元素已有布局尺寸后调用） */
export function setupCanvas(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const dpr = window.devicePixelRatio || 1
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
  ctx.strokeStyle = c.sep
  ctx.lineWidth = 1
  ctx.beginPath()
  const gx0 = ((ox % s) + s) % s
  for (let gx = gx0; gx <= w; gx += s) {
    const px = Math.round(gx) + 0.5
    ctx.moveTo(px, 0); ctx.lineTo(px, h)
  }
  const gy0 = ((oy % s) + s) % s
  for (let gy = gy0; gy <= h; gy += s) {
    const py = Math.round(gy) + 0.5
    ctx.moveTo(0, py); ctx.lineTo(w, py)
  }
  ctx.stroke()
}

/** 绘制坐标轴（含箭头、轴名、整数刻度、原点 O） */
export function drawAxes(p: Plot, c: Colors): void {
  const { ctx, w, h, s, ox, oy } = p
  ctx.strokeStyle = c.axis
  ctx.fillStyle = c.axis
  ctx.lineWidth = 1.5
  ctx.font = '11px -apple-system, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  // 轴
  ctx.beginPath(); ctx.moveTo(0, oy); ctx.lineTo(w, oy); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(ox, 0); ctx.lineTo(ox, h); ctx.stroke()

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

/** 数值格式化：去尾零、去负零（用于标注与滑杆读数） */
export function fmt(n: number, decimals = 2): string {
  const eps = 0.5 * Math.pow(10, -decimals)
  if (Math.abs(n) < eps) return '0'
  const s = n.toFixed(decimals).replace(/\.?0+$/, '')
  return s === '-0' ? '0' : s
}
