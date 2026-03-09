import { ctx, camera } from './state.js'
import { getAITankCount } from './ai.js'

const hqPanel = document.getElementById('hq-panel')
const hqResSpan = document.getElementById('hq-resources')
const hqBuildQueue = document.getElementById('hq-build-queue')
const aiStatus = document.getElementById('ai-status')

export function drawHQ(hq, ai = false) {
  ctx.save()
  ctx.translate(hq.x, hq.y)

  ctx.fillStyle = ai ? '#602020' : (hq.selected ? '#5080c8' : '#304878')
  ctx.strokeStyle = ai ? '#300000' : (hq.selected ? '#a0c0ff' : '#1a2840')
  ctx.lineWidth = 3 / camera.zoom
  ctx.beginPath()
  ctx.roundRect(-hq.radius, -hq.radius, hq.radius * 2, hq.radius * 2, 8 / camera.zoom)
  ctx.fill()
  ctx.stroke()

  ctx.strokeStyle = ai ? '#ff8888' : (hq.selected ? '#c0e0ff' : '#8aafdf')
  ctx.lineWidth = 4 / camera.zoom
  ctx.beginPath()
  ctx.moveTo(-16, 0)
  ctx.lineTo(16, 0)
  ctx.moveTo(0, -16)
  ctx.lineTo(0, 16)
  ctx.stroke()

  ctx.restore()

  if (hq.selected) {
    ctx.strokeStyle = 'rgba(100,160,255,0.9)'
    ctx.lineWidth = 2 / camera.zoom
    ctx.beginPath()
    ctx.arc(hq.x, hq.y, hq.radius + 10, 0, Math.PI * 2)
    ctx.stroke()
  }

  if (hq.hp < hq.maxHp) {
    const bw = 80, bh = 6
    const bx = hq.x - bw / 2, by = hq.y - hq.radius - 14
    ctx.fillStyle = '#222'
    ctx.fillRect(bx, by, bw, bh)
    ctx.fillStyle = ai ? '#c04040' : '#4090e0'
    ctx.fillRect(bx, by, bw * hq.hp / hq.maxHp, bh)
  }
}

export function updateHQPanel(hq) {
  if (hq) {
    hqPanel.classList.remove('hidden')
    hqResSpan.textContent = Math.floor(hq.resources)
    const q = hq.buildQueue
    hqBuildQueue.textContent = q.length > 0
      ? `Building: ${q[0].type} (${q[0].timer.toFixed(1)}s)${q.length > 1 ? ` +${q.length - 1}` : ''}`
      : ''
  } else {
    hqPanel.classList.add('hidden')
  }

  aiStatus.textContent = `AI: ${getAITankCount()} units`
}
