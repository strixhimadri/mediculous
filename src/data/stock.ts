export type StockFilter = "in_stock" | "low" | "all"

export type StockItem = {
  id: string
  name: string
  brand?: string
  sku: number
  hsn: string
  gst: number
  expiry: string
  buyingPrice: number
  sellingPrice: number
  packSize: string
  batch: string
  shelf: string
  purchased: number
  sold: number
  qty: number
}

export const stockItems: StockItem[] = []

export function medicineBaseName(name: string) {
  return name.replace(/\s*\([^)]*\)\s*$/, "").trim()
}

export function stockBatchesForMedicine(stock: StockItem[], medicineName: string) {
  const base = medicineBaseName(medicineName)
  return stock.filter((item) => item.name === medicineName || item.name === base)
}

export function findStockBatch(stock: StockItem[], medicineName: string, batch: string) {
  return stockBatchesForMedicine(stock, medicineName).find((item) => item.batch === batch)
}

export const monthlySales = [
  { month: "Apr", value: 2_150_000 },
  { month: "May", value: 2_280_000 },
  { month: "Jun", value: 2_410_000 },
  { month: "Jul", value: 5_820_000 },
  { month: "Aug", value: 1_640_000 },
  { month: "Sep", value: 0 },
  { month: "Oct", value: 0 },
  { month: "Nov", value: 0 },
  { month: "Dec", value: 0 },
  { month: "Jan", value: 0 },
  { month: "Feb", value: 0 },
  { month: "Mar", value: 0 },
]

export const kpis = [
  { key: "medicine", label: "Medicine", value: 1644, phase: "forest" as const },
  { key: "orders", label: "Orders", value: 1486, phase: "sunset" as const },
  { key: "retail", label: "Retail Sale 2026–27", value: 20_969_948, phase: "forest" as const, money: true },
  { key: "hospital", label: "Hospital Sale 2026–27", value: 2_698_838, phase: "peach" as const, money: true },
  { key: "stock", label: "Stock Value W/O GST", value: 3_219_191, phase: "sunset" as const, money: true },
]
