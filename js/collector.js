import { Vehicle, drawHealthBar } from './vehicles.js'
import { ctx, camera } from './state.js'

export class Collector extends Vehicle {
  constructor(x, y, homeHq) {
    super(x, y)
    this.unitType = 'collector'
    this.speed = 60
    this.radius = 14
    this.carrying = 0
    this.collectState = 'idle'
    this.targetResource = null
    this.homeHq = homeHq
    this.hp = 60
    this.maxHp = 60
    this.collectTimer = 0
  }

  update(dt, world) {
    if (this.targetX != null) {
      this.updateMove(dt)
      return
    }

    if (this.collectState === 'idle') {
      let closest = null
      let closestDist = Infinity
      for (const r of world.resources) {
        if (r.amount <= 0) continue
        const d = Math.hypot(r.x - this.x, r.y - this.y)
        if (d < closestDist) {
          closestDist = d
          closest = r
        }
      }
      if (closest) {
        this.targetResource = closest
        this.collectState = 'fetching'
      }
    } else if (this.collectState === 'fetching') {
      if (!this.targetResource || this.targetResource.amount <= 0) {
        this.collectState = 'idle'
        this.targetResource = null
        return
      }
      const dist = Math.hypot(this.targetResource.x - this.x, this.targetResource.y - this.y)
      if (dist > 25) {
        this.moveTo(this.targetResource.x, this.targetResource.y, dt)
        this.collectTimer = 2
      } else {
        this.collectTimer -= dt
        if (this.collectTimer <= 0) {
          const taken = Math.min(20, this.targetResource.amount)
          this.targetResource.amount -= taken
          this.carrying += taken
          this.collectState = 'returning'
        }
      }
    } else if (this.collectState === 'returning') {
      if (!this.homeHq) { this.collectState = 'idle'; return }
      const dist = Math.hypot(this.homeHq.x - this.x, this.homeHq.y - this.y)
      if (dist > 45) {
        this.moveTo(this.homeHq.x, this.homeHq.y, dt)
      } else {
        this.homeHq.resources += this.carrying
        this.carrying = 0
        this.collectState = 'idle'
        this.targetResource = null
      }
    }
  }
}

export function drawCollector(c) {
  const ai = c.faction === 'ai'
  ctx.save()
  ctx.translate(c.x, c.y)
  ctx.rotate(c.angle)

  ctx.fillStyle = ai ? '#c06020' : (c.selected ? '#f5e87a' : '#b5a84a')
  ctx.strokeStyle = ai ? '#602000' : (c.selected ? '#ffffc0' : '#3a3010')
  ctx.lineWidth = 2 / camera.zoom

  ctx.beginPath()
  ctx.roundRect(-14, -10, 28, 20, 5 / camera.zoom)
  ctx.fill()
  ctx.stroke()

  if (c.carrying > 0) {
    ctx.fillStyle = 'rgba(80, 200, 255, 0.85)'
    ctx.fillRect(-5, -5, 10, 10)
  }

  ctx.restore()

  drawHealthBar(c, 24, 3, 24)

  if (c.targetResource && c.collectState === 'fetching') {
    ctx.strokeStyle = 'rgba(80,200,255,0.3)'
    ctx.lineWidth = 1 / camera.zoom
    ctx.setLineDash([6 / camera.zoom, 6 / camera.zoom])
    ctx.beginPath()
    ctx.moveTo(c.x, c.y)
    ctx.lineTo(c.targetResource.x, c.targetResource.y)
    ctx.stroke()
    ctx.setLineDash([])
  }
}
