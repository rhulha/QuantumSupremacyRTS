export function effectiveDamage(attacker, target) {
  const base = attacker.attackDamage
  const at = attacker.unitType
  const tt = target.unitType
  if (at === 'helicopter' && tt === 'tank') return base * 2
  if (at === 'helicopter' && tt === 'hq') return base * 0.3
  if (at === 'sam_truck' && tt === 'helicopter') return base * 3
  if (at === 'sam_truck' && (tt === 'tank' || tt === 'hq')) return 0
  if (at === 'tank' && tt === 'sam_truck') return base * 2
  return base
}

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
    this.unitType = null
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
