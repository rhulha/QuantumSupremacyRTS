import { canvas, camera, input, world } from './state.js'
import { screenToWorld, clampCamera } from './camera.js'
import { issueMoveCommand, setSelectionFromBox, clearSelection, getClickedEntity, buildTank, buildCollector } from './game.js'

function isWall(wx, wy) {
  if (!world.map) return false
  const { tileSize, tiles, rows, cols } = world.map
  const col = Math.floor(wx / tileSize)
  const row = Math.floor(wy / tileSize)
  if (row < 0 || row >= rows || col < 0 || col >= cols) return false
  return tiles[row][col] === 'wall'
}

canvas.addEventListener('contextmenu', e => e.preventDefault())

window.addEventListener('keydown', e => {
  if (e.key === 'Shift') input.shift = true
})

window.addEventListener('keyup', e => {
  if (e.key === 'Shift') input.shift = false
})

canvas.addEventListener('mousedown', e => {
  const rect = canvas.getBoundingClientRect()
  input.mouseX = e.clientX - rect.left
  input.mouseY = e.clientY - rect.top

  if (e.button === 1 || (e.button === 0 && input.shift)) {
    input.isPanning = true
    input.panLastX = input.mouseX
    input.panLastY = input.mouseY
    return
  }

  if (e.button === 0) {
    input.leftDown = true
    input.dragStartX = input.mouseX
    input.dragStartY = input.mouseY
    input.dragCurrentX = input.mouseX
    input.dragCurrentY = input.mouseY
    input.isBoxSelecting = true
    return
  }

  if (e.button === 2) {
    const target = screenToWorld(input.mouseX, input.mouseY)
    if (!isWall(target.x, target.y)) issueMoveCommand(target.x, target.y)
  }
})

canvas.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect()
  input.mouseX = e.clientX - rect.left
  input.mouseY = e.clientY - rect.top

  if (input.isPanning) {
    const dx = input.mouseX - input.panLastX
    const dy = input.mouseY - input.panLastY
    camera.x -= dx / camera.zoom
    camera.y -= dy / camera.zoom
    input.panLastX = input.mouseX
    input.panLastY = input.mouseY
  }

  if (input.isBoxSelecting) {
    input.dragCurrentX = input.mouseX
    input.dragCurrentY = input.mouseY
  }
})

window.addEventListener('mouseup', e => {
  if (e.button === 1 || (e.button === 0 && input.isPanning)) {
    input.isPanning = false
  }

  if (e.button === 0 && input.isBoxSelecting) {
    const dragDist = Math.hypot(input.dragCurrentX - input.dragStartX, input.dragCurrentY - input.dragStartY)
    if (dragDist < 4) {
      const worldPos = screenToWorld(input.dragCurrentX, input.dragCurrentY)
      const clicked = getClickedEntity(worldPos.x, worldPos.y)
      clearSelection()
      if (clicked) clicked.selected = true
    } else {
      setSelectionFromBox()
    }

    input.leftDown = false
    input.isBoxSelecting = false
  }
})

canvas.addEventListener('wheel', e => {
  e.preventDefault()

  const rect = canvas.getBoundingClientRect()
  const mouseX = e.clientX - rect.left
  const mouseY = e.clientY - rect.top

  const before = screenToWorld(mouseX, mouseY)
  const zoomFactor = e.deltaY < 0 ? 1.12 : 1 / 1.12
  camera.zoom *= zoomFactor
  camera.zoom = Math.max(camera.minZoom, Math.min(camera.maxZoom, camera.zoom))
  const after = screenToWorld(mouseX, mouseY)

  camera.x += before.x - after.x
  camera.y += before.y - after.y
  clampCamera()
}, { passive: false })

document.getElementById('btn-build-tank').addEventListener('click', () => {
  buildTank()
})

document.getElementById('btn-build-collector').addEventListener('click', () => {
  buildCollector()
})
