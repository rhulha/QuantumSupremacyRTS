const SHEET_URL = 'images/topdownTanks_vector.svg'
const SHEET_W = 1160
const SHEET_H = 700
const SCALE = 2

const TILE_SPRITES = {
  grass:           { x: 42, y: 390, w: 64, h: 64 },
  desert:          { x: 42, y: 538, w: 64, h: 64 },
  resource_grass:  { x: 42, y: 464, w: 64, h: 64 },
  resource_desert: { x: 42, y: 612, w: 64, h: 64 },
  head_quarter:    { x: 42, y: 390, w: 64, h: 64 },
  wall:            { x: 42, y: 390, w: 64, h: 64 },
}

const WALL_CRATE = { x: 241, y: 229.9, w: 28, h: 28.2 }

let sheet = null

function blit(ctx, s, dx, dy, dw, dh, inset) {
  ctx.drawImage(
    sheet,
    (s.x + inset) * SCALE, (s.y + inset) * SCALE,
    (s.w - inset * 2) * SCALE, (s.h - inset * 2) * SCALE,
    dx, dy, dw, dh
  )
}

export async function loadTileset() {
  try {
    const img = new Image()
    img.src = SHEET_URL
    await img.decode()

    const c = document.createElement('canvas')
    c.width = SHEET_W * SCALE
    c.height = SHEET_H * SCALE
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
    sheet = c
  } catch {}
}

export function drawTile(ctx, tileId, x, y, size) {
  if (!sheet) return false

  const scale = ctx.getTransform().a || 1
  const overlap = 1 / scale
  blit(ctx, TILE_SPRITES[tileId] ?? TILE_SPRITES.grass, x, y, size + overlap, size + overlap, 0.5)

  if (tileId === 'wall') {
    const p = size * 0.78
    blit(ctx, WALL_CRATE, x + (size - p) / 2, y + (size - p) / 2, p, p, 0)
  }
  return true
}
