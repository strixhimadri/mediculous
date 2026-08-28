"use client"

import { useMemo, useRef, useState } from "react"
import { useSearchParams } from "@/lib/navigation"
import { Download, Loader2, Upload } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TableShell, TableToolbar, usePagedRows } from "@/components/layout/TableShell"
import { PaginationBar } from "@/components/layout/PaginationBar"
import { PageHeader } from "@/components/layout/PageHeader"
import { useAppState } from "@/context/AppState"
import type { StockFilter } from "@/data/stock"
import { formatInr } from "@/lib/format"
import { getRouteMeta } from "@/lib/routeMeta"
import { exportStockSpreadsheet, importStockFile, STOCK_IMPORT_HEADERS } from "@/lib/stockImport"

export function StockPage() {
  const { stock, importStock } = useAppState()
  const searchParams = useSearchParams()
  const urlQuery = searchParams.get("q") ?? ""
  const [filter, setFilter] = useState<StockFilter>("in_stock")
  const [uploadOpen, setUploadOpen] = useState(false)
  const [importing, setImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const rows = useMemo(() => {
    if (filter === "all") return stock
    if (filter === "low") return stock.filter((s) => s.qty < 50)
    return stock.filter((s) => s.qty > 0)
  }, [stock, filter])

  const page = usePagedRows(rows, 25, urlQuery)
  const totalValue = rows.reduce((s, r) => s + r.qty * r.buyingPrice, 0)

  const meta = getRouteMeta("/app/medicines")

  async function handleUpload(file: File) {
    setImporting(true)
    try {
      const parsed = await importStockFile(file)
      if (!parsed.length) {
        throw new Error("No medicine rows found. Check column headers in your file.")
      }
      await importStock(parsed)
      toast.success(`Stock updated with ${parsed.length} medicines from ${file.name}`)
      setUploadOpen(false)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not import stock file"
      toast.error(message)
    } finally {
      setImporting(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader title={meta.title} description={meta.description} crumbs={meta.crumbs} />
      <TableShell
        toolbar={
          <TableToolbar
            pageSize={page.pageSize}
            onPageSize={page.setPageSize}
            query={page.query}
            onQuery={page.setQuery}
          >
            <Select value={filter} onValueChange={(v) => setFilter(v as StockFilter)}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="in_stock">In stock</SelectItem>
                <SelectItem value="low">Low stock</SelectItem>
                <SelectItem value="all">All</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => setUploadOpen(true)}>
              <Upload className="size-4" /> Upload stock
            </Button>
            <Button
              variant="glass"
              onClick={() => {
                exportStockSpreadsheet(stock)
                toast.success(stock.length ? "Stock file downloaded" : "Template downloaded")
              }}
            >
              <Download className="size-4" /> {stock.length ? "Download stock" : "Download template"}
            </Button>
          </TableToolbar>
        }
        footer={
          <div className="flex flex-col gap-2 border-t border-line sm:flex-row sm:items-center sm:justify-between">
            <PaginationBar
              page={page.page}
              pages={page.pages}
              from={(page.page - 1) * page.pageSize + (page.filtered.length ? 1 : 0)}
              to={Math.min(page.page * page.pageSize, page.filtered.length)}
              total={page.filtered.length}
              onPage={page.setPage}
            />
            <p className="px-4 pb-3 font-mono text-sm sm:pb-0">Total value: {formatInr(totalValue)}</p>
          </div>
        }
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>S No</TableHead>
              <TableHead>Medicine name</TableHead>
              <TableHead>Expiry</TableHead>
              <TableHead>Buying</TableHead>
              <TableHead>Selling</TableHead>
              <TableHead>Pack</TableHead>
              <TableHead>Batch</TableHead>
              <TableHead>Purchase</TableHead>
              <TableHead>Sold</TableHead>
              <TableHead>Qty</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {page.slice.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="py-12 text-center">
                  <p className="font-medium text-ink">No stock loaded yet</p>
                  <p className="mt-2 text-sm text-ink-soft">
                    Upload an Excel or PDF file to import medicines and update inventory.
                  </p>
                  <Button className="mt-4" onClick={() => setUploadOpen(true)}>
                    <Upload className="size-4" /> Upload stock file
                  </Button>
                </TableCell>
              </TableRow>
            ) : (
              page.slice.map((row, i) => (
                <TableRow key={row.id}>
                  <TableCell className="font-mono text-xs">{(page.page - 1) * page.pageSize + i + 1}</TableCell>
                  <TableCell>
                    <p className="font-medium">{row.name}</p>
                    <p className="text-xs text-ink-soft">
                      {row.brand} · SKU {row.sku} · HSN {row.hsn} · GST {row.gst}%
                    </p>
                  </TableCell>
                  <TableCell>
                    <Badge tone="rose">{row.expiry || "—"}</Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{formatInr(row.buyingPrice)}</TableCell>
                  <TableCell className="font-mono text-xs">{formatInr(row.sellingPrice)}</TableCell>
                  <TableCell>{row.packSize}</TableCell>
                  <TableCell className="font-mono text-xs">{row.batch}</TableCell>
                  <TableCell>
                    <Badge tone="cobalt">{row.purchased.toLocaleString("en-IN")}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge tone="day">{row.sold.toLocaleString("en-IN")}</Badge>
                  </TableCell>
                  <TableCell className="font-semibold">{row.qty.toLocaleString("en-IN")}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableShell>

      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload stock file</DialogTitle>
            <DialogDescription>
              Import medicines from Excel (.xlsx, .xls, .csv) or PDF. The file replaces current stock for
              this session.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-xl border border-line bg-canvas px-4 py-3 text-xs text-ink-soft">
              <p className="font-medium text-ink">Expected columns</p>
              <p className="mt-1">{STOCK_IMPORT_HEADERS.join(" · ")}</p>
            </div>
            <label className="flex cursor-pointer flex-col items-center gap-2 rounded-md border border-dashed border-line bg-canvas px-4 py-10 text-sm text-steel transition-colors hover:border-brand hover:bg-white">
              {importing ? <Loader2 className="size-6 animate-spin" /> : <Upload className="size-6" />}
              {importing ? "Analyzing file…" : "Drop Excel/PDF here, or click to choose"}
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv,.pdf,application/pdf"
                className="hidden"
                disabled={importing}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) void handleUpload(file)
                }}
              />
            </label>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                exportStockSpreadsheet([])
                toast.success("Template downloaded")
              }}
            >
              <Download className="size-4" /> Download Excel template
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
