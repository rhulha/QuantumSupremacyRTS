import { world } from './state.js'
import { Tank } from './vehicles.js'

const ATTACK_AT = 40

let phase = 'gathering' // 'gathering' | 'attacking'

function rand(min, max) {
  return Math.random() * (max - min) + min
}

function launchAttack(aiTanks) {
  if (!world.hq) return
  const cols = Math.ceil(Math.sqrt(aiTanks.length))
  const spacing = 50
  const startX = world.hq.x - ((cols - 1) * spacing) / 2
  const startY = world.hq.y - ((Math.ceil(aiTanks.length / cols) - 1) * spacing) / 2
  aiTanks.forEach((t, i) => {
    t.targetX = startX + (i % cols) * spacing
    t.targetY = startY + Math.floor(i / cols) * spacing
  })
}

export function updateAI() {
  if (!world.aiHq) return
  if (phase !== 'gathering') return

  const aiTanks = world.tanks.filter(t => t.faction === 'ai')

  while (world.aiHq.resources >= world.aiHq.buildCost && aiTanks.length < ATTACK_AT) {
    world.aiHq.resources -= world.aiHq.buildCost
    const t = new Tank(world.aiHq.x + rand(-80, 80), world.aiHq.y + rand(-80, 80))
    t.faction = 'ai'
    world.tanks.push(t)
    aiTanks.push(t)
  }

  if (aiTanks.length >= ATTACK_AT) {
    phase = 'attacking'
    launchAttack(aiTanks)
  }
}

export function getAIPhase() { return phase }
export function getAITankCount() { return world.tanks.filter(t => t.faction === 'ai').length }
