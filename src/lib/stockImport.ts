import * as XLSX from "xlsx"
import * as pdfjsLib from "pdfjs-dist"
import type { StockItem } from "@/data/stock"

if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url,
  ).toString()
}

export type StockImportRow = Omit<StockItem, "id">

export const STOCK_IMPORT_HEADERS = [
  "Medicine Name",
  "Brand",
  "SKU",
  "HSN",
  "GST",
  "Expiry",
  "Buying Price",
  "Selling Price",
  "Pack Size",
  "Batch",
  "Shelf",
  "Purchased",
  "Sold",
  "Qty",
] as const

const FIELD_ALIASES: Record<keyof StockImportRow, string[]> = {
  name: ["medicinename", "name", "medicine", "product", "productname", "itemname"],
  brand: ["brand", "manufacturer", "company"],
  sku: ["sku", "skucode", "itemcode", "code"],
  hsn: ["hsn", "hsncode", "hsnsac"],
  gst: ["gst", "gstrate", "tax", "taxpercent"],
  expiry: ["expiry", "expirydate", "expdate", "expiration"],
  buyingPrice: ["buyingprice", "buying", "buyprice", "purchaseprice", "cost"],
  sellingPrice: ["sellingprice", "selling", "sellprice", "mrp", "price"],
  packSize: ["packsize", "pack", "packing", "size"],
  batch: ["batch", "batchno", "batchnumber", "lot"],
  shelf: ["shelf", "location", "rack", "bin"],
  purchased: ["purchased", "purchase", "purchaseqty", "purchasedqty"],
  sold: ["sold", "soldqty", "sales"],
  qty: ["qty", "quantity", "stock", "stockqty", "available"],
}

function normalizeKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "")
}

function parseNumber(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) return value
  const text = String(value ?? "")
    .replace(/,/g, "")
    .replace(/[^\d.-]/g, "")
  const n = Number(text)
  return Number.isFinite(n) ? n : fallback
}

function parseText(value: unknown, fallback = "") {
  const text = String(value ?? "").trim()
  return text || fallback
}

function formatExpiry(value: unknown) {
  const text = parseText(value)
  if (!text) return ""

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    const [y, m, d] = text.split("-")
    return `${d}-${m}-${y}`
  }
  if (/^\d{2}-\d{2}-\d{4}$/.test(text)) return text
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(text)) {
    const [d, m, y] = text.split("/")
    return `${d}-${m}-${y}`
  }

  const date = new Date(text)
  if (!Number.isNaN(date.getTime())) {
    const d = String(date.getDate()).padStart(2, "0")
    const m = String(date.getMonth() + 1).padStart(2, "0")
    const y = date.getFullYear()
    return `${d}-${m}-${y}`
  }

  return text
}

function pickField(row: Record<string, unknown>, field: keyof StockImportRow) {
  const entries = Object.entries(row)
  for (const alias of FIELD_ALIASES[field]) {
    const match = entries.find(([key]) => normalizeKey(key) === alias)
    if (match && String(match[1] ?? "").trim() !== "") return match[1]
  }
  return undefined
}

export function rowToStockItem(row: Record<string, unknown>): StockImportRow | null {
  const name = parseText(pickField(row, "name"))
  if (!name) return null

  const qty = parseNumber(pickField(row, "qty"))
  const purchased = parseNumber(pickField(row, "purchased"))
  const sold = parseNumber(pickField(row, "sold"))

  return {
    name,
    brand: parseText(pickField(row, "brand")) || undefined,
    sku: parseNumber(pickField(row, "sku"), 0),
    hsn: parseText(pickField(row, "hsn"), "3004"),
    gst: parseNumber(pickField(row, "gst"), 12),
    expiry: formatExpiry(pickField(row, "expiry")),
    buyingPrice: parseNumber(pickField(row, "buyingPrice")),
    sellingPrice: parseNumber(pickField(row, "sellingPrice")),
    packSize: parseText(pickField(row, "packSize"), "—"),
    batch: parseText(pickField(row, "batch")),
    shelf: parseText(pickField(row, "shelf"), "—"),
    purchased,
    sold,
    qty: qty || Math.max(0, purchased - sold),
  }
}

