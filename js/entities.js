export class Resource {
  constructor(x, y, amount = 500) {
    this.x = x
    this.y = y
    this.amount = amount
    this.maxAmount = amount
    this.radius = 16
  }
}

export class HeadQuarters {
  constructor(x, y) {
    this.x = x
    this.y = y
    this.selected = false
    this.resources = 100
    this.radius = 45
    this.buildCost = 50
  }
}
