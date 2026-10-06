// 函数解析式的中文规范读法（诚实处理 k=0 / a=0 / b=0 / 系数为 ±1 等边界）

import { fmt } from './plot'

/** y = kx + b */
export function linearFormula(k: number, b: number): string {
  if (k === 0) return `y = ${fmt(b)}`
  let term = ''
  if (k === 1) term = 'x'
  else if (k === -1) term = '−x'
  else term = `${fmt(k)}x`
  let s = `y = ${term}`
  if (b > 0) s += ` + ${fmt(b)}`
  else if (b < 0) s += ` − ${fmt(Math.abs(b))}`
  return s
}

/** y = ax² + bx + c（a=0 时退化为一次函数） */
export function quadraticFormula(a: number, b: number, c: number): string {
  if (a === 0) return linearFormula(b, c)
  let s = 'y = '
  if (a === 1) s += 'x²'
  else if (a === -1) s += '−x²'
  else s += `${fmt(a)}x²`
  if (b === 1) s += ' + x'
  else if (b === -1) s += ' − x'
  else if (b > 0) s += ` + ${fmt(b)}x`
  else if (b < 0) s += ` − ${fmt(Math.abs(b))}x`
  if (c > 0) s += ` + ${fmt(c)}`
  else if (c < 0) s += ` − ${fmt(Math.abs(c))}`
  return s
}
