import { world } from './state.js'

const ATTACK_AT = 40

let phase = 'gathering' // 'gathering' | 'attacking'


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

  const aiHq = world.aiHq
  const aiTanks = world.tanks.filter(t => t.faction === 'ai')
  const aiCollectors = world.collectors.filter(c => c.faction === 'ai')

  if (aiHq.buildQueue.length === 0) {
    if (aiCollectors.length < 2 && aiHq.resources >= aiHq.collectorBuildCost) {
      aiHq.resources -= aiHq.collectorBuildCost
      aiHq.buildQueue.push({ type: 'collector', timer: 4, totalTime: 4 })
    } else if (aiTanks.length < ATTACK_AT && aiHq.resources >= aiHq.buildCost) {
      aiHq.resources -= aiHq.buildCost
      aiHq.buildQueue.push({ type: 'tank', timer: 5, totalTime: 5 })
    }
  }

  if (aiTanks.length >= ATTACK_AT) {
    phase = 'attacking'
    launchAttack(aiTanks)
  }
}

export function getAIPhase() { return phase }
export function getAITankCount() { return world.tanks.filter(t => t.faction === 'ai').length }
