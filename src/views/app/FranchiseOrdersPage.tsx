"use client"

import { useState, type ReactNode } from "react"
import { Link } from "@/lib/navigation"
import {
  Check,
  Eye,
  FileSpreadsheet,
  MoreHorizontal,
  Pencil,
  Printer,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TableShell, TableToolbar, usePagedRows } from "@/components/layout/TableShell"
import { PaginationBar } from "@/components/layout/PaginationBar"
import { PageHeader } from "@/components/layout/PageHeader"
import { YesNoPill } from "@/components/layout/YesNoPill"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useAppState } from "@/context/AppState"
import type { FranchiseOrder } from "@/data/orders"
import { formatInrPlain } from "@/lib/format"
import { exportOrderSpreadsheet, printOrderBill } from "@/lib/orderActions"
import { getRouteMeta } from "@/lib/routeMeta"
import {
  InvoiceDetailDialog,
  inputToBillDate,
  type InvoiceForm,
} from "@/components/orders/InvoiceDetailDialog"

export function FranchiseOrdersPage() {
  const { orders, updateOrder, dispatchOrder, removeOrder } = useAppState()
  const page = usePagedRows(orders, 25)
  const meta = getRouteMeta("/app/orders/franchise")
  const [deleteTarget, setDeleteTarget] = useState<FranchiseOrder | null>(null)
  const [invoiceTarget, setInvoiceTarget] = useState<FranchiseOrder | null>(null)

  function handleExport(order: FranchiseOrder) {
    exportOrderSpreadsheet(order)
    toast.success(`Order ${order.id} exported as spreadsheet`)
  }

  function handlePrint(order: FranchiseOrder) {
    const opened = printOrderBill(order)
    if (!opened) {
      toast.error("Allow pop-ups to print the bill")
      return
    }
    toast.success(`Print bill opened for order ${order.id}`)
  }

  function handleDispatch(order: FranchiseOrder) {
    void (async () => {
      const result = await dispatchOrder(order.id)
      if (!result.ok) {
        toast.error(result.message)
        return
      }
      toast.success(`Order ${order.id.slice(0, 8)} dispatched — stock updated`)
    })()
  }

  function confirmDelete() {
    if (!deleteTarget) return
    void (async () => {
      await removeOrder(deleteTarget.id)
      toast.success(`Order deleted`)
      setDeleteTarget(null)
    })()
  }

  function saveInvoice(values: InvoiceForm) {
    if (!invoiceTarget) return
    void (async () => {
      await updateOrder(invoiceTarget.id, {
        billNumber: values.billNumber.trim(),
        billDate: inputToBillDate(values.billDate),
        invoiceNote: values.invoiceNote.trim(),
        remark: values.remark.trim(),
      })
      toast.success(`Invoice details saved`)
      setInvoiceTarget(null)
    })()
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title={meta.title}
        description="Only dispatched orders will show in the retailer panel."
        crumbs={meta.crumbs}
      />
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
        <Table className="min-w-[960px]">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-20">Order id</TableHead>
              <TableHead className="min-w-[140px]">Franchise name</TableHead>
              <TableHead className="min-w-[120px]">Bill number</TableHead>
              <TableHead className="w-24">Bill date</TableHead>
              <TableHead className="w-28">Total amount</TableHead>
              <TableHead className="min-w-[120px]">Date</TableHead>
              <TableHead className="w-24">Approved</TableHead>
              <TableHead className="w-24">Dispatch</TableHead>
              <TableHead className="sticky right-0 w-36 bg-brand text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {page.slice.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="py-10 text-center text-ink-soft">
                  No franchise orders match your search.
                </TableCell>
              </TableRow>
            ) : (
              page.slice.map((row) => (
                <TableRow key={row.id} className="group">
                  <TableCell className="font-mono text-xs">{row.id}</TableCell>
                  <TableCell className="max-w-[160px] truncate font-medium" title={row.franchiseName}>
                    {row.franchiseName}
                  </TableCell>
                  <TableCell className="max-w-[140px] truncate">
                    {row.billNumber ? (
                      <Link
                        className="text-navy underline-offset-2 hover:underline"
                        to={`/app/orders/franchise/${row.id}`}
                        title={row.billNumber}
                      >
                        {row.billNumber}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="text-xs whitespace-nowrap">{row.billDate || "—"}</TableCell>
                  <TableCell className="font-mono text-xs whitespace-nowrap">
                    {formatInrPlain(row.totalAmount)}
                  </TableCell>
                  <TableCell className="text-xs whitespace-nowrap">{row.date}</TableCell>
                  <TableCell>
                    <YesNoPill yes={row.approved} />
                  </TableCell>
                  <TableCell>
                    <YesNoPill yes={row.dispatched} />
                  </TableCell>
                  <TableCell className="sticky right-0 bg-white group-hover:bg-canvas">
                    <div className="flex items-center justify-end gap-0.5">
                      <IconTip label="View order">
                        <Button size="icon-sm" variant="glass" asChild>
                          <Link to={`/app/orders/franchise/${row.id}`} aria-label="View order">
                            <Eye className="size-3.5" />
                          </Link>
                        </Button>
                      </IconTip>
                      {row.approved ? (
                        <IconTip label="Invoice detail">
                          <Button
                            size="icon-sm"
                            variant="glass"
                            aria-label="Invoice detail"
                            onClick={() => setInvoiceTarget(row)}
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                        </IconTip>
                      ) : null}
                      {row.approved && !row.dispatched ? (
                        <IconTip label="Mark dispatched">
                          <Button
                            size="icon-sm"
                            variant="glass"
                            aria-label="Mark dispatched"
                            onClick={() => handleDispatch(row)}
                          >
                            <Check className="size-3.5" />
                          </Button>
                        </IconTip>
                      ) : null}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon-sm" variant="glass" aria-label="More actions">
                            <MoreHorizontal className="size-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => handleExport(row)}>
                            <FileSpreadsheet className="mr-2 size-4" /> Export spreadsheet
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => handlePrint(row)}>
                            <Printer className="mr-2 size-4" /> Print bill
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-danger focus:text-danger"
                            onSelect={() => setDeleteTarget(row)}
                          >
                            <Trash2 className="mr-2 size-4" /> Delete order
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableShell>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete order #{deleteTarget?.id}?</DialogTitle>
            <DialogDescription>
              This removes the order from the list for this session. Line items for{" "}
              {deleteTarget?.franchiseName} will be deleted.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="glass" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmDelete}>
              Delete order
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <InvoiceDetailDialog
        order={invoiceTarget}
        open={!!invoiceTarget}
        onOpenChange={(open) => !open && setInvoiceTarget(null)}
        onSave={saveInvoice}
      />
    </div>
  )
}

function IconTip({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}
