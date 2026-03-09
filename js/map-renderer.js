import { ctx, camera, world } from './state.js'
import { viewportBounds } from './render-utils.js'

const TILE_COLORS = {
  grass:           '#3a6b3e',
  wall:            '#525252',
  desert:          '#b8963e',
  resource_grass:  '#3a6b3e',
  resource_desert: '#b8963e',
  head_quarter:    '#2a3d60',
}

export function drawTiles() {
  const { cols, rows, tileSize, tiles } = world.map
  const { left, right, top, bottom } = viewportBounds()

  const colStart = Math.max(0, Math.floor(left / tileSize))
  const colEnd = Math.min(cols - 1, Math.ceil(right / tileSize))
  const rowStart = Math.max(0, Math.floor(top / tileSize))
  const rowEnd = Math.min(rows - 1, Math.ceil(bottom / tileSize))

  for (let row = rowStart; row <= rowEnd; row++) {
    for (let col = colStart; col <= colEnd; col++) {
      const tile = tiles[row][col]
      ctx.fillStyle = TILE_COLORS[tile] ?? TILE_COLORS.grass
      ctx.fillRect(col * tileSize, row * tileSize, tileSize, tileSize)
    }
  }

  ctx.strokeStyle = 'rgba(0,0,0,0.18)'
  ctx.lineWidth = 1 / camera.zoom
  for (let col = colStart; col <= colEnd + 1; col++) {
    ctx.beginPath()
    ctx.moveTo(col * tileSize, rowStart * tileSize)
    ctx.lineTo(col * tileSize, (rowEnd + 1) * tileSize)
    ctx.stroke()
  }
  for (let row = rowStart; row <= rowEnd + 1; row++) {
    ctx.beginPath()
    ctx.moveTo(colStart * tileSize, row * tileSize)
    ctx.lineTo((colEnd + 1) * tileSize, row * tileSize)
    ctx.stroke()
  }
}

export function drawGrid() {
  const grid = 100
  const { left, right, top, bottom } = viewportBounds()

  ctx.strokeStyle = 'rgba(255,255,255,0.08)'
  ctx.lineWidth = 1 / camera.zoom

  const startX = Math.floor(left / grid) * grid
  const endX = Math.ceil(right / grid) * grid
  const startY = Math.floor(top / grid) * grid
  const endY = Math.ceil(bottom / grid) * grid

  for (let x = startX; x <= endX; x += grid) {
    ctx.beginPath()
    ctx.moveTo(x, top)
    ctx.lineTo(x, bottom)
    ctx.stroke()
  }

  for (let y = startY; y <= endY; y += grid) {
    ctx.beginPath()
    ctx.moveTo(left, y)
    ctx.lineTo(right, y)
    ctx.stroke()
  }
}

export function drawWorldBounds() {
  ctx.strokeStyle = 'rgba(255,255,255,0.18)'
  ctx.lineWidth = 4 / camera.zoom
  ctx.strokeRect(0, 0, world.width, world.height)
}

export function drawResource(res) {
  if (res.amount <= 0) return
  const alpha = res.amount / res.maxAmount
  ctx.save()
  ctx.translate(res.x, res.y)

  ctx.fillStyle = `rgba(80, 200, 255, ${0.25 + alpha * 0.5})`
  ctx.strokeStyle = `rgba(150, 230, 255, ${0.5 + alpha * 0.5})`
  ctx.lineWidth = 2 / camera.zoom

  ctx.beginPath()
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2
    const r = res.radius * (i % 2 === 0 ? 1 : 0.65)
    if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r)
    else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r)
  }
  ctx.closePath()
  ctx.fill()
  ctx.stroke()
  ctx.restore()

  ctx.fillStyle = 'rgba(180,235,255,0.85)'
  ctx.font = `${11 / camera.zoom}px monospace`
  ctx.textAlign = 'center'
  ctx.fillText(Math.ceil(res.amount), res.x, res.y - res.radius - 4 / camera.zoom)
}
