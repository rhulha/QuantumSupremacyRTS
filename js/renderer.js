import { canvas, ctx, camera, world, input } from './state.js'
import { getAIPhase, getAITankCount } from './ai.js'
import { getFogGrids, isVisible, isExplored, SIGHT_HQ, SIGHT_TANK, SIGHT_COLLECTOR } from './fog.js'

const hqPanel = document.getElementById('hq-panel')
const hqResSpan = document.getElementById('hq-resources')
const hqBuildQueue = document.getElementById('hq-build-queue')
const aiStatus = document.getElementById('ai-status')

const TILE_COLORS = {
  grass:           '#3a6b3e',
  wall:            '#525252',
  desert:          '#b8963e',
  resource_grass:  '#3a6b3e',
  resource_desert: '#b8963e',
  head_quarter:    '#2a3d60',
}

let fogCanvas = null
let fogCtx = null

function worldTransform() {
  ctx.setTransform(
    camera.zoom, 0, 0, camera.zoom,
    canvas.width / 2 - camera.x * camera.zoom,
    canvas.height / 2 - camera.y * camera.zoom
  )
}

function viewportBounds() {
  const hw = canvas.width / 2 / camera.zoom
  const hh = canvas.height / 2 / camera.zoom
  return { left: camera.x - hw, right: camera.x + hw, top: camera.y - hh, bottom: camera.y + hh }
}

function drawTiles() {
  const { cols, rows, tileSize, tiles } = world.map
  const { left, right, top, bottom } = viewportBounds()

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
  const { left, right, top, bottom } = viewportBounds()

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

  if (tank.hp < tank.maxHp) {
    const bw = 36, bh = 4
    const bx = tank.x - bw / 2, by = tank.y - 32
    ctx.fillStyle = '#222'
    ctx.fillRect(bx, by, bw, bh)
    ctx.fillStyle = tank.faction === 'ai' ? '#c04040' : '#40c040'
    ctx.fillRect(bx, by, bw * tank.hp / tank.maxHp, bh)
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

  if (c.hp < c.maxHp) {
    const bw = 24, bh = 3
    const bx = c.x - bw / 2, by = c.y - 24
    ctx.fillStyle = '#222'
    ctx.fillRect(bx, by, bw, bh)
    ctx.fillStyle = c.faction === 'ai' ? '#c04040' : '#40c040'
    ctx.fillRect(bx, by, bw * c.hp / c.maxHp, bh)
  }

  if (c.targetResource && c.collectState === 'fetching') {
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

  if (hq.hp < hq.maxHp) {
    const bw = 80, bh = 6
    const bx = hq.x - bw / 2, by = hq.y - hq.radius - 14
    ctx.fillStyle = '#222'
    ctx.fillRect(bx, by, bw, bh)
    ctx.fillStyle = ai ? '#c04040' : '#4090e0'
    ctx.fillRect(bx, by, bw * hq.hp / hq.maxHp, bh)
  }
}

function drawMoveMarkers() {
  for (const tank of world.tanks) {
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

function drawFog() {
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
  for (const t of world.tanks) {
    if (t.faction === 'ai' && !isVisible(t.x, t.y)) continue
    drawTank(t)
  }
  for (const c of world.collectors) {
    if (c.faction === 'ai' && !isVisible(c.x, c.y)) continue
    drawCollector(c)
  }

  drawFog()

  worldTransform()

  if (world.hq) drawHQ(world.hq)
  for (const t of world.tanks) {
    if (t.faction === 'player') drawTank(t)
  }
  for (const c of world.collectors) {
    if (c.faction === 'player') drawCollector(c)
  }
  drawMoveMarkers()

  drawSelectionBox()

  if (world.hq && world.hq.selected) {
    hqPanel.classList.remove('hidden')
    hqResSpan.textContent = Math.floor(world.hq.resources)
    const q = world.hq.buildQueue
    hqBuildQueue.textContent = q.length > 0
      ? `Building: ${q[0].type} (${q[0].timer.toFixed(1)}s)${q.length > 1 ? ` +${q.length - 1}` : ''}`
      : ''
  } else {
    hqPanel.classList.add('hidden')
  }

  const phase = getAIPhase()
  const count = getAITankCount()
  aiStatus.textContent = phase === 'attacking'
    ? `AI: ATTACKING! (${count} tanks)`
    : `AI: Building (${count} / 40)`
}
