import { world, input } from './state.js'
import { screenToWorld, clampCamera } from './camera.js'
import { Tank, Collector } from './vehicles.js'
import { Resource, HeadQuarters } from './entities.js'

function rand(min, max) {
  return Math.random() * (max - min) + min
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

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const tile = tiles[row][col]
      const cx = col * tileSize + tileSize / 2
      const cy = row * tileSize + tileSize / 2

      if (tile === 'resource_grass' || tile === 'resource_desert') {
        world.resources.push(new Resource(cx, cy))
      } else if (tile === 'head_quarter' && !world.hq) {
        world.hq = new HeadQuarters(cx, cy)
      }
    }
  }

  if (!world.hq) {
    world.hq = new HeadQuarters(world.width / 2, world.height / 2)
  }

  for (let i = 0; i < 2; i++) {
    world.tanks.push(new Tank(world.hq.x + rand(-100, 100), world.hq.y + rand(-100, 100)))
    world.collectors.push(new Collector(world.hq.x + rand(-80, 80), world.hq.y + rand(-80, 80)))
  }
}

function initRandom() {
  world.hq = new HeadQuarters(world.width / 2, world.height / 2)

  for (let i = 0; i < 2; i++) {
    world.tanks.push(new Tank(world.hq.x + rand(-100, 100), world.hq.y + rand(-100, 100)))
    world.collectors.push(new Collector(world.hq.x + rand(-80, 80), world.hq.y + rand(-80, 80)))
  }

  for (let i = 0; i < 8; i++) {
    world.resources.push(new Resource(rand(200, world.width - 200), rand(200, world.height - 200)))
  }
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
  for (const t of world.tanks) t.selected = inRect(t, rect)
  for (const c of world.collectors) c.selected = inRect(c, rect)
  if (world.hq) world.hq.selected = inRect(world.hq, rect)
}

export function clearSelection() {
  for (const t of world.tanks) t.selected = false
  for (const c of world.collectors) c.selected = false
  if (world.hq) world.hq.selected = false
}

export function getClickedEntity(worldX, worldY) {
  const all = [...world.tanks, ...world.collectors, world.hq].filter(Boolean)
  for (let i = all.length - 1; i >= 0; i--) {
    const e = all[i]
    if (Math.hypot(worldX - e.x, worldY - e.y) <= e.radius + 10) return e
  }
  return null
}

export function issueMoveCommand(worldX, worldY) {
  const selected = [
    ...world.tanks.filter(t => t.selected),
    ...world.collectors.filter(c => c.selected)
  ]
  if (!selected.length) return

  const cols = Math.ceil(Math.sqrt(selected.length))
  const spacing = 46
  const rows = Math.ceil(selected.length / cols)
  const startX = worldX - ((cols - 1) * spacing) / 2
  const startY = worldY - ((rows - 1) * spacing) / 2

  selected.forEach((v, index) => {
    const col = index % cols
    const row = Math.floor(index / cols)
    v.targetX = startX + col * spacing
    v.targetY = startY + row * spacing
    if (v instanceof Collector) {
      v.collectState = 'idle'
      v.targetResource = null
    }
  })
}

export function buildTank() {
  const hq = world.hq
  if (!hq || hq.resources < hq.buildCost) return
  hq.resources -= hq.buildCost
  world.tanks.push(new Tank(hq.x + rand(-60, 60), hq.y + rand(-60, 60)))
}

export function update(dt) {
  for (const t of world.tanks) t.update(dt)
  for (const c of world.collectors) c.update(dt, world)
  clampCamera()
}
