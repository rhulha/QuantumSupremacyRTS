import { Vehicle, effectiveDamage, drawHealthBar } from './vehicles.js'
import { ctx, camera } from './state.js'

export class SamTruck extends Vehicle {
  constructor(x, y) {
    super(x, y)
    this.unitType = 'sam_truck'
    this.speed = 65
    this.radius = 18
    this.hp = 80
    this.maxHp = 80
    this.attackRange = 250
    this.attackDamage = 10
    this.attackCooldown = 2.0
    this.attackTimer = 0
  }

  update(dt, world) {
    this.attackTimer = Math.max(0, this.attackTimer - dt)

    const enemyFaction = this.faction === 'player' ? 'ai' : 'player'
    const helicopters = world.units.filter(
      t => t.faction === enemyFaction && t.hp > 0 && t.unitType === 'helicopter'
    )

    let nearest = null
    let nearestDist = Infinity
    for (const e of helicopters) {
      const d = Math.hypot(e.x - this.x, e.y - this.y)
      if (d < nearestDist) {
        nearestDist = d
        nearest = e
      }
    }

    if (nearest && nearestDist <= this.attackRange) {
      this.angle = Math.atan2(nearest.y - this.y, nearest.x - this.x)
      if (this.attackTimer <= 0) {
        nearest.hp -= effectiveDamage(this, nearest)
        this.attackTimer = this.attackCooldown
      }
      return
    }

    this.updateMove(dt)
  }
}

export function drawSamTruck(truck) {
  const ai = truck.faction === 'ai'
  ctx.save()
  ctx.translate(truck.x, truck.y)
  ctx.rotate(truck.angle)

  // Truck body
  ctx.fillStyle = ai ? '#2a4a2a' : (truck.selected ? '#6aaa6a' : '#3a5a3a')
  ctx.strokeStyle = ai ? '#0a1a0a' : (truck.selected ? '#a0d8a0' : '#162216')
  ctx.lineWidth = 2 / camera.zoom
  ctx.beginPath()
  ctx.roundRect(-20, -11, 40, 22, 4 / camera.zoom)
  ctx.fill()
  ctx.stroke()

  // Launcher tube pointing upward (forward-facing)
  ctx.fillStyle = ai ? '#507850' : (truck.selected ? '#88cc88' : '#4a6a4a')
  ctx.strokeStyle = ai ? '#203020' : '#1a3a1a'
  ctx.lineWidth = 1.5 / camera.zoom
  ctx.beginPath()
  ctx.roundRect(2, -20, 8, 14, 2 / camera.zoom)
  ctx.fill()
  ctx.stroke()

  ctx.restore()

  if (truck.selected) {
    ctx.strokeStyle = 'rgba(140,255,140,0.9)'
    ctx.lineWidth = 2 / camera.zoom
    ctx.beginPath()
    ctx.arc(truck.x, truck.y, truck.radius + 10, 0, Math.PI * 2)
    ctx.stroke()
  }

  drawHealthBar(truck, 36, 4, 32)
}
