import { world } from './state.js'

export async function loadMap() {
  try {
    const res = await fetch('map.json')
    if (!res.ok) return
    world.map = await res.json()
  } catch {}
}

export function getTileAt(worldX, worldY) {
  if (!world.map) return 'grass'
  const { cols, rows, tileSize, tiles } = world.map
  const col = Math.floor(worldX / tileSize)
  const row = Math.floor(worldY / tileSize)
  if (col < 0 || col >= cols || row < 0 || row >= rows) return 'wall'
  return tiles[row][col]
}
