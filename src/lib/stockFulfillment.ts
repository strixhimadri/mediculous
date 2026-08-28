import type { FranchiseOrder } from "@/data/orders"
import { findStockBatch, type StockItem } from "@/data/stock"

export type StockFulfillmentIssue =
  | { type: "missing_batch"; medicineName: string }
  | { type: "batch_not_found"; medicineName: string; batch: string }
  | { type: "insufficient_qty"; medicineName: string; batch: string; requested: number; available: number }

export function validateOrderStock(stock: StockItem[], order: FranchiseOrder): StockFulfillmentIssue[] {
  const issues: StockFulfillmentIssue[] = []

  for (const line of order.lines) {
    if (!line.batch) {
      issues.push({ type: "missing_batch", medicineName: line.medicineName })
      continue
    }

    const stockItem = findStockBatch(stock, line.medicineName, line.batch)
    if (!stockItem) {
      issues.push({ type: "batch_not_found", medicineName: line.medicineName, batch: line.batch })
      continue
    }

    if (line.quantity > stockItem.qty) {
      issues.push({
        type: "insufficient_qty",
        medicineName: line.medicineName,
        batch: line.batch,
        requested: line.quantity,
        available: stockItem.qty,
      })
    }
  }

  return issues
}

export function formatFulfillmentIssue(issue: StockFulfillmentIssue) {
  switch (issue.type) {
    case "missing_batch":
      return `${issue.medicineName}: assign a batch before dispatch`
    case "batch_not_found":
      return `${issue.medicineName} (batch ${issue.batch}): not found in stock`
    case "insufficient_qty":
      return `${issue.medicineName} (batch ${issue.batch}): need ${issue.requested}, only ${issue.available} available`
  }
}

export function deductOrderFromStock(stock: StockItem[], order: FranchiseOrder): StockItem[] {
  const deductions = new Map<string, number>()

  for (const line of order.lines) {
    const item = findStockBatch(stock, line.medicineName, line.batch)
    if (!item) continue
    deductions.set(item.id, (deductions.get(item.id) ?? 0) + line.quantity)
  }

  return stock.map((item) => {
    const deduct = deductions.get(item.id)
    if (!deduct) return item
    return { ...item, qty: item.qty - deduct, sold: item.sold + deduct }
  })
}
