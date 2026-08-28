export type OrderLine = {
  id: string
  medicineName: string
  quantity: number
  batch: string
  pricePerUnit: number
  gst: number
}

export type OrderStatus = "pending" | "approved" | "dispatched" | "rejected"

export type FranchiseOrder = {
  id: string
  franchiseId: string
  franchiseName: string
  billNumber: string
  billDate: string
  invoiceNote?: string
  remark?: string
  totalAmount: number
  date: string
  approved: boolean
  dispatched: boolean
  rejected: boolean
  status: OrderStatus
  lines: OrderLine[]
}

export const franchiseOrders: FranchiseOrder[] = []

export function lineTaxable(line: OrderLine) {
  return line.quantity * line.pricePerUnit
}

export function lineSubtotal(line: OrderLine) {
  return lineTaxable(line) * (1 + line.gst / 100)
}

export function orderTotals(lines: OrderLine[]) {
  const taxable = lines.reduce((s, l) => s + lineTaxable(l), 0)
  const subtotal = lines.reduce((s, l) => s + lineSubtotal(l), 0)
  return { taxable, subtotal }
}
