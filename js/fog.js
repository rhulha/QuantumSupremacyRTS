import { canvas, ctx, camera, world } from './state.js'
import { viewportBounds } from './render-utils.js'

export const SIGHT_HQ = 500
export const SIGHT_TANK = 380
export const SIGHT_COLLECTOR = 260

let exploredGrid = null
let visGrid = null
let gridCols = 0
let gridRows = 0
let ts = 100

export function initFog() {
  ts = world.map?.tileSize ?? 100
  gridCols = world.map?.cols ?? Math.ceil(world.width / ts)
  gridRows = world.map?.rows ?? Math.ceil(world.height / ts)
  exploredGrid = Array.from({ length: gridRows }, () => new Uint8Array(gridCols))
  visGrid = Array.from({ length: gridRows }, () => new Uint8Array(gridCols))
}

function sightOf(src) {
  if (src === world.hq) return SIGHT_HQ
  if (src.radius === 14) return SIGHT_COLLECTOR
  return SIGHT_TANK
}

export function updateFog() {
  if (!exploredGrid) return

  for (let r = 0; r < gridRows; r++) visGrid[r].fill(0)

  const sources = [
    ...world.tanks.filter(t => t.faction === 'player'),
    ...world.collectors.filter(c => c.faction === 'player'),
    world.hq
  ].filter(Boolean)

  for (const src of sources) {
    const r = sightOf(src)
    const minCol = Math.max(0, Math.floor((src.x - r) / ts))
    const maxCol = Math.min(gridCols - 1, Math.ceil((src.x + r) / ts))
    const minRow = Math.max(0, Math.floor((src.y - r) / ts))
    const maxRow = Math.min(gridRows - 1, Math.ceil((src.y + r) / ts))

    for (let row = minRow; row <= maxRow; row++) {
      for (let col = minCol; col <= maxCol; col++) {
        const cx = col * ts + ts / 2
        const cy = row * ts + ts / 2
        if (Math.hypot(cx - src.x, cy - src.y) <= r) {
          exploredGrid[row][col] = 1
          visGrid[row][col] = 1
        }
      }
    }
  }
}

export function isVisible(worldX, worldY) {
  if (!visGrid) return true
  const col = Math.floor(worldX / ts)
  const row = Math.floor(worldY / ts)
  if (col < 0 || col >= gridCols || row < 0 || row >= gridRows) return false
  return visGrid[row][col] === 1
}

export function isExplored(worldX, worldY) {
  if (!exploredGrid) return true
  const col = Math.floor(worldX / ts)
  const row = Math.floor(worldY / ts)
  if (col < 0 || col >= gridCols || row < 0 || row >= gridRows) return false
  return exploredGrid[row][col] === 1
}

export function getFogGrids() {
  return { exploredGrid, visGrid, gridCols, gridRows, ts }
}

let fogCanvas = null
let fogCtx = null

export function drawFog() {
  const { exploredGrid, visGrid, gridCols, gridRows, ts } = getFogGrids()
  if (!visGrid) return

  if (!fogCanvas || fogCanvas.width !== canvas.width || fogCanvas.height !== canvas.height) {
    fogCanvas = document.createElement('canvas')
    fogCanvas.width = canvas.width
    fogCanvas.height = canvas.height
    fogCtx = fogCanvas.getContext('2d')
  }

  const fc = fogCtx
  fc.clearRect(0, 0, fogCanvas.width, fogCanvas.height)
  fc.setTransform(
    camera.zoom, 0, 0, camera.zoom,
    canvas.width / 2 - camera.x * camera.zoom,
    canvas.height / 2 - camera.y * camera.zoom
  )

  const { left, right, top, bottom } = viewportBounds()
  const colStart = Math.max(0, Math.floor(left / ts))
  const colEnd = Math.min(gridCols - 1, Math.ceil(right / ts))
  const rowStart = Math.max(0, Math.floor(top / ts))
  const rowEnd = Math.min(gridRows - 1, Math.ceil(bottom / ts))

  for (let row = rowStart; row <= rowEnd; row++) {
    for (let col = colStart; col <= colEnd; col++) {
      if (visGrid[row][col] === 1) continue
      fc.fillStyle = exploredGrid[row][col] === 1
        ? 'rgba(0,0,0,0.06)'
        : 'rgba(0,0,0,0.16)'
      fc.fillRect(col * ts, row * ts, ts, ts)
    }
  }

  fc.globalCompositeOperation = 'destination-out'

  const sources = [
    ...world.tanks.filter(t => t.faction === 'player'),
    ...world.collectors.filter(c => c.faction === 'player'),
    world.hq
  ].filter(Boolean)

  for (const src of sources) {
    const r = src === world.hq ? SIGHT_HQ : src.radius === 14 ? SIGHT_COLLECTOR : SIGHT_TANK
    const grad = fc.createRadialGradient(src.x, src.y, r * 0.65, src.x, src.y, r)
    grad.addColorStop(0, 'rgba(0,0,0,1)')
    grad.addColorStop(1, 'rgba(0,0,0,0)')
    fc.fillStyle = grad
    fc.beginPath()
    fc.arc(src.x, src.y, r, 0, Math.PI * 2)
    fc.fill()
  }

  fc.globalCompositeOperation = 'source-over'
  fc.setTransform(1, 0, 0, 1, 0, 0)

  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.drawImage(fogCanvas, 0, 0)
}
