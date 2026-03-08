import { update, init } from './tanks.js'
import { render } from './renderer.js'
import { loadMap } from './map.js'
import { camera, world } from './state.js'
import './input.js'

async function start() {
  await loadMap()
  init()

  if (world.hq) {
    camera.x = world.hq.x
    camera.y = world.hq.y
  }

  let lastTime = performance.now()

  function frame(now) {
    const dt = Math.min(0.05, (now - lastTime) / 1000)
    lastTime = now
    update(dt)
    render()
    requestAnimationFrame(frame)
  }

  requestAnimationFrame(frame)
}

start()
