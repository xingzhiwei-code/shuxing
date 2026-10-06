// 生成 README 演示 GIF：用无头浏览器驱动真实页面，逐帧截图后用 gifenc 合成动画。
// 用法：先 npm run build，再 node scripts/make-demo-gif.mjs
// 依赖（devDependencies）：playwright（浏览器）、gifenc、pngjs
import { chromium } from 'playwright'
import { createServer } from 'node:http'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { extname, join, normalize, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import gifenc from 'gifenc'
import pngjs from 'pngjs'

const { GIFEncoder, quantize, applyPalette } = gifenc
const { PNG } = pngjs

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const DIST = join(ROOT, 'dist')
const OUT = join(ROOT, 'docs', 'demo.gif')

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
}

function serve() {
  return createServer(async (req, res) => {
    try {
      let p = decodeURIComponent(new URL(req.url, 'http://x').pathname)
      if (p === '/') p = '/index.html'
      const file = join(DIST, normalize(p).replace(/^([/\\])+/, ''))
      const data = await readFile(file)
      res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream' })
      res.end(data)
    } catch {
      res.writeHead(404)
      res.end('not found')
    }
  })
}

async function main() {
  const server = serve()
  await new Promise((r) => server.listen(0, '127.0.0.1', r))
  const port = server.address().port

  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 760, height: 1000 }, deviceScaleFactor: 1 })

  try {
    await page.goto(`http://127.0.0.1:${port}/#/linear`, { waitUntil: 'load' })
    await page.waitForSelector('#plot')

    // 固定 b = 2，让直线绕 (0, 2) 转动，截距点更直观
    await page.locator('#b').evaluate((el) => {
      el.value = '2'
      el.dispatchEvent(new Event('input', { bubbles: true }))
    })
    await page.waitForTimeout(80)

    const box = await page.locator('#plot').boundingBox()
    const clip = {
      x: Math.max(0, box.x - 6),
      y: box.y - 6,
      width: box.width + 12,
      height: box.height + 150,
    }

    const N = 72
    const frames = []
    const slider = page.locator('#k')
    for (let i = 0; i <= N; i++) {
      const t = i / N
      let v
      if (t < 0.34) v = 1 + 2 * (t / 0.34)
      else if (t < 0.67) v = 3 - 6 * ((t - 0.34) / 0.33)
      else v = -3 + 4 * ((t - 0.67) / 0.33)
      await slider.evaluate((el, val) => {
        el.value = String(val)
        el.dispatchEvent(new Event('input', { bubbles: true }))
      }, v)
      await page.waitForTimeout(25)
      const buf = await page.screenshot({ clip })
      const png = PNG.sync.read(buf)
      frames.push({ width: png.width, height: png.height, data: png.data })
    }

    const palette = quantize(frames[0].data, 256)
    const gif = GIFEncoder()
    for (const f of frames) {
      const index = applyPalette(f.data, palette)
      gif.writeFrame(index, f.width, f.height, { palette, delay: 40 })
    }
    gif.finish()

    await mkdir(dirname(OUT), { recursive: true })
    await writeFile(OUT, gif.bytes())
    console.log(`GIF 生成完成: ${OUT}`)
    console.log(`尺寸 ${frames[0].width}x${frames[0].height}，共 ${frames.length} 帧`)
  } finally {
    await browser.close()
    server.close()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
