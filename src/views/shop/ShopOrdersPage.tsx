"use client"

import { Link } from "@/lib/navigation"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { GlassPanel } from "@/components/layout/GlassPanel"
import { PageHeader } from "@/components/layout/PageHeader"
import { PaginationBar } from "@/components/layout/PaginationBar"
import { usePagedRows } from "@/components/layout/TableShell"
import { useAppState } from "@/context/AppState"
import type { OrderStatus } from "@/data/orders"
import { formatInrPlain } from "@/lib/format"
import { cn } from "@/lib/utils"

function StatusBadge({ status }: { status: OrderStatus }) {
  const label = {
    pending: "Pending",
    approved: "Approved",
    dispatched: "Dispatched",
    rejected: "Rejected",
  }[status]
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold",
        status === "pending" && "bg-canvas text-ink",
        status === "approved" && "bg-brand/10 text-brand",
        status === "dispatched" && "bg-brand text-white",
        status === "rejected" && "bg-red-50 text-red-700",
      )}
    >
      {label}
    </span>
  )
}

export function ShopOrdersPage() {
  const { orders, loading } = useAppState()
  const page = usePagedRows(orders, 15)

  return (
    <div className="space-y-5">
      <PageHeader
        title="My orders"
        description="Track approval and dispatch status for orders placed with your wholesaler."
        actions={
          <Button asChild>
            <Link to="/shop">Place new order</Link>
          </Button>
        }
      />

      <GlassPanel className="overflow-hidden">
        {loading ? (
          <p className="p-8 text-center text-sm text-ink-soft">Loading orders…</p>
        ) : orders.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm text-ink-soft">No orders yet.</p>
            <Button className="mt-4" asChild>
              <Link to="/shop">Browse catalog</Link>
            </Button>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {page.slice.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-xs">#{order.id.slice(0, 8)}</TableCell>
                    <TableCell className="text-sm">{order.date}</TableCell>
                    <TableCell>
                      <StatusBadge status={order.status} />
                    </TableCell>
                    <TableCell className="font-mono text-xs">{order.lines.length}</TableCell>
                    <TableCell className="font-mono text-xs">{formatInrPlain(order.totalAmount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <PaginationBar
              page={page.page}
              pages={page.pages}
              from={orders.length ? (page.page - 1) * 15 + 1 : 0}
              to={Math.min(page.page * 15, orders.length)}
              total={orders.length}
              onPage={page.setPage}
            />
          </>
        )}
      </GlassPanel>
    </div>
  )
}
