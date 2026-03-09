import { canvas, camera } from './state.js'

export function viewportBounds() {
  const hw = canvas.width / 2 / camera.zoom
  const hh = canvas.height / 2 / camera.zoom
  return { left: camera.x - hw, right: camera.x + hw, top: camera.y - hh, bottom: camera.y + hh }
}
