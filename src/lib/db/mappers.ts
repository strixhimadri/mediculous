import type { Franchise } from "@/data/franchises"
import type { FranchiseOrder, OrderLine } from "@/data/orders"
import type { StockItem } from "@/data/stock"
import type {
  DbCatalogStock,
  DbFranchise,
  DbOrder,
  DbOrderLine,
  DbWholesalerStock,
} from "@/types/database"

function formatDbDate(iso: string | null): string {
  if (!iso) return ""
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const day = String(d.getDate()).padStart(2, "0")
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const year = d.getFullYear()
  return `${day}-${month}-${year}`
}

function formatOrderDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })
}

export function mapStockRow(row: DbWholesalerStock): StockItem {
  return {
    id: row.id,
    name: row.name,
    brand: row.brand ?? undefined,
    sku: Number.parseInt(row.sku, 10) || 0,
    hsn: row.hsn,
    gst: Number(row.gst),
    expiry: formatDbDate(row.expiry),
    buyingPrice: Number(row.buying_price),
    sellingPrice: Number(row.selling_price),
    packSize: row.pack_size,
    batch: row.batch,
    shelf: row.shelf,
    purchased: row.purchased,
    sold: row.sold,
    qty: row.qty_available,
  }
}

export function mapCatalogRow(row: DbCatalogStock): StockItem {
  return {
    id: row.id,
    name: row.name,
    brand: row.brand ?? undefined,
    sku: Number.parseInt(row.sku, 10) || 0,
    hsn: row.hsn,
    gst: Number(row.gst),
    expiry: formatDbDate(row.expiry),
    buyingPrice: 0,
    sellingPrice: Number(row.selling_price),
    packSize: row.pack_size,
    batch: row.batch,
    shelf: "",
    purchased: 0,
    sold: 0,
    qty: row.qty_available,
  }
}

export function mapFranchiseRow(row: DbFranchise): Franchise {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    whatsapp: row.whatsapp,
    yearlyOrder: Number(row.yearly_order),
    aov: Number(row.aov),
    monthPotential: Number(row.month_potential),
    thisMonth: Number(row.this_month),
    changePct: Number(row.change_pct),
    lastOrder: row.last_order ?? "",
  }
}

export function mapOrderLineRow(row: DbOrderLine): OrderLine {
  return {
    id: row.id,
    medicineName: row.medicine_name,
    quantity: row.quantity,
    batch: row.batch,
    pricePerUnit: Number(row.price_per_unit),
    gst: Number(row.gst),
  }
}

export function mapOrderRow(
  row: DbOrder,
  lines: DbOrderLine[],
  franchiseName: string,
): FranchiseOrder {
  return {
    id: row.id,
    franchiseName,
    franchiseId: row.franchise_id,
    billNumber: row.bill_number,
    billDate: row.bill_date ? formatDbDate(row.bill_date) : "",
    invoiceNote: row.invoice_note ?? undefined,
    remark: row.remark ?? undefined,
    totalAmount: Number(row.total_amount),
    date: formatOrderDate(row.created_at),
    approved: row.status === "approved" || row.status === "dispatched",
    dispatched: row.status === "dispatched",
    rejected: row.status === "rejected",
    status: row.status,
    lines: lines.sort((a, b) => a.sort_order - b.sort_order).map(mapOrderLineRow),
  }
}

export function stockToUpsertPayload(rows: Omit<StockItem, "id">[]) {
  return rows.map((row) => ({
    name: row.name,
    brand: row.brand ?? "",
    sku: String(row.sku),
    hsn: row.hsn,
    gst: row.gst,
    expiry: parseExpiryToIso(row.expiry),
    buying_price: row.buyingPrice,
    selling_price: row.sellingPrice,
    pack_size: row.packSize,
    batch: row.batch,
    shelf: row.shelf,
    purchased: row.purchased,
    sold: row.sold,
    qty_available: row.qty,
  }))
}

function parseExpiryToIso(expiry: string): string {
  const parts = expiry.split(/[-/]/)
  if (parts.length === 3) {
    const [a, b, c] = parts.map((p) => parseInt(p, 10))
    if (a > 31) return `${a}-${String(b).padStart(2, "0")}-${String(c).padStart(2, "0")}`
    return `${c}-${String(b).padStart(2, "0")}-${String(a).padStart(2, "0")}`
  }
  return expiry
}

export function orderLinesToApprovePayload(lines: OrderLine[]) {
  return lines.map((line, index) => ({
    medicine_name: line.medicineName,
    quantity: line.quantity,
    batch: line.batch,
    price_per_unit: line.pricePerUnit,
    gst: line.gst,
    sort_order: index,
  }))
}
