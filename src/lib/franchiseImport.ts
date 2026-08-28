import * as XLSX from "xlsx"
import * as pdfjsLib from "pdfjs-dist"
import type { Franchise } from "@/data/franchises"

if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url,
  ).toString()
}

export type FranchiseImportRow = Omit<Franchise, "id">

export const FRANCHISE_IMPORT_HEADERS = [
  "Franchise Name",
  "Contact",
  "Last 1 Year Order",
  "AOV",
  "Month Potential",
  "This Month",
  "Change %",
  "Last Order Date",
  "WhatsApp",
] as const

const FIELD_ALIASES: Record<keyof FranchiseImportRow, string[]> = {
  name: ["franchisename", "name", "franchise", "partner", "storename"],
  phone: ["contact", "phone", "mobile", "phonenumber", "contactnumber"],
  yearlyOrder: ["last1yearorder", "yearlyorder", "yearorder", "annualorder", "lastyearorder"],
  aov: ["aov", "averageordervalue", "avgorder"],
  monthPotential: ["monthpotential", "potential", "monthlypotential"],
  thisMonth: ["thismonth", "currentmonth", "monthsales"],
  changePct: ["change", "changepercent", "changepct", "growth"],
  lastOrder: ["lastorderdate", "lastorder", "lastorderon", "orderdate"],
  whatsapp: ["whatsapp", "whatsapno", "wanumber"],
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

function normalizeWhatsapp(phone: string, whatsapp?: string) {
  const digits = (whatsapp || phone).replace(/\D/g, "")
  if (digits.length === 10) return `91${digits}`
  if (digits.startsWith("91") && digits.length === 12) return digits
  return digits || "91"
}

function parseIsoDate(value: unknown) {
  const text = parseText(value)
  if (!text) return new Date().toISOString()

  if (/^\d{4}-\d{2}-\d{2}/.test(text)) {
    const date = new Date(text)
    if (!Number.isNaN(date.getTime())) return date.toISOString()
  }

  if (/^\d{2}-\d{2}-\d{4}$/.test(text)) {
    const [d, m, y] = text.split("-").map(Number)
    return new Date(y, m - 1, d).toISOString()
  }

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(text)) {
    const [d, m, y] = text.split("/").map(Number)
    return new Date(y, m - 1, d).toISOString()
  }

  const date = new Date(text)
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString()
}

function pickField(row: Record<string, unknown>, field: keyof FranchiseImportRow) {
  const entries = Object.entries(row)
  for (const alias of FIELD_ALIASES[field]) {
    const match = entries.find(([key]) => normalizeKey(key) === alias)
    if (match && String(match[1] ?? "").trim() !== "") return match[1]
  }
  return undefined
}

export function rowToFranchise(row: Record<string, unknown>): FranchiseImportRow | null {
  const name = parseText(pickField(row, "name"))
  if (!name) return null

  const phone = parseText(pickField(row, "phone"))
  const whatsappRaw = parseText(pickField(row, "whatsapp"))

  return {
    name,
    phone: phone || "—",
    yearlyOrder: parseNumber(pickField(row, "yearlyOrder")),
    aov: parseNumber(pickField(row, "aov")),
    monthPotential: parseNumber(pickField(row, "monthPotential")),
    thisMonth: parseNumber(pickField(row, "thisMonth")),
    changePct: parseNumber(pickField(row, "changePct")),
    lastOrder: parseIsoDate(pickField(row, "lastOrder")),
    whatsapp: normalizeWhatsapp(phone, whatsappRaw || undefined),
  }
}

function rowsFromObjects(objects: Record<string, unknown>[]) {
  return objects.map(rowToFranchise).filter((row): row is FranchiseImportRow => row !== null)
}

async function parseExcelObjects(file: File) {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: "array" })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  if (!sheet) return []

  return XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" })
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
    return norm.includes("franchise") || norm.includes("contact") || norm.includes("phone")
  })

  const headerLine = headerIndex >= 0 ? lines[headerIndex] : lines[0]
  const dataLines = headerIndex >= 0 ? lines.slice(headerIndex + 1) : lines.slice(1)
  const headers = parseDelimitedLine(headerLine).map(normalizeKey)

  return dataLines
    .map((line) => {
      const cells = parseDelimitedLine(line)
      if (cells.length < 2) return null
      const row: Record<string, unknown> = {}
      headers.forEach((header, index) => {
        if (header) row[header] = cells[index] ?? ""
      })
      return row
    })
    .filter((row): row is Record<string, unknown> => row !== null)
}

export async function importFranchiseFile(file: File) {
  const ext = file.name.split(".").pop()?.toLowerCase()
  if (ext === "pdf") {
    const lines = await extractPdfLines(file)
    return rowsFromObjects(linesToObjects(lines))
  }
  if (ext === "xlsx" || ext === "xls" || ext === "csv") {
    const objects = await parseExcelObjects(file)
    return rowsFromObjects(objects)
  }
  throw new Error("Unsupported file type. Upload .xlsx, .xls, .csv, or .pdf")
}

export function exportFranchiseSpreadsheet(franchises: Franchise[]) {
  const rows = franchises.map((item) => ({
    "Franchise Name": item.name,
    Contact: item.phone,
    "Last 1 Year Order": item.yearlyOrder,
    AOV: item.aov,
    "Month Potential": item.monthPotential,
    "This Month": item.thisMonth,
    "Change %": item.changePct,
    "Last Order Date": new Date(item.lastOrder).toISOString().slice(0, 10),
    WhatsApp: item.whatsapp,
  }))

  const sheet = XLSX.utils.json_to_sheet(rows.length ? rows : [{}])
  if (!rows.length) {
    XLSX.utils.sheet_add_aoa(sheet, [FRANCHISE_IMPORT_HEADERS as unknown as string[]], { origin: "A1" })
  }
  const book = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(book, sheet, "Franchises")
  XLSX.writeFile(book, rows.length ? "mediculous-franchises.xlsx" : "mediculous-franchise-template.xlsx")
}

export function assignFranchiseIds(rows: FranchiseImportRow[]): Franchise[] {
  return rows.map((row) => ({ ...row, id: crypto.randomUUID() }))
}

type FranchiseDraftInput = {
  name: string
  phone?: string
  yearlyOrder?: string | number
  aov?: string | number
  monthPotential?: string | number
  thisMonth?: string | number
  changePct?: string | number
  lastOrder?: string
  whatsapp?: string
}

export function createFranchiseDraft(input: FranchiseDraftInput): FranchiseImportRow {
  const phone = parseText(input.phone)
  return {
    name: input.name.trim(),
    phone: phone || "—",
    yearlyOrder: parseNumber(input.yearlyOrder),
    aov: parseNumber(input.aov),
    monthPotential: parseNumber(input.monthPotential),
    thisMonth: parseNumber(input.thisMonth),
    changePct: parseNumber(input.changePct),
    lastOrder: parseIsoDate(input.lastOrder ?? new Date().toISOString()),
    whatsapp: normalizeWhatsapp(phone, input.whatsapp),
  }
}
