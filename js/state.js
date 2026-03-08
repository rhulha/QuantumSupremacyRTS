export const canvas = document.getElementById('game')
export const ctx = canvas.getContext('2d')

function resize() {
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
}

resize()
window.addEventListener('resize', resize)

export const world = {
  width: 3200,
  height: 2200,
  tanks: []
}

export const camera = {
  x: world.width / 2,
  y: world.height / 2,
  zoom: 1,
  minZoom: 0.35,
  maxZoom: 3.5
}

export const input = {
  mouseX: 0,
  mouseY: 0,
  leftDown: false,
  middleDown: false,
  rightDown: false,
  dragStartX: 0,
  dragStartY: 0,
  dragCurrentX: 0,
  dragCurrentY: 0,
  isBoxSelecting: false,
  isPanning: false,
  panLastX: 0,
  panLastY: 0,
  shift: false
}
