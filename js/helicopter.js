import { Vehicle, effectiveDamage } from './vehicles.js'
import { ctx, camera } from './state.js'

export class Helicopter extends Vehicle {
  constructor(x, y) {
    super(x, y)
    this.unitType = 'helicopter'
    this.speed = 120
    this.radius = 16
    this.hp = 60
    this.maxHp = 60
    this.attackRange = 150
    this.attackDamage = 12
    this.attackCooldown = 1.2
    this.attackTimer = 0
    this.rotorAngle = 0
  }

  updateMove(dt) {
    if (this.targetX == null) return
    const arrived = this.moveTo(this.targetX, this.targetY, dt)
    if (arrived) {
      this.targetX = null
      this.targetY = null
    }
  }

  update(dt, world) {
    this.attackTimer = Math.max(0, this.attackTimer - dt)
    this.rotorAngle += dt * 12

    const enemies = this.faction === 'player'
      ? [
          ...world.tanks.filter(t => t.faction === 'ai' && t.hp > 0),
          ...world.collectors.filter(c => c.faction === 'ai' && c.hp > 0),
          world.aiHq && world.aiHq.hp > 0 ? world.aiHq : null
        ].filter(Boolean)
      : [
          ...world.tanks.filter(t => t.faction === 'player' && t.hp > 0),
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

export function drawHelicopter(heli) {
  const ai = heli.faction === 'ai'

  ctx.save()
  ctx.translate(heli.x, heli.y)

  // Ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.2)'
  ctx.beginPath()
  ctx.ellipse(5, 8, 16, 8, 0, 0, Math.PI * 2)
  ctx.fill()

  // Body
  ctx.save()
  ctx.rotate(heli.angle)

  ctx.fillStyle = ai ? '#882288' : (heli.selected ? '#60d8d8' : '#206868')
  ctx.strokeStyle = ai ? '#440044' : (heli.selected ? '#a0ffff' : '#0a3030')
  ctx.lineWidth = 2 / camera.zoom
  ctx.beginPath()
  ctx.ellipse(0, 0, 16, 9, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  // Tail boom
  ctx.strokeStyle = ai ? '#882288' : '#206868'
  ctx.lineWidth = 3 / camera.zoom
  ctx.beginPath()
  ctx.moveTo(-8, 0)
  ctx.lineTo(-20, 0)
  ctx.stroke()

  // Tail rotor (small)
  ctx.strokeStyle = ai ? '#cc88cc' : '#50b8b8'
  ctx.lineWidth = 1.5 / camera.zoom
  ctx.beginPath()
  ctx.moveTo(-20, -5)
  ctx.lineTo(-20, 5)
  ctx.stroke()

  ctx.restore()

  // Main rotor (spins independently of facing angle)
  ctx.rotate(heli.rotorAngle)
  ctx.strokeStyle = ai ? '#dd99dd' : (heli.selected ? '#c0ffff' : '#70cccc')
  ctx.lineWidth = 2 / camera.zoom
  ctx.beginPath()
  ctx.moveTo(-20, 0)
  ctx.lineTo(20, 0)
  ctx.moveTo(0, -20)
  ctx.lineTo(0, 20)
  ctx.stroke()

  ctx.restore()

  if (heli.selected) {
    ctx.strokeStyle = 'rgba(80,255,255,0.9)'
    ctx.lineWidth = 2 / camera.zoom
    ctx.beginPath()
    ctx.arc(heli.x, heli.y, heli.radius + 10, 0, Math.PI * 2)
    ctx.stroke()
  }

  if (heli.hp < heli.maxHp) {
    const bw = 28, bh = 4
    const bx = heli.x - bw / 2, by = heli.y - 30
    ctx.fillStyle = '#222'
    ctx.fillRect(bx, by, bw, bh)
    ctx.fillStyle = heli.faction === 'ai' ? '#c04040' : '#40c040'
    ctx.fillRect(bx, by, bw * heli.hp / heli.maxHp, bh)
  }
}
