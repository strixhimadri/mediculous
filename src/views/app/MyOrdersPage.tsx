"use client"

import { Link } from "@/lib/navigation"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TableShell, TableToolbar, usePagedRows } from "@/components/layout/TableShell"
import { PaginationBar } from "@/components/layout/PaginationBar"
import { PageHeader } from "@/components/layout/PageHeader"
import { YesNoPill } from "@/components/layout/YesNoPill"
import { useAppState } from "@/context/AppState"
import { formatInrPlain } from "@/lib/format"
import { getRouteMeta } from "@/lib/routeMeta"

export function MyOrdersPage() {
  const { orders } = useAppState()
  const mine = orders.filter((o) => o.franchiseName === "MEDITRUST PHARMACY")
  const page = usePagedRows(mine, 25)
  const meta = getRouteMeta("/app/orders")

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
          />
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
              <TableHead>Order id</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Approved</TableHead>
              <TableHead>Dispatch</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {page.slice.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  <Link className="font-mono text-navy underline-offset-2 hover:underline" to={`/app/orders/franchise/${row.id}`}>
                    {row.id}
                  </Link>
                </TableCell>
                <TableCell className="font-mono text-xs">{formatInrPlain(row.totalAmount)}</TableCell>
                <TableCell className="text-xs">{row.date}</TableCell>
                <TableCell>
                  <YesNoPill yes={row.approved} />
                </TableCell>
                <TableCell>
                  <YesNoPill yes={row.dispatched} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableShell>
    </div>
  )
}

export function HospitalOrdersPage() {
  const meta = getRouteMeta("/app/orders/hospital")
  return (
    <div className="space-y-5">
      <PageHeader title={meta.title} description={meta.description} crumbs={meta.crumbs} />
      <div className="panel p-10 text-center">
        <Badge className="mb-4">Coming soon</Badge>
        <p className="text-steel">
          Hospital channel orders are planned for the next phase. The current demo focuses on franchise wholesale
          workflows — stock, partner list, order approval, and dispatch.
        </p>
      </div>
    </div>
  )
}