function rowsFromObjects(objects: Record<string, unknown>[]) {
  return objects.map(rowToStockItem).filter((row): row is StockImportRow => row !== null)
}

export async function parseStockExcel(file: File) {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: "array" })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  if (!sheet) return []

  const objects = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" })
  return rowsFromObjects(objects)
}

async function extractPdfLines(file: File) {
  const buffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise
  const lines: string[] = []

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum += 1) {
    const page = await pdf.getPage(pageNum)
    const content = await page.getTextContent()
    const buckets = new Map<number, string[]>()

    for (const item of content.items) {
      if (!("str" in item) || !item.str.trim()) continue
      const y = Math.round(item.transform[5])
      const bucket = buckets.get(y) ?? []
      bucket.push(item.str.trim())
      buckets.set(y, bucket)
    }

    const sorted = [...buckets.entries()].sort((a, b) => b[0] - a[0])
    for (const [, parts] of sorted) {
      lines.push(parts.join(" ").replace(/\s+/g, " ").trim())
    }
  }

  return lines.filter(Boolean)
}

function parseDelimitedLine(line: string) {
  if (line.includes("\t")) return line.split("\t").map((part) => part.trim())
  if (line.includes("|")) return line.split("|").map((part) => part.trim())
  if (line.includes(",")) return line.split(",").map((part) => part.trim())
  return line.split(/\s{2,}/).map((part) => part.trim())
}

function linesToObjects(lines: string[]) {
  if (lines.length < 2) return []

  const headerIndex = lines.findIndex((line) => {
    const norm = normalizeKey(line)
    return norm.includes("medicine") || norm.includes("product") || norm.includes("batch")
  })

  const headerLine = headerIndex >= 0 ? lines[headerIndex] : lines[0]
  const dataLines = headerIndex >= 0 ? lines.slice(headerIndex + 1) : lines.slice(1)
  const headers = parseDelimitedLine(headerLine).map(normalizeKey)

  return dataLines
    .map((line) => {
      const cells = parseDelimitedLine(line)
      if (cells.length < 3) return null
      const row: Record<string, unknown> = {}
      headers.forEach((header, index) => {
        if (header) row[header] = cells[index] ?? ""
      })
      return row
    })
    .filter((row): row is Record<string, unknown> => row !== null)
}

export async function parseStockPdf(file: File) {
  const lines = await extractPdfLines(file)
  return rowsFromObjects(linesToObjects(lines))
}

export async function importStockFile(file: File) {
  const ext = file.name.split(".").pop()?.toLowerCase()
  if (ext === "pdf") return parseStockPdf(file)
  if (ext === "xlsx" || ext === "xls" || ext === "csv") return parseStockExcel(file)
  throw new Error("Unsupported file type. Upload .xlsx, .xls, .csv, or .pdf")
}

export function exportStockSpreadsheet(stock: StockItem[]) {
  const rows = stock.map((item) => ({
    "Medicine Name": item.name,
    Brand: item.brand ?? "",
    SKU: item.sku,
    HSN: item.hsn,
    GST: item.gst,
    Expiry: item.expiry,
    "Buying Price": item.buyingPrice,
    "Selling Price": item.sellingPrice,
    "Pack Size": item.packSize,
    Batch: item.batch,
    Shelf: item.shelf,
    Purchased: item.purchased,
    Sold: item.sold,
    Qty: item.qty,
  }))

  const sheet = XLSX.utils.json_to_sheet(rows.length ? rows : [{}])
  if (!rows.length) {
    XLSX.utils.sheet_add_aoa(sheet, [STOCK_IMPORT_HEADERS as unknown as string[]], { origin: "A1" })
  }
  const book = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(book, sheet, "Stock")
  XLSX.writeFile(book, rows.length ? "mediculous-stock.xlsx" : "mediculous-stock-template.xlsx")
}

export function assignStockIds(rows: StockImportRow[]): StockItem[] {
  return rows.map((row) => ({ ...row, id: crypto.randomUUID() }))
}
