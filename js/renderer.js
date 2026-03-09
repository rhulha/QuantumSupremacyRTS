import { canvas, ctx, camera, world, input } from './state.js'
import { getAIPhase, getAITankCount } from './ai.js'

const hqPanel = document.getElementById('hq-panel')
const hqResSpan = document.getElementById('hq-resources')
const aiStatus = document.getElementById('ai-status')

const TILE_COLORS = {
  grass:           '#3a6b3e',
  wall:            '#525252',
  desert:          '#b8963e',
  resource_grass:  '#3a6b3e',
  resource_desert: '#b8963e',
  head_quarter:    '#2a3d60',
}

function drawTiles() {
  const { cols, rows, tileSize, tiles } = world.map
  const viewHalfW = canvas.width / 2 / camera.zoom
  const viewHalfH = canvas.height / 2 / camera.zoom
  const left = camera.x - viewHalfW
  const right = camera.x + viewHalfW
  const top = camera.y - viewHalfH
  const bottom = camera.y + viewHalfH

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

function drawResource(res) {
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

function drawTank(tank) {
  const ai = tank.faction === 'ai'
  ctx.save()
  ctx.translate(tank.x, tank.y)
  ctx.rotate(tank.angle)

  ctx.fillStyle = ai ? '#c03030' : (tank.selected ? '#8ef58e' : '#5ea05e')
  ctx.strokeStyle = ai ? '#600000' : (tank.selected ? '#d8ffd8' : '#1f301f')
  ctx.lineWidth = 2 / camera.zoom

  ctx.beginPath()
  ctx.roundRect(-20, -14, 40, 28, 6 / camera.zoom)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = ai ? '#6a1010' : '#2f4a2f'
  ctx.fillRect(-10, -10, 20, 20)

  ctx.strokeStyle = ai ? '#ffaaaa' : '#d7e6d7'
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

  if (tank.targetX != null) {
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'
    ctx.lineWidth = 1.5 / camera.zoom
    ctx.beginPath()
    ctx.moveTo(tank.x, tank.y)
    ctx.lineTo(tank.targetX, tank.targetY)
    ctx.stroke()
  }
}

function drawCollector(c) {
  const ai = c.faction === 'ai'
  ctx.save()
  ctx.translate(c.x, c.y)
  ctx.rotate(c.angle)

  ctx.fillStyle = ai ? '#c06020' : (c.selected ? '#f5e87a' : '#b5a84a')
  ctx.strokeStyle = ai ? '#602000' : (c.selected ? '#ffffc0' : '#3a3010')
  ctx.lineWidth = 2 / camera.zoom

  ctx.beginPath()
  ctx.roundRect(-14, -10, 28, 20, 5 / camera.zoom)
  ctx.fill()
  ctx.stroke()

  if (c.carrying > 0) {
    ctx.fillStyle = 'rgba(80, 200, 255, 0.85)'
    ctx.fillRect(-5, -5, 10, 10)
  }

  ctx.restore()

  if (c.selected) {
    ctx.strokeStyle = 'rgba(255,240,120,0.9)'
    ctx.lineWidth = 2 / camera.zoom
    ctx.beginPath()
    ctx.arc(c.x, c.y, c.radius + 8, 0, Math.PI * 2)
    ctx.stroke()
  }

  if (c.targetX != null) {
    ctx.strokeStyle = 'rgba(255,240,100,0.35)'
    ctx.lineWidth = 1.5 / camera.zoom
    ctx.beginPath()
    ctx.moveTo(c.x, c.y)
    ctx.lineTo(c.targetX, c.targetY)
    ctx.stroke()
  } else if (c.targetResource && c.collectState === 'fetching') {
    ctx.strokeStyle = 'rgba(80,200,255,0.3)'
    ctx.lineWidth = 1 / camera.zoom
    ctx.setLineDash([6 / camera.zoom, 6 / camera.zoom])
    ctx.beginPath()
    ctx.moveTo(c.x, c.y)
    ctx.lineTo(c.targetResource.x, c.targetResource.y)
    ctx.stroke()
    ctx.setLineDash([])
  }
}

function drawHQ(hq, ai = false) {
  ctx.save()
  ctx.translate(hq.x, hq.y)

  ctx.fillStyle = ai ? '#602020' : (hq.selected ? '#5080c8' : '#304878')
  ctx.strokeStyle = ai ? '#300000' : (hq.selected ? '#a0c0ff' : '#1a2840')
  ctx.lineWidth = 3 / camera.zoom
  ctx.beginPath()
  ctx.roundRect(-hq.radius, -hq.radius, hq.radius * 2, hq.radius * 2, 8 / camera.zoom)
  ctx.fill()
  ctx.stroke()

  ctx.strokeStyle = ai ? '#ff8888' : (hq.selected ? '#c0e0ff' : '#8aafdf')
  ctx.lineWidth = 4 / camera.zoom
  ctx.beginPath()
  ctx.moveTo(-16, 0)
  ctx.lineTo(16, 0)
  ctx.moveTo(0, -16)
  ctx.lineTo(0, 16)
  ctx.stroke()

  ctx.restore()

  if (hq.selected) {
    ctx.strokeStyle = 'rgba(100,160,255,0.9)'
    ctx.lineWidth = 2 / camera.zoom
    ctx.beginPath()
    ctx.arc(hq.x, hq.y, hq.radius + 10, 0, Math.PI * 2)
    ctx.stroke()
  }
}

function drawMoveMarkers() {
  for (const tank of world.tanks) {
    if (tank.targetX == null) continue
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

  if (world.map) drawTiles()
  else drawGrid()
  drawWorldBounds()

  for (const res of world.resources) drawResource(res)
  if (world.hq) drawHQ(world.hq)
  if (world.aiHq) drawHQ(world.aiHq, true)

  drawMoveMarkers()

  for (const t of world.tanks) drawTank(t)
  for (const c of world.collectors) drawCollector(c)

  drawSelectionBox()

  if (world.hq && world.hq.selected) {
    hqPanel.classList.remove('hidden')
    hqResSpan.textContent = Math.floor(world.hq.resources)
  } else {
    hqPanel.classList.add('hidden')
  }

  const phase = getAIPhase()
  const count = getAITankCount()
  aiStatus.textContent = phase === 'attacking'
    ? `AI: ATTACKING! (${count} tanks)`
    : `AI: Building (${count} / 40)`
}
