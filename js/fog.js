import { world } from './state.js'

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
