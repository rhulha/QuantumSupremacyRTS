import { world, input } from './state.js'
import { screenToWorld, clampCamera } from './camera.js'
import { Tank } from './tank.js'
import { Collector } from './collector.js'
import { Helicopter } from './helicopter.js'
import { SamTruck } from './sam_truck.js'
import { Resource, HeadQuarters } from './entities.js'
import { findPath } from './pathfinding.js'

function rand(min, max) {
  return Math.random() * (max - min) + min
}

function farthestCorner(hq) {
  const corners = [
    { x: 250, y: 250 },
    { x: world.width - 250, y: 250 },
    { x: 250, y: world.height - 250 },
    { x: world.width - 250, y: world.height - 250 },
  ]
  return corners.reduce((best, c) => {
    const d = Math.hypot(c.x - hq.x, c.y - hq.y)
    return d > best.d ? { pos: c, d } : best
  }, { pos: corners[0], d: 0 }).pos
}

function spawnPosNear(hq) {
  const cx = world.width / 2
  const cy = world.height / 2

  if (!world.map) {
    const dx = cx - hq.x
    const dy = cy - hq.y
    const len = Math.hypot(dx, dy) || 1
    return { x: hq.x + (dx / len) * 80 + rand(-20, 20), y: hq.y + (dy / len) * 80 + rand(-20, 20) }
  }

  const { tileSize, tiles, cols, rows } = world.map
  const hqCol = Math.floor(hq.x / tileSize)
  const hqRow = Math.floor(hq.y / tileSize)
  const dcx = cx / tileSize - hqCol
  const dcy = cy / tileSize - hqRow
  const len = Math.hypot(dcx, dcy) || 1
  const nx = dcx / len
  const ny = dcy / len

  const candidates = []
  for (let dr = -2; dr <= 2; dr++) {
    for (let dc = -2; dc <= 2; dc++) {
      if (Math.abs(dr) < 1 && Math.abs(dc) < 1) continue
      const col = hqCol + dc
      const row = hqRow + dr
      if (col < 0 || col >= cols || row < 0 || row >= rows) continue
      if (tiles[row][col] === 'wall') continue
      candidates.push({ col, row, score: dc * nx + dr * ny })
    }
  }

  if (candidates.length === 0) return { x: hq.x, y: hq.y }

  candidates.sort((a, b) => b.score - a.score)
  const topN = Math.max(1, Math.ceil(candidates.length / 3))
  const pick = candidates[Math.floor(Math.random() * topN)]
  return { x: pick.col * tileSize + tileSize / 2, y: pick.row * tileSize + tileSize / 2 }
}

function spawnUnitsNear(hq) {
  for (let i = 0; i < 2; i++) {
    const tp = spawnPosNear(hq)
    const t = new Tank(tp.x, tp.y)
    t.faction = hq === world.hq ? 'player' : 'ai'
    world.tanks.push(t)

    const cp = spawnPosNear(hq)
    const c = new Collector(cp.x, cp.y, hq)
    c.faction = t.faction
    world.collectors.push(c)
  }
}

export function init() {
  if (world.map) {
    initFromMap()
  } else {
    initRandom()
  }
}

function initFromMap() {
  const { cols, rows, tileSize, tiles } = world.map
  const hqPositions = []

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const tile = tiles[row][col]
      const cx = col * tileSize + tileSize / 2
      const cy = row * tileSize + tileSize / 2

      if (tile === 'resource_grass' || tile === 'resource_desert') {
        world.resources.push(new Resource(cx, cy))
      } else if (tile === 'head_quarter') {
        hqPositions.push({ x: cx, y: cy })
      }
    }
  }

  const playerPos = hqPositions[0] ?? { x: world.width / 2, y: world.height / 2 }
  world.hq = new HeadQuarters(playerPos.x, playerPos.y)

  if (hqPositions[1]) {
    world.aiHq = new HeadQuarters(hqPositions[1].x, hqPositions[1].y)
  } else {
    const pos = farthestCorner(world.hq)
    world.aiHq = new HeadQuarters(pos.x, pos.y)
  }

  if (world.resources.length === 0) {
    for (let i = 0; i < 8; i++) {
      world.resources.push(new Resource(rand(200, world.width - 200), rand(200, world.height - 200)))
    }
  }

  spawnUnitsNear(world.hq)
  spawnUnitsNear(world.aiHq)
}

function initRandom() {
  world.hq = new HeadQuarters(world.width / 2, world.height / 2)
  const aiPos = farthestCorner(world.hq)
  world.aiHq = new HeadQuarters(aiPos.x, aiPos.y)

  for (let i = 0; i < 8; i++) {
    world.resources.push(new Resource(rand(200, world.width - 200), rand(200, world.height - 200)))
  }

  spawnUnitsNear(world.hq)
  spawnUnitsNear(world.aiHq)
}

export function getSelectionRectWorld() {
  const a = screenToWorld(input.dragStartX, input.dragStartY)
  const b = screenToWorld(input.dragCurrentX, input.dragCurrentY)
  return {
    x1: Math.min(a.x, b.x),
    y1: Math.min(a.y, b.y),
    x2: Math.max(a.x, b.x),
    y2: Math.max(a.y, b.y)
  }
}

