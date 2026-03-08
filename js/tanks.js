import { world, input } from './state.js'
import { screenToWorld, clampCamera } from './camera.js'

function rand(min, max) {
  return Math.random() * (max - min) + min
}

function createTank(id) {
  return {
    id,
    x: rand(150, world.width - 150),
    y: rand(150, world.height - 150),
    angle: rand(0, Math.PI * 2),
    speed: 85,
    selected: false,
    targetX: null,
    targetY: null,
    radius: 18
  }
}

for (let i = 0; i < 14; i++) {
  world.tanks.push(createTank(i + 1))
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

export function setSelectionFromBox() {
  const rect = getSelectionRectWorld()
  for (const tank of world.tanks) {
    tank.selected = tank.x >= rect.x1 && tank.x <= rect.x2 && tank.y >= rect.y1 && tank.y <= rect.y2
  }
}

export function clearSelection() {
  for (const tank of world.tanks) {
    tank.selected = false
  }
}

export function issueMoveCommand(worldX, worldY) {
  const selected = world.tanks.filter(t => t.selected)
  if (!selected.length) return

  const cols = Math.ceil(Math.sqrt(selected.length))
  const spacing = 46
  const rows = Math.ceil(selected.length / cols)
  const startX = worldX - ((cols - 1) * spacing) / 2
  const startY = worldY - ((rows - 1) * spacing) / 2

  selected.forEach((tank, index) => {
    const col = index % cols
    const row = Math.floor(index / cols)
    tank.targetX = startX + col * spacing
    tank.targetY = startY + row * spacing
  })
}

export function update(dt) {
  for (const tank of world.tanks) {
    if (tank.targetX == null || tank.targetY == null) continue

    const dx = tank.targetX - tank.x
    const dy = tank.targetY - tank.y
    const dist = Math.hypot(dx, dy)

    if (dist < 2) {
      tank.x = tank.targetX
      tank.y = tank.targetY
      tank.targetX = null
      tank.targetY = null
      continue
    }

    const step = Math.min(dist, tank.speed * dt)
    tank.x += (dx / dist) * step
    tank.y += (dy / dist) * step
    tank.angle = Math.atan2(dy, dx)
  }

  clampCamera()
}
