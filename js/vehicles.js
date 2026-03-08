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
    if (this.targetX == null) return
    const arrived = this.moveTo(this.targetX, this.targetY, dt)
    if (arrived) {
      this.targetX = null
      this.targetY = null
    }
  }
}

export class Tank extends Vehicle {
  constructor(x, y) {
    super(x, y)
    this.speed = 85
    this.radius = 18
  }

  update(dt) {
    this.updateMove(dt)
  }
}

export class Collector extends Vehicle {
  constructor(x, y) {
    super(x, y)
    this.speed = 60
    this.radius = 14
    this.carrying = 0
    this.collectState = 'idle'
    this.targetResource = null
  }

  update(dt, world) {
    if (this.targetX != null) {
      this.updateMove(dt)
      return
    }

    if (this.collectState === 'idle') {
      const res = world.resources.find(r => r.amount > 0)
      if (res) {
        this.targetResource = res
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
      } else {
        const taken = Math.min(20, this.targetResource.amount)
        this.targetResource.amount -= taken
        this.carrying += taken
        this.collectState = 'returning'
      }
    } else if (this.collectState === 'returning') {
      if (!world.hq) { this.collectState = 'idle'; return }
      const dist = Math.hypot(world.hq.x - this.x, world.hq.y - this.y)
      if (dist > 45) {
        this.moveTo(world.hq.x, world.hq.y, dt)
      } else {
        world.hq.resources += this.carrying
        this.carrying = 0
        this.collectState = 'idle'
        this.targetResource = null
      }
    }
  }
}
