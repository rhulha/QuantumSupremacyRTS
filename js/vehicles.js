export class Vehicle {
  constructor(x, y) {
    this.x = x
    this.y = y
    this.angle = Math.random() * Math.PI * 2
    this.speed = 80
    this.selected = false
    this.targetX = null
    this.targetY = null
    this.radius = 18
    this.faction = 'player'
    this.path = null
  }

  moveTo(tx, ty, dt) {
    const dx = tx - this.x
    const dy = ty - this.y
    const dist = Math.hypot(dx, dy)
    if (dist < 2) {
      this.x = tx
      this.y = ty
      return true
    }
    const step = Math.min(dist, this.speed * dt)
    this.x += (dx / dist) * step
    this.y += (dy / dist) * step
    this.angle = Math.atan2(dy, dx)
    return false
  }

  updateMove(dt) {
    if (this.path && this.path.length > 0) {
      const wp = this.path[0]
      if (this.moveTo(wp.x, wp.y, dt)) {
        this.path.shift()
        if (this.path.length === 0) {
          this.path = null
          this.targetX = null
          this.targetY = null
        }
      }
      return
    }
    if (this.targetX == null) return
    const arrived = this.moveTo(this.targetX, this.targetY, dt)
    if (arrived) {
      this.targetX = null
      this.targetY = null
    }
  }
}

