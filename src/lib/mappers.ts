function formatDbDate(iso: string | Date | null): string {
  if (!iso) return ""
  const d = iso instanceof Date ? iso : new Date(iso)
  if (Number.isNaN(d.getTime())) return String(iso)
  const day = String(d.getDate()).padStart(2, "0")
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const year = d.getFullYear()
  return `${day}-${month}-${year}`
}

function formatOrderDate(iso: string | Date): string {
  const d = iso instanceof Date ? iso : new Date(iso)
  if (Number.isNaN(d.getTime())) return String(iso)
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })
}

export function mapStockRow(row: {
  id: string
  name: string
  brand: string | null
  sku: string
  hsn: string
  gst: { toNumber(): number } | number
  expiry: Date
  buyingPrice: { toNumber(): number } | number
  sellingPrice: { toNumber(): number } | number
  packSize: string
  batch: string
  shelf: string
  purchased: number
  sold: number
  qtyAvailable: number
}) {
  return {
    id: row.id,
    name: row.name,
    brand: row.brand ?? undefined,
    sku: Number.parseInt(row.sku, 10) || 0,
    hsn: row.hsn,
    gst: Number(row.gst),
    expiry: formatDbDate(row.expiry),
    buyingPrice: Number(row.buyingPrice),
    sellingPrice: Number(row.sellingPrice),
    packSize: row.packSize,
    batch: row.batch,
    shelf: row.shelf,
    purchased: row.purchased,
    sold: row.sold,
    qty: row.qtyAvailable,
  }
}

export function mapCatalogRow(row: {
  id: string
  name: string
  brand: string | null
  sku: string
  hsn: string
  gst: { toNumber(): number } | number
  expiry: Date
  sellingPrice: { toNumber(): number } | number
  packSize: string
  batch: string
  qtyAvailable: number
}) {
  return {
    id: row.id,
    name: row.name,
    brand: row.brand ?? undefined,
    sku: Number.parseInt(row.sku, 10) || 0,
    hsn: row.hsn,
    gst: Number(row.gst),
    expiry: formatDbDate(row.expiry),
    buyingPrice: 0,
    sellingPrice: Number(row.sellingPrice),
    packSize: row.packSize,
    batch: row.batch,
    shelf: "",
    purchased: 0,
    sold: 0,
    qty: row.qtyAvailable,
  }
}

export function mapFranchiseRow(row: {
  id: string
  name: string
  phone: string
  whatsapp: string
  yearlyOrder: { toNumber(): number } | number
  aov: { toNumber(): number } | number
  monthPotential: { toNumber(): number } | number
  thisMonth: { toNumber(): number } | number
  changePct: { toNumber(): number } | number
  lastOrder: Date | null
}) {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    whatsapp: row.whatsapp,
    yearlyOrder: Number(row.yearlyOrder),
    aov: Number(row.aov),
    monthPotential: Number(row.monthPotential),
    thisMonth: Number(row.thisMonth),
    changePct: Number(row.changePct),
    lastOrder: row.lastOrder ? formatDbDate(row.lastOrder) : "",
  }
}

export function mapOrderLineRow(row: {
  id: string
  medicineName: string
  quantity: number
  batch: string
  pricePerUnit: { toNumber(): number } | number
  gst: { toNumber(): number } | number
}) {
  return {
    id: row.id,
    medicineName: row.medicineName,
    quantity: row.quantity,
    batch: row.batch,
    pricePerUnit: Number(row.pricePerUnit),
    gst: Number(row.gst),
  }
}

export function mapOrderRow(
  row: {
    id: string
    franchiseId: string
    status: string
    billNumber: string
    billDate: Date | null
    invoiceNote: string | null
    remark: string | null
    totalAmount: { toNumber(): number } | number
    createdAt: Date
  },
  lines: {
    id: string
    medicineName: string
    quantity: number
    batch: string
    pricePerUnit: { toNumber(): number } | number
    gst: { toNumber(): number } | number
    sortOrder: number
  }[],
  franchiseName: string,
) {
  const status = row.status
  return {
    id: row.id,
    franchiseName,
    franchiseId: row.franchiseId,
    billNumber: row.billNumber,
    billDate: row.billDate ? formatDbDate(row.billDate) : "",
    invoiceNote: row.invoiceNote ?? undefined,
    remark: row.remark ?? undefined,
    totalAmount: Number(row.totalAmount),
    date: formatOrderDate(row.createdAt),
    approved: status === "approved" || status === "dispatched",
    dispatched: status === "dispatched",
    rejected: status === "rejected",
    status,
    lines: lines
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(mapOrderLineRow),
  }
}

function parseExpiryToIso(expiry: string): Date {
  const parts = expiry.split(/[-/]/)
  if (parts.length === 3) {
    const [a, b, c] = parts.map((p) => parseInt(p, 10))
    if (a > 31) return new Date(`${a}-${String(b).padStart(2, "0")}-${String(c).padStart(2, "0")}`)
    return new Date(`${c}-${String(b).padStart(2, "0")}-${String(a).padStart(2, "0")}`)
  }
  return new Date(expiry)
}

export function stockToUpsertPayload(rows: Record<string, unknown>[]) {
  return rows.map((row) => ({
    name: String(row.name),
    brand: row.brand ? String(row.brand) : null,
    sku: String(row.sku ?? ""),
    hsn: String(row.hsn ?? ""),
    gst: Number(row.gst ?? 0),
    expiry: parseExpiryToIso(String(row.expiry)),
    buyingPrice: Number(row.buyingPrice ?? 0),
    sellingPrice: Number(row.sellingPrice ?? 0),
    packSize: String(row.packSize ?? ""),
    batch: String(row.batch),
    shelf: String(row.shelf ?? ""),
    purchased: Number(row.purchased ?? 0),
    sold: Number(row.sold ?? 0),
    qtyAvailable: Number(row.qty ?? row.qtyAvailable ?? 0),
  }))
}

export function orderLinesToApprovePayload(lines: Record<string, unknown>[]) {
  return lines.map((line, index) => ({
    medicineName: String(line.medicineName),
    quantity: Number(line.quantity),
    batch: String(line.batch ?? ""),
    pricePerUnit: Number(line.pricePerUnit ?? 0),
    gst: Number(line.gst ?? 0),
    sortOrder: index,
  }))
}

export function toBillDateIso(billDate: string): Date {
  const parts = billDate.split("-")
  if (parts.length === 3) {
    return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`)
  }
  return new Date(billDate)
}

export function lineTotal(qty: number, price: number, gst: number): number {
  return qty * price * (1 + gst / 100)
}
