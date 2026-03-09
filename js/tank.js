import { Vehicle, effectiveDamage, drawHealthBar } from './vehicles.js'
import { ctx, camera } from './state.js'
import { getEnemies, findNearest } from './combat-utils.js'
import { drawSelectionRing } from './render-utils.js'
import { playSound } from './audio.js'

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

  update(dt) {
    this.attackTimer = Math.max(0, this.attackTimer - dt)

    const nearest = findNearest(this.x, this.y, getEnemies(this))
    if (nearest && Math.hypot(nearest.x - this.x, nearest.y - this.y) <= this.attackRange) {
      this.angle = Math.atan2(nearest.y - this.y, nearest.x - this.x)
      if (this.attackTimer <= 0) {
        nearest.hp -= effectiveDamage(this, nearest)
        this.attackTimer = this.attackCooldown
        playSound('tank_shoot', 0.5)
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

  if (tank.selected) drawSelectionRing(tank, 'rgba(180,255,180,0.95)')

  drawHealthBar(tank, 36, 4, 32)
}
