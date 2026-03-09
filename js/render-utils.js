import { canvas, ctx, camera } from './state.js'

export function viewportBounds() {
  const hw = canvas.width / 2 / camera.zoom
  const hh = canvas.height / 2 / camera.zoom
  return { left: camera.x - hw, right: camera.x + hw, top: camera.y - hh, bottom: camera.y + hh }
}

export function drawSelectionRing(entity, color) {
  ctx.strokeStyle = color
  ctx.lineWidth = 2 / camera.zoom
  ctx.beginPath()
  ctx.arc(entity.x, entity.y, entity.radius + 10, 0, Math.PI * 2)
  ctx.stroke()
}
