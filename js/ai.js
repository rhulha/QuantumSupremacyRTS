import { world } from './state.js'
import { SIGHT_HQ, SIGHT_TANK, SIGHT_COLLECTOR } from './fog.js'
import { findPath } from './pathfinding.js'

let aiExplored = null
let gridCols = 0
let gridRows = 0
let ts = 100

const ROLES = ['collector_hunter', 'hq_hunter', 'tank_hunter']

export function initAI() {
  ts = world.map?.tileSize ?? 100
  gridCols = world.map?.cols ?? Math.ceil(world.width / ts)
  gridRows = world.map?.rows ?? Math.ceil(world.height / ts)
  aiExplored = Array.from({ length: gridRows }, () => new Uint8Array(gridCols))
}

function updateAIExplored() {
  const sources = [
    ...world.tanks.filter(t => t.faction === 'ai'),
    ...world.collectors.filter(c => c.faction === 'ai'),
    world.aiHq
  ].filter(Boolean)

  for (const src of sources) {
    const r = src === world.aiHq ? SIGHT_HQ : src.radius === 14 ? SIGHT_COLLECTOR : SIGHT_TANK
    const minCol = Math.max(0, Math.floor((src.x - r) / ts))
    const maxCol = Math.min(gridCols - 1, Math.ceil((src.x + r) / ts))
    const minRow = Math.max(0, Math.floor((src.y - r) / ts))
    const maxRow = Math.min(gridRows - 1, Math.ceil((src.y + r) / ts))

    for (let row = minRow; row <= maxRow; row++) {
      for (let col = minCol; col <= maxCol; col++) {
        const cx = col * ts + ts / 2
        const cy = row * ts + ts / 2
        if (Math.hypot(cx - src.x, cy - src.y) <= r) {
          aiExplored[row][col] = 1
        }
      }
    }
  }
}

function isAIKnown(wx, wy) {
  if (!aiExplored) return false
  const col = Math.floor(wx / ts)
  const row = Math.floor(wy / ts)
  if (col < 0 || col >= gridCols || row < 0 || row >= gridRows) return false
  return aiExplored[row][col] === 1
}

function getTarget(tank) {
  switch (tank.role) {
    case 'hq_hunter': {
      const hq = world.hq
      if (hq && hq.hp > 0 && isAIKnown(hq.x, hq.y)) return hq
      return null
    }
    case 'tank_hunter': {
      let nearest = null, nearestDist = Infinity
      for (const t of world.tanks) {
        if (t.faction !== 'player' || t.hp <= 0 || !isAIKnown(t.x, t.y)) continue
        const d = Math.hypot(t.x - tank.x, t.y - tank.y)
        if (d < nearestDist) { nearestDist = d; nearest = t }
      }
      return nearest
    }
    case 'collector_hunter': {
      let nearest = null, nearestDist = Infinity
      for (const c of world.collectors) {
        if (c.faction !== 'player' || c.hp <= 0 || !isAIKnown(c.x, c.y)) continue
        const d = Math.hypot(c.x - tank.x, c.y - tank.y)
        if (d < nearestDist) { nearestDist = d; nearest = c }
      }
      return nearest
    }
  }
  return null
}

export function updateAI() {
  if (!aiExplored) return

  updateAIExplored()

  const aiHq = world.aiHq
  if (!aiHq) return

  const aiTanks = world.tanks.filter(t => t.faction === 'ai')
  const aiCollectors = world.collectors.filter(c => c.faction === 'ai')

  if (aiHq.buildQueue.length === 0) {
    if (aiCollectors.length < 2 && aiHq.resources >= aiHq.collectorBuildCost) {
      aiHq.resources -= aiHq.collectorBuildCost
      aiHq.buildQueue.push({ type: 'collector', timer: 4, totalTime: 4 })
    } else if (aiHq.resources >= aiHq.buildCost) {
      aiHq.resources -= aiHq.buildCost
      aiHq.buildQueue.push({ type: 'tank', timer: 5, totalTime: 5 })
    }
  }

  const unexplored = []
  for (let r = 0; r < gridRows; r++) {
    for (let c = 0; c < gridCols; c++) {
      if (!aiExplored[r][c]) unexplored.push({ x: c * ts + ts / 2, y: r * ts + ts / 2 })
    }
  }

  for (const tank of aiTanks) {
    if (!tank.role) tank.role = ROLES[Math.floor(Math.random() * ROLES.length)]

    const target = getTarget(tank)
    if (target) {
      tank.aiScoutPos = null
      const path = findPath(tank.x, tank.y, target.x, target.y)
      if (path) {
        tank.path = path
        tank.targetX = target.x
        tank.targetY = target.y
      }
    } else {
      const needNew = !tank.aiScoutPos ||
        Math.hypot(tank.x - tank.aiScoutPos.x, tank.y - tank.aiScoutPos.y) < 60 ||
        isAIKnown(tank.aiScoutPos.x, tank.aiScoutPos.y)

      if (needNew && unexplored.length > 0) {
        const tile = unexplored[Math.floor(Math.random() * unexplored.length)]
        tank.aiScoutPos = tile
        const path = findPath(tank.x, tank.y, tile.x, tile.y)
        if (path) {
          tank.path = path
          tank.targetX = tile.x
          tank.targetY = tile.y
        }
      }
    }
  }
}

export function getAITankCount() { return world.tanks.filter(t => t.faction === 'ai').length }
