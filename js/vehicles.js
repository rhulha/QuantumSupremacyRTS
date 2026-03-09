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

export class Tank extends Vehicle {
  constructor(x, y) {
    super(x, y)
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
        nearest.hp -= this.attackDamage
        this.attackTimer = this.attackCooldown
      }
      return
    }

    this.updateMove(dt)
  }
}

export class Collector extends Vehicle {
  constructor(x, y, homeHq) {
    super(x, y)
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
