import { world } from './state.js'

export function getEnemies(unit) {
  const ef = unit.faction === 'player' ? 'ai' : 'player'
  const enemyHq = unit.faction === 'player' ? world.aiHq : world.hq
  return [
    ...world.units.filter(t => t.faction === ef && t.hp > 0),
    ...world.collectors.filter(c => c.faction === ef && c.hp > 0),
    enemyHq && enemyHq.hp > 0 ? enemyHq : null
  ].filter(Boolean)
}

export function findNearest(x, y, entities) {
  let nearest = null, nearestDist = Infinity
  for (const e of entities) {
    const d = Math.hypot(e.x - x, e.y - y)
    if (d < nearestDist) { nearestDist = d; nearest = e }
  }
  return nearest
}

export function getFactionEntities(faction) {
  const hq = faction === 'player' ? world.hq : world.aiHq
  return [
    ...world.units.filter(t => t.faction === faction),
    ...world.collectors.filter(c => c.faction === faction),
    hq
  ].filter(Boolean)
}
