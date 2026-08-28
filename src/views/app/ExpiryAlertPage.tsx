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
import { getExpiryAlerts } from "@/data/expiry"
import { formatInrPlain } from "@/lib/format"
import { getRouteMeta } from "@/lib/routeMeta"

export function ExpiryAlertPage() {
  const { stock } = useAppState()
  const rows = getExpiryAlerts(stock)
  const page = usePagedRows(rows, 50)
  const meta = getRouteMeta("/app/medicines/expiry")

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
            <Button variant="glass" onClick={() => toast.message("Demo download")}>
              <Download className="size-4" /> Download file
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
              <TableHead>Medicine SKU</TableHead>
              <TableHead>Expiry date</TableHead>
              <TableHead>Pack size</TableHead>
              <TableHead>Batch number</TableHead>
              <TableHead>Price / unit</TableHead>
              <TableHead>Qty</TableHead>
              <TableHead>Sub total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {page.slice.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="py-10 text-center text-ink-soft">
                  No near-expiry items in current stock.
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
                  <TableCell className="font-mono text-xs">{formatInrPlain(row.price * row.qty)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableShell>
    </div>
  )
}
