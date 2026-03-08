import { canvas, ctx, camera, world, input } from './state.js'

function drawGrid() {
  const grid = 100
  const viewHalfW = canvas.width / 2 / camera.zoom
  const viewHalfH = canvas.height / 2 / camera.zoom
  const left = camera.x - viewHalfW
  const right = camera.x + viewHalfW
  const top = camera.y - viewHalfH
  const bottom = camera.y + viewHalfH

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

function drawWorldBounds() {
  ctx.strokeStyle = 'rgba(255,255,255,0.18)'
  ctx.lineWidth = 4 / camera.zoom
  ctx.strokeRect(0, 0, world.width, world.height)
}

function drawTank(tank) {
  ctx.save()
  ctx.translate(tank.x, tank.y)
  ctx.rotate(tank.angle)

  ctx.fillStyle = tank.selected ? '#8ef58e' : '#5ea05e'
  ctx.strokeStyle = tank.selected ? '#d8ffd8' : '#1f301f'
  ctx.lineWidth = 2 / camera.zoom

  ctx.beginPath()
  ctx.roundRect(-20, -14, 40, 28, 6 / camera.zoom)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = '#2f4a2f'
  ctx.fillRect(-10, -10, 20, 20)

  ctx.strokeStyle = '#d7e6d7'
  ctx.lineWidth = 4 / camera.zoom
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.lineTo(28, 0)
  ctx.stroke()

  ctx.restore()

  if (tank.selected) {
    ctx.strokeStyle = 'rgba(180,255,180,0.95)'
    ctx.lineWidth = 2 / camera.zoom
    ctx.beginPath()
    ctx.arc(tank.x, tank.y, tank.radius + 10, 0, Math.PI * 2)
    ctx.stroke()
  }

  if (tank.targetX != null && tank.targetY != null) {
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'
    ctx.lineWidth = 1.5 / camera.zoom
    ctx.beginPath()
    ctx.moveTo(tank.x, tank.y)
    ctx.lineTo(tank.targetX, tank.targetY)
    ctx.stroke()
  }
}

function drawMoveMarkers() {
  for (const tank of world.tanks) {
    if (tank.targetX == null || tank.targetY == null) continue
    ctx.strokeStyle = 'rgba(255,255,255,0.4)'
    ctx.lineWidth = 2 / camera.zoom
    ctx.beginPath()
    ctx.arc(tank.targetX, tank.targetY, 10, 0, Math.PI * 2)
    ctx.stroke()
  }
}

function drawSelectionBox() {
  if (!input.isBoxSelecting) return
  const x = Math.min(input.dragStartX, input.dragCurrentX)
  const y = Math.min(input.dragStartY, input.dragCurrentY)
  const w = Math.abs(input.dragCurrentX - input.dragStartX)
  const h = Math.abs(input.dragCurrentY - input.dragStartY)

  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.fillStyle = 'rgba(120, 190, 255, 0.18)'
  ctx.strokeStyle = 'rgba(150, 210, 255, 0.95)'
  ctx.lineWidth = 1
  ctx.fillRect(x, y, w, h)
  ctx.strokeRect(x, y, w, h)
}

export function render() {
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  ctx.setTransform(
    camera.zoom,
    0,
    0,
    camera.zoom,
    canvas.width / 2 - camera.x * camera.zoom,
    canvas.height / 2 - camera.y * camera.zoom
  )

  drawGrid()
  drawWorldBounds()
  drawMoveMarkers()

  for (const tank of world.tanks) {
    drawTank(tank)
  }

  drawSelectionBox()
}
