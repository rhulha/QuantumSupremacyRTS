import { canvas, camera, world } from './state.js'

export function screenToWorld(screenX, screenY) {
  return {
    x: (screenX - canvas.width / 2) / camera.zoom + camera.x,
    y: (screenY - canvas.height / 2) / camera.zoom + camera.y
  }
}

export function worldToScreen(worldX, worldY) {
  return {
    x: (worldX - camera.x) * camera.zoom + canvas.width / 2,
    y: (worldY - camera.y) * camera.zoom + canvas.height / 2
  }
}

export function clampCamera() {
  const halfW = canvas.width / 2 / camera.zoom
  const halfH = canvas.height / 2 / camera.zoom
  camera.x = Math.max(halfW, Math.min(world.width - halfW, camera.x))
  camera.y = Math.max(halfH, Math.min(world.height - halfH, camera.y))
}
