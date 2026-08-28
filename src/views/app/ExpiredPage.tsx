"use client"

import { Download } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TableShell, TableToolbar, usePagedRows } from "@/components/layout/TableShell"
import { PaginationBar } from "@/components/layout/PaginationBar"
import { PageHeader } from "@/components/layout/PageHeader"
import { useAppState } from "@/context/AppState"
import { getExpiredProducts } from "@/data/expiry"
import { formatInrPlain } from "@/lib/format"
import { getRouteMeta } from "@/lib/routeMeta"

export function ExpiredPage() {
  const { stock } = useAppState()
  const rows = getExpiredProducts(stock).map((p) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    expiry: p.expiry,
    packSize: p.packSize,
    batch: p.batch,
    price: p.sellingPrice,
    qty: p.qty,
  }))
  const page = usePagedRows(rows, 50)
  const meta = getRouteMeta("/app/medicines/expired")

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
            <Button variant="glass" onClick={() => toast.message("Demo PDF")}>
              <Download className="size-4" /> Download PDF
            </Button>
          </TableToolbar>
        }
        footer={
          <PaginationBar
            page={page.page}
            pages={page.pages}
            from={(page.page - 1) * page.pageSize + (page.filtered.length ? 1 : 0)}
            to={Math.min(page.page * page.pageSize, page.filtered.length)}
            total={page.filtered.length}
            onPage={page.setPage}
          />
        }
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>S No</TableHead>
              <TableHead>Medicine name</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Expiry</TableHead>
              <TableHead>Pack</TableHead>
              <TableHead>Batch</TableHead>
              <TableHead>Price / unit</TableHead>
              <TableHead>Qty</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {page.slice.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-ink-soft">
                  No expired products in current stock.
                </TableCell>
              </TableRow>
            ) : (
              page.slice.map((row, i) => (
                <TableRow key={row.id}>
                  <TableCell className="font-mono text-xs">{i + 1}</TableCell>
                  <TableCell className="font-medium">{row.name}</TableCell>
                  <TableCell className="font-mono">{row.sku}</TableCell>
                  <TableCell>
                    <Badge tone="hold">{row.expiry}</Badge>
                  </TableCell>
                  <TableCell>{row.packSize}</TableCell>
                  <TableCell className="font-mono text-xs">{row.batch}</TableCell>
                  <TableCell className="font-mono text-xs">{formatInrPlain(row.price)}</TableCell>
                  <TableCell>
                    <Badge tone="cobalt">{row.qty}</Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableShell>
    </div>
  )
}
