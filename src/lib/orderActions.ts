import { lineSubtotal, lineTaxable, orderTotals, type FranchiseOrder } from "@/data/orders"
import { formatInrPlain } from "@/lib/format"

function csvEscape(value: string | number) {
  const text = String(value)
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`
  return text
}

function downloadFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function exportOrderSpreadsheet(order: FranchiseOrder) {
  const totals = orderTotals(order.lines)
  const header = [
    ["Order ID", order.id],
    ["Franchise", order.franchiseName],
    ["Bill number", order.billNumber || "—"],
    ["Bill date", order.billDate || "—"],
    ["Order date", order.date],
    ["Approved", order.approved ? "Yes" : "No"],
    ["Dispatched", order.dispatched ? "Yes" : "No"],
    [],
    ["S No", "Medicine name", "Quantity", "Batch", "Price / unit", "GST %", "Taxable", "Sub total"],
  ]

  const lines = order.lines.map((line, index) => [
    index + 1,
    line.medicineName,
    line.quantity,
    line.batch || "—",
    line.pricePerUnit.toFixed(2),
    line.gst,
    lineTaxable(line).toFixed(2),
    lineSubtotal(line).toFixed(2),
  ])

  const footer = [
    [],
    ["", "", "", "", "", "Total taxable", totals.taxable.toFixed(2)],
    ["", "", "", "", "", "Total sub-total", totals.subtotal.toFixed(2)],
  ]

  const csv = [...header, ...lines, ...footer]
    .map((row) => row.map((cell) => csvEscape(cell ?? "")).join(","))
    .join("\n")

  downloadFile(`franchise-order-${order.id}.csv`, csv, "text/csv;charset=utf-8")
}

export function printOrderBill(order: FranchiseOrder) {
  const totals = orderTotals(order.lines)
  const rows = order.lines
    .map(
      (line, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${line.medicineName}</td>
        <td class="num">${line.quantity}</td>
        <td>${line.batch || "—"}</td>
        <td class="num">${line.pricePerUnit.toFixed(2)}</td>
        <td class="num">${lineTaxable(line).toFixed(2)}</td>
        <td class="num">${lineSubtotal(line).toFixed(2)}</td>
      </tr>`,
    )
    .join("")

  const html = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Bill — Order ${order.id}</title>
    <style>
      body { font-family: Inter, system-ui, sans-serif; color: #0a0a0a; margin: 32px; }
      h1 { font-size: 20px; margin: 0 0 4px; }
      p { margin: 4px 0; font-size: 13px; color: #525252; }
      table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
      th, td { border: 1px solid #e5e5e5; padding: 8px 10px; text-align: left; }
      th { background: #0a0a0a; color: #fff; }
      .num { text-align: right; font-variant-numeric: tabular-nums; }
      .totals { margin-top: 16px; text-align: right; font-size: 13px; }
      .totals p { color: #0a0a0a; }
    </style>
  </head>
  <body>
    <h1>Mediculous — Franchise bill</h1>
    <p><strong>Order #${order.id}</strong> · ${order.franchiseName}</p>
    <p>Bill: ${order.billNumber || "Pending"} · Date: ${order.billDate || order.date}</p>
    <table>
      <thead>
        <tr>
          <th>S No</th>
          <th>Medicine</th>
          <th>Qty</th>
          <th>Batch</th>
          <th>Price / unit</th>
          <th>Taxable</th>
          <th>Sub total</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="totals">
      <p>Total taxable: ${formatInrPlain(totals.taxable)}</p>
      <p><strong>Total sub-total: ${formatInrPlain(totals.subtotal)}</strong></p>
    </div>
  </body>
</html>`

  const printWindow = window.open("", "_blank", "noopener,noreferrer,width=900,height=700")
  if (!printWindow) return false

  printWindow.document.write(html)
  printWindow.document.close()
  printWindow.focus()
  printWindow.print()
  return true
}
