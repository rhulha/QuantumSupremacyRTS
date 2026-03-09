import { canvas, ctx, camera, world, input } from './state.js'
import { isVisible, isExplored, drawFog } from './fog.js'
import { drawTank } from './tank.js'
import { drawHelicopter } from './helicopter.js'
import { drawSamTruck } from './sam_truck.js'
import { drawCollector } from './collector.js'
import { drawHQ, updateHQPanel } from './hq.js'
import { drawTiles, drawGrid, drawWorldBounds, drawResource } from './map.js'

function drawUnit(t) {
  if (t.unitType === 'helicopter') drawHelicopter(t)
  else if (t.unitType === 'sam_truck') drawSamTruck(t)
  else drawTank(t)
}

function worldTransform() {
  ctx.setTransform(
    camera.zoom, 0, 0, camera.zoom,
    canvas.width / 2 - camera.x * camera.zoom,
    canvas.height / 2 - camera.y * camera.zoom
  )
}

function drawMoveMarkers() {
  for (const tank of world.units) {
    if (tank.faction !== 'player' || tank.targetX == null) continue
    ctx.strokeStyle = 'rgba(255,255,255,0.4)'
    ctx.lineWidth = 2 / camera.zoom
    ctx.beginPath()
    ctx.arc(tank.targetX, tank.targetY, 10, 0, Math.PI * 2)
    ctx.stroke()

    ctx.strokeStyle = 'rgba(255,255,255,0.35)'
    ctx.lineWidth = 1.5 / camera.zoom
    ctx.beginPath()
    ctx.moveTo(tank.x, tank.y)
    ctx.lineTo(tank.targetX, tank.targetY)
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

  worldTransform()

  if (world.map) drawTiles()
  else drawGrid()
  drawWorldBounds()

  for (const res of world.resources) {
    if (isExplored(res.x, res.y)) drawResource(res)
  }
  if (world.aiHq && isExplored(world.aiHq.x, world.aiHq.y)) drawHQ(world.aiHq, true)
  for (const t of world.units) {
    if (t.faction === 'ai' && !isVisible(t.x, t.y)) continue
    drawUnit(t)
  }
  for (const c of world.collectors) {
    if (c.faction === 'ai' && !isVisible(c.x, c.y)) continue
    drawCollector(c)
  }

  drawFog()

  worldTransform()

  if (world.hq) drawHQ(world.hq)
  for (const t of world.units) {
    if (t.faction === 'player') drawUnit(t)
  }
  for (const c of world.collectors) {
    if (c.faction === 'player') drawCollector(c)
  }
  drawMoveMarkers()

  drawSelectionBox()

  updateHQPanel(world.hq)
}
