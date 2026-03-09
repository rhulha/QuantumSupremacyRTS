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
  const bodyColor = ai ? '#882288' : (heli.selected ? '#60d8d8' : '#206868')
  const strokeColor = ai ? '#440044' : (heli.selected ? '#a0ffff' : '#0a3030')
  const rotorColor = ai ? '#dd99dd' : (heli.selected ? '#c0ffff' : '#70cccc')

  ctx.save()
  ctx.translate(heli.x, heli.y)

  // Ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.2)'
  ctx.beginPath()
  ctx.ellipse(4, 8, 18, 9, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.save()
  ctx.rotate(heli.angle)

  // Tail fins (swept back, drawn before body so body overlaps root)
  ctx.fillStyle = ai ? '#661166' : '#184848'
  ctx.strokeStyle = strokeColor
  ctx.lineWidth = 1.5 / camera.zoom
  // Upper fin
  ctx.beginPath()
  ctx.moveTo(-8, -5)
  ctx.lineTo(-19, -17)
  ctx.lineTo(-22, -15)
  ctx.lineTo(-13, -4)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()
  // Lower fin
  ctx.beginPath()
  ctx.moveTo(-8, 5)
  ctx.lineTo(-19, 17)
  ctx.lineTo(-22, 15)
  ctx.lineTo(-13, 4)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()

  // Main fuselage — pointed nose at +x, tapers to narrow tail at -x
  ctx.fillStyle = bodyColor
  ctx.strokeStyle = strokeColor
  ctx.lineWidth = 2 / camera.zoom
  ctx.beginPath()
  ctx.moveTo(18, 0)                              // nose tip
  ctx.bezierCurveTo(16, -5,  6, -10,  0, -10)   // upper front
  ctx.bezierCurveTo(-6, -10, -12, -7, -14, -3)  // upper rear
  ctx.lineTo(-14, 3)                             // tail end
  ctx.bezierCurveTo(-12,  7, -6,  10,  0,  10)  // lower rear
  ctx.bezierCurveTo( 6,  10, 16,   5, 18,   0)  // lower front
  ctx.fill()
  ctx.stroke()

  // Cockpit window
  ctx.fillStyle = ai ? '#cc88ff' : '#80e8e8'
  ctx.globalAlpha = 0.7
  ctx.beginPath()
  ctx.ellipse(9, 0, 5, 4, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalAlpha = 1

  ctx.restore()

  // Main rotor — 3 blades, spins independently of facing angle
  ctx.strokeStyle = rotorColor
  ctx.lineWidth = 2.5 / camera.zoom
  for (let i = 0; i < 3; i++) {
    const a = heli.rotorAngle + (i * Math.PI * 2 / 3)
    ctx.beginPath()
    ctx.moveTo(3 * Math.cos(a), 3 * Math.sin(a))
    ctx.lineTo(24 * Math.cos(a), 24 * Math.sin(a))
    ctx.stroke()
  }

  // Rotor hub
  ctx.fillStyle = ai ? '#aa44aa' : '#308888'
  ctx.beginPath()
  ctx.arc(0, 0, 3, 0, Math.PI * 2)
  ctx.fill()

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