function inRect(entity, rect) {
  return entity.x >= rect.x1 && entity.x <= rect.x2 && entity.y >= rect.y1 && entity.y <= rect.y2
}

export function setSelectionFromBox() {
  const rect = getSelectionRectWorld()
  for (const t of world.tanks) t.selected = t.faction === 'player' && inRect(t, rect)
  if (world.hq) world.hq.selected = inRect(world.hq, rect)
}

export function clearSelection() {
  for (const t of world.tanks) t.selected = false
  if (world.hq) world.hq.selected = false
}

export function getClickedEntity(worldX, worldY) {
  const all = [
    ...world.tanks.filter(t => t.faction === 'player'),
    world.hq
  ].filter(Boolean)
  for (let i = all.length - 1; i >= 0; i--) {
    const e = all[i]
    if (Math.hypot(worldX - e.x, worldY - e.y) <= e.radius + 10) return e
  }
  return null
}

export function issueMoveCommand(worldX, worldY) {
  const selected = world.tanks.filter(t => t.selected)
  if (!selected.length) return

  const cols = Math.ceil(Math.sqrt(selected.length))
  const spacing = 46
  const rows = Math.ceil(selected.length / cols)
  const startX = worldX - ((cols - 1) * spacing) / 2
  const startY = worldY - ((rows - 1) * spacing) / 2

  selected.forEach((v, index) => {
    const col = index % cols
    const row = Math.floor(index / cols)
    const tx = startX + col * spacing
    const ty = startY + row * spacing
    if (v.unitType === 'helicopter') {
      v.path = null
      v.targetX = tx
      v.targetY = ty
    } else {
      const path = findPath(v.x, v.y, tx, ty)
      if (path) {
        v.path = path
        v.targetX = null
        v.targetY = null
      } else {
        v.path = null
        v.targetX = tx
        v.targetY = ty
      }
    }
  })
}

export function buildTank() {
  const hq = world.hq
  if (!hq || hq.resources < hq.buildCost) return
  hq.resources -= hq.buildCost
  hq.buildQueue.push({ type: 'tank', timer: 5, totalTime: 5 })
}

export function buildCollector() {
  const hq = world.hq
  if (!hq || hq.resources < hq.collectorBuildCost) return
  hq.resources -= hq.collectorBuildCost
  hq.buildQueue.push({ type: 'collector', timer: 4, totalTime: 4 })
}

export function buildHelicopter() {
  const hq = world.hq
  if (!hq || hq.resources < hq.helicopterBuildCost) return
  hq.resources -= hq.helicopterBuildCost
  hq.buildQueue.push({ type: 'helicopter', timer: 6, totalTime: 6 })
}

export function buildSamTruck() {
  const hq = world.hq
  if (!hq || hq.resources < hq.samTruckBuildCost) return
  hq.resources -= hq.samTruckBuildCost
  hq.buildQueue.push({ type: 'sam_truck', timer: 7, totalTime: 7 })
}

function processQueue(hq, faction, dt) {
  if (!hq) return
  for (const job of hq.buildQueue) {
    job.timer -= dt
  }
  const done = hq.buildQueue.filter(j => j.timer <= 0)
  hq.buildQueue = hq.buildQueue.filter(j => j.timer > 0)
  for (const job of done) {
    if (job.type === 'tank') {
      const p = spawnPosNear(hq)
      const t = new Tank(p.x, p.y)
      t.faction = faction
      world.tanks.push(t)
    } else if (job.type === 'collector') {
      const p = spawnPosNear(hq)
      const c = new Collector(p.x, p.y, hq)
      c.faction = faction
      world.collectors.push(c)
    } else if (job.type === 'helicopter') {
      const p = spawnPosNear(hq)
      const h = new Helicopter(p.x, p.y)
      h.faction = faction
      world.tanks.push(h)
    } else if (job.type === 'sam_truck') {
      const p = spawnPosNear(hq)
      const s = new SamTruck(p.x, p.y)
      s.faction = faction
      world.tanks.push(s)
    }
  }
}

function applySeparation(dt) {
  const all = [...world.tanks.filter(t => t.unitType !== 'helicopter'), ...world.collectors]
  for (let i = 0; i < all.length; i++) {
    for (let j = i + 1; j < all.length; j++) {
      const a = all[i], b = all[j]
      const dx = b.x - a.x
      const dy = b.y - a.y
      const dist = Math.hypot(dx, dy)
      const minDist = a.radius + b.radius
      if (dist === 0 || dist >= minDist) continue
      const push = (minDist - dist) / minDist * 60 * dt
      const nx = dx / dist
      const ny = dy / dist
      a.x -= nx * push
      a.y -= ny * push
      b.x += nx * push
      b.y += ny * push
    }
  }
}

export function update(dt) {
  processQueue(world.hq, 'player', dt)
  processQueue(world.aiHq, 'ai', dt)

  world.tanks = world.tanks.filter(t => t.hp > 0)
  world.collectors = world.collectors.filter(c => c.hp > 0)

  for (const t of world.tanks) t.update(dt, world)
  for (const c of world.collectors) c.update(dt, world)
  applySeparation(dt)
  clampCamera()
}
