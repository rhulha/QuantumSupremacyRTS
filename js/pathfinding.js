import { world } from './state.js'

function isPassable(col, row) {
  if (!world.map) return true
  const { cols, rows, tiles } = world.map
  if (col < 0 || col >= cols || row < 0 || row >= rows) return false
  return tiles[row][col] !== 'wall'
}

export function findPath(x0, y0, x1, y1) {
  if (!world.map) return null
  const { cols, tileSize } = world.map

  const sc = Math.floor(x0 / tileSize)
  const sr = Math.floor(y0 / tileSize)
  const gc = Math.floor(x1 / tileSize)
  const gr = Math.floor(y1 / tileSize)

  if (!isPassable(gc, gr)) return null
  if (sc === gc && sr === gr) return [{ x: x1, y: y1 }]

  const key = (c, r) => r * cols + c
  const sk = key(sc, sr)
  const gk = key(gc, gr)

  const open = [{ c: sc, r: sr, f: Math.hypot(sc - gc, sr - gr) }]
  const closed = new Set()
  const cameFrom = new Map()
  const g = new Map([[sk, 0]])

  const dirs = [
    [1, 0], [-1, 0], [0, 1], [0, -1],
    [1, 1], [1, -1], [-1, 1], [-1, -1]
  ]

  while (open.length > 0) {
    let mi = 0
    for (let i = 1; i < open.length; i++) if (open[i].f < open[mi].f) mi = i
    const { c, r } = open.splice(mi, 1)[0]
    const k = key(c, r)
    if (closed.has(k)) continue
    closed.add(k)

    if (k === gk) {
      const path = []
      let cur = k
      while (cur !== sk) {
        const nc = cur % cols
        const nr = Math.floor(cur / cols)
        path.unshift({ x: nc * tileSize + tileSize / 2, y: nr * tileSize + tileSize / 2 })
        const p = cameFrom.get(cur)
        cur = key(p.c, p.r)
      }
      path[path.length - 1] = { x: x1, y: y1 }
      return path
    }

    const gCur = g.get(k) ?? Infinity
    for (const [dc, dr] of dirs) {
      const nc = c + dc
      const nr = r + dr
      if (!isPassable(nc, nr)) continue
      if (dc !== 0 && dr !== 0 && (!isPassable(c + dc, r) || !isPassable(c, r + dr))) continue

      const nk = key(nc, nr)
      if (closed.has(nk)) continue

      const ng = gCur + (dc !== 0 && dr !== 0 ? 1.414 : 1)
      if (ng < (g.get(nk) ?? Infinity)) {
        g.set(nk, ng)
        cameFrom.set(nk, { c, r })
        open.push({ c: nc, r: nr, f: ng + Math.hypot(nc - gc, nr - gr) })
      }
    }
  }

  return null
}
