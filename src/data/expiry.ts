import type { StockItem } from "./stock"

function parseExpiry(ddmmyyyy: string) {
  const [d, m, y] = ddmmyyyy.split("-").map(Number)
  return new Date(y, m - 1, d)
}

const today = new Date()
today.setHours(0, 0, 0, 0)

const horizon = new Date(today)
horizon.setDate(horizon.getDate() + 90)

export function getExpiryAlerts(stock: StockItem[]) {
  return stock
    .filter((item) => {
      if (!item.expiry) return false
      const exp = parseExpiry(item.expiry)
      return exp >= today && exp <= horizon
    })
    .map((item) => ({
      id: item.id,
      name: item.name,
      sku: item.sku,
      expiry: item.expiry,
      packSize: item.packSize,
      batch: item.batch,
      price: item.sellingPrice,
      qty: item.qty,
    }))
}

export function getExpiredProducts(stock: StockItem[]) {
  return stock.filter((item) => item.expiry && parseExpiry(item.expiry) < today)
}
