import { Vehicle, effectiveDamage, drawHealthBar } from './vehicles.js'
import { ctx, camera } from './state.js'

export class Tank extends Vehicle {
  constructor(x, y) {
    super(x, y)
    this.unitType = 'tank'
    this.speed = 85
    this.radius = 18
    this.hp = 100
    this.maxHp = 100
    this.attackRange = 200
    this.attackDamage = 15
    this.attackCooldown = 1.5
    this.attackTimer = 0
  }

  update(dt, world) {
    this.attackTimer = Math.max(0, this.attackTimer - dt)

    const enemies = this.faction === 'player'
      ? [
          ...world.units.filter(t => t.faction === 'ai' && t.hp > 0),
          ...world.collectors.filter(c => c.faction === 'ai' && c.hp > 0),
          world.aiHq && world.aiHq.hp > 0 ? world.aiHq : null
        ].filter(Boolean)
      : [
          ...world.units.filter(t => t.faction === 'player' && t.hp > 0),
          ...world.collectors.filter(c => c.faction === 'player' && c.hp > 0),
          world.hq && world.hq.hp > 0 ? world.hq : null
        ].filter(Boolean)

    let nearest = null
    let nearestDist = Infinity
    for (const e of enemies) {
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

export function drawTank(tank) {
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

  drawHealthBar(tank, 36, 4, 32)
}
