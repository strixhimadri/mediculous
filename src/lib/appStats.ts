import type { Franchise } from "@/data/franchises"
import type { FranchiseOrder } from "@/data/orders"
import type { StockItem } from "@/data/stock"

export function uniqueSkuCount(stock: StockItem[]) {
  return new Set(stock.map((s) => s.sku)).size
}

export function stockValueWithoutGst(stock: StockItem[]) {
  return stock.reduce((sum, row) => sum + row.qty * row.buyingPrice, 0)
}

export function orderCount(orders: FranchiseOrder[]) {
  return orders.length
}

export function retailSalesTotal(orders: FranchiseOrder[]) {
  return orders.filter((o) => o.approved).reduce((sum, o) => sum + o.totalAmount, 0)
}

export function pendingApprovalCount(orders: FranchiseOrder[]) {
  return orders.filter((o) => !o.approved).length
}

export function dispatchedCount(orders: FranchiseOrder[]) {
  return orders.filter((o) => o.dispatched).length
}

export function franchiseCount(franchises: Franchise[]) {
  return franchises.length
}

const FY_MONTHS = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"] as const

export function monthlySalesFromOrders(orders: FranchiseOrder[]) {
  const totals = new Map<string, number>(FY_MONTHS.map((m) => [m, 0]))

  for (const order of orders) {
    if (!order.approved) continue
    const match = order.date.match(/\d{1,2}\s+(\w{3})\s+\d{4}/)
    if (!match) continue
    const month = match[1]
    if (totals.has(month)) {
      totals.set(month, (totals.get(month) ?? 0) + order.totalAmount)
    }
  }

  return FY_MONTHS.map((month) => ({ month, value: totals.get(month) ?? 0 }))
}
