"use client"

import { useEffect, useMemo, useState } from "react"
import { Link, useLocation, useNavigate, useParams } from "@/lib/navigation"
import { Pencil, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { GlassPanel } from "@/components/layout/GlassPanel"
import { PageHeader } from "@/components/layout/PageHeader"
import { useAppState } from "@/context/AppState"
import { lineSubtotal, lineTaxable, orderTotals, type OrderLine } from "@/data/orders"
import { findStockBatch, stockBatchesForMedicine } from "@/data/stock"
import { formatInrPlain } from "@/lib/format"
import { getRouteMeta } from "@/lib/routeMeta"

type LineDraft = {
  quantity: number
  batch: string
}

function draftFromLine(line: OrderLine, stock: ReturnType<typeof useAppState>["stock"]): LineDraft {
  const batches = stockBatchesForMedicine(stock, line.medicineName)
  const batch =
    line.batch && batches.some((b) => b.batch === line.batch)
      ? line.batch
      : (batches[0]?.batch ?? "")
  return { quantity: line.quantity, batch }
}

function lineFromDraft(
  medicineName: string,
  draft: LineDraft,
  stock: ReturnType<typeof useAppState>["stock"],
  fallback: OrderLine,
): Partial<OrderLine> {
  const stockItem = findStockBatch(stock, medicineName, draft.batch)
  const quantity = Math.max(1, draft.quantity)
  return {
    quantity,
    batch: draft.batch,
    pricePerUnit: stockItem?.sellingPrice ?? fallback.pricePerUnit,
    gst: stockItem?.gst ?? fallback.gst,
  }
}

export function FranchiseOrderDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { orders, stock, updateLine, removeLine, addLine, approveOrder } = useAppState()
  const order = orders.find((o) => String(o.id) === id)
  const [addOpen, setAddOpen] = useState(false)
  const [editLineId, setEditLineId] = useState<string | null>(null)
  const [newName, setNewName] = useState(stock[0]?.name ?? "")
  const [newQty, setNewQty] = useState(1)
  const [newBatch, setNewBatch] = useState("")
  const [editDraft, setEditDraft] = useState<LineDraft>({ quantity: 1, batch: "" })
  const { pathname } = useLocation()
  const meta = getRouteMeta(pathname)

  const editingLine = order?.lines.find((l) => l.id === editLineId) ?? null
  const newMedicineBatches = useMemo(() => stockBatchesForMedicine(stock, newName), [stock, newName])
  const editBatches = useMemo(
    () => (editingLine ? stockBatchesForMedicine(stock, editingLine.medicineName) : []),
    [stock, editingLine],
  )

  useEffect(() => {
    const first = newMedicineBatches[0]?.batch ?? ""
    setNewBatch((current) =>
      current && newMedicineBatches.some((b) => b.batch === current) ? current : first,
    )
  }, [newName, newMedicineBatches])

  useEffect(() => {
    if (!editingLine) return
    setEditDraft(draftFromLine(editingLine, stock))
  }, [editingLine, stock])

  const editPreview = useMemo(() => {
    if (!editingLine) return null
    const patch = lineFromDraft(editingLine.medicineName, editDraft, stock, editingLine)
    const preview: OrderLine = { ...editingLine, ...patch }
    return {
      taxable: lineTaxable(preview),
      subtotal: lineSubtotal(preview),
      pricePerUnit: preview.pricePerUnit,
    }
  }, [editingLine, editDraft, stock])

  const newLinePreview = useMemo(() => {
    const stockItem = findStockBatch(stock, newName, newBatch) ?? newMedicineBatches[0]
    if (!stockItem) return null
    const qty = Math.max(1, newQty)
    const line: OrderLine = {
      id: "preview",
      medicineName: newName,
      quantity: qty,
      batch: stockItem.batch,
      pricePerUnit: stockItem.sellingPrice,
      gst: stockItem.gst,
    }
    return { taxable: lineTaxable(line), subtotal: lineSubtotal(line) }
  }, [stock, newName, newBatch, newQty, newMedicineBatches])

  if (!order) {
    return (
      <div className="panel mx-auto max-w-xl p-8 text-center">
        <h1 className="font-display text-2xl text-ink">Order not found</h1>
        <Button className="mt-4" asChild>
          <Link to="/app/orders/franchise">Back to list</Link>
        </Button>
      </div>
    )
  }

  const totals = orderTotals(order.lines)
  const orderId = order.id
  const canAddLines = !order.dispatched

  function openEdit(line: OrderLine) {
    setEditLineId(line.id)
    setEditDraft(draftFromLine(line, stock))
  }

  function saveEdit() {
    if (!editingLine) return
    if (!editDraft.batch) {
      toast.error("Select a batch from stock")
      return
    }
    const stockItem = findStockBatch(stock, editingLine.medicineName, editDraft.batch)
    if (!stockItem) {
      toast.error("Selected batch is not available in stock")
      return
    }
    if (editDraft.quantity > stockItem.qty) {
      toast.error(`Only ${stockItem.qty} units available in batch ${stockItem.batch}`)
      return
    }
    updateLine(
      orderId,
      editingLine.id,
      lineFromDraft(editingLine.medicineName, editDraft, stock, editingLine),
    ).then(() => {
      setEditLineId(null)
      toast.success("Line updated")
    })
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title={meta.title}
        description={`${order.franchiseName} · #${order.id}`}
        crumbs={meta.crumbs}
        actions={
          canAddLines ? (
            <Button onClick={() => setAddOpen(true)}>
              <Plus className="size-4" /> Add medicine
            </Button>
          ) : null
        }
      />

      <GlassPanel className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>S No</TableHead>
              <TableHead>Medicine name</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Batch</TableHead>
              <TableHead>Price / unit</TableHead>
              <TableHead>Taxable</TableHead>
              <TableHead>Sub total</TableHead>
              <TableHead className="sticky right-0 w-28 bg-brand text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {order.lines.map((line, i) => (
              <TableRow key={line.id} className="group">
                <TableCell className="font-mono text-xs">{i + 1}</TableCell>
                <TableCell className="max-w-xs font-medium">{line.medicineName}</TableCell>
                <TableCell className="font-mono text-xs">{line.quantity}</TableCell>
                <TableCell className="font-mono text-xs">{line.batch || "—"}</TableCell>
                <TableCell className="font-mono text-xs">{line.pricePerUnit.toFixed(2)}</TableCell>
                <TableCell className="font-mono text-xs">{lineTaxable(line).toFixed(2)}</TableCell>
                <TableCell className="font-mono text-xs">{lineSubtotal(line).toFixed(2)}</TableCell>
                <TableCell className="sticky right-0 bg-white group-hover:bg-canvas">
                  <div className="flex items-center justify-end gap-1">
                    <Button size="icon-sm" variant="glass" aria-label="Edit line" onClick={() => openEdit(line)}>
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="glass"
                      aria-label="Delete line"
                      onClick={() => removeLine(orderId, line.id)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="flex flex-col items-end gap-1 border-t border-line px-5 py-4 font-mono text-sm">
          <p>Total taxable amount: {formatInrPlain(totals.taxable)}</p>
          <p className="font-semibold">Total sub-total: {formatInrPlain(totals.subtotal)}</p>
        </div>
      </GlassPanel>

      <div className="flex justify-end">
        <Button
          size="lg"
          disabled={order.approved || order.rejected}
          onClick={() => {
            void (async () => {
              const result = await approveOrder(
                orderId,
                order.lines,
                order.billNumber,
                order.billDate || new Date().toLocaleDateString("en-GB").replace(/\//g, "-"),
                order.invoiceNote,
              )
              if (!result.ok) {
                toast.error(result.message)
                return
              }
              toast.success("Order approved")
              navigate("/app/orders/franchise")
            })()
          }}
        >
          {order.approved ? "Already approved" : order.rejected ? "Rejected" : "Approve order"}
        </Button>
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add medicine</DialogTitle>
            <DialogDescription>Choose medicine, batch from live stock, and quantity.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Medicine</Label>
              <Select value={newName} onValueChange={setNewName}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[...new Set(stock.map((s) => s.name))].map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Batch</Label>
              <Select value={newBatch} onValueChange={setNewBatch} disabled={!newMedicineBatches.length}>
                <SelectTrigger>
                  <SelectValue placeholder="Select batch" />
                </SelectTrigger>
                <SelectContent>
                  {newMedicineBatches.map((item) => (
                    <SelectItem key={item.id} value={item.batch}>
                      {item.batch} · {item.qty} in stock · exp {item.expiry}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Quantity</Label>
              <Input
                type="number"
                min={1}
                value={newQty}
                onChange={(e) => setNewQty(Number(e.target.value))}
              />
            </div>
            {newLinePreview ? (
              <div className="rounded-xl border border-line bg-canvas px-4 py-3 font-mono text-sm">
                <p>Taxable: {newLinePreview.taxable.toFixed(2)}</p>
                <p className="font-semibold">Sub total: {newLinePreview.subtotal.toFixed(2)}</p>
              </div>
            ) : null}
            <Button
              className="w-full"
              disabled={!newBatch}
              onClick={() => {
                const stockItem = findStockBatch(stock, newName, newBatch)
                if (!stockItem) {
                  toast.error("Select a valid batch")
                  return
                }
                const qty = Math.max(1, newQty)
                if (qty > stockItem.qty) {
                  toast.error(`Only ${stockItem.qty} units available in batch ${stockItem.batch}`)
                  return
                }
                addLine(orderId, {
                  id: `add-${Date.now()}`,
                  medicineName: newName,
                  quantity: qty,
                  batch: stockItem.batch,
                  pricePerUnit: stockItem.sellingPrice,
                  gst: stockItem.gst,
                })
                setAddOpen(false)
                toast.success("Line added")
              }}
            >
              Add to order
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editLineId} onOpenChange={(open) => !open && setEditLineId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit line</DialogTitle>
            <DialogDescription>
              Update quantity and batch. Taxable and sub-total recalculate automatically.
            </DialogDescription>
          </DialogHeader>
          {editingLine ? (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Medicine</Label>
                <Input value={editingLine.medicineName} readOnly className="bg-canvas" />
              </div>
              <div className="space-y-1.5">
                <Label>Batch</Label>
                <Select
                  value={editDraft.batch}
                  onValueChange={(batch) => setEditDraft((d) => ({ ...d, batch }))}
                  disabled={!editBatches.length}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select batch" />
                  </SelectTrigger>
                  <SelectContent>
                    {editBatches.map((item) => (
                      <SelectItem key={item.id} value={item.batch}>
                        {item.batch} · {item.qty} in stock · exp {item.expiry}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Quantity</Label>
                <Input
                  type="number"
                  min={1}
                  value={editDraft.quantity}
                  onChange={(e) =>
                    setEditDraft((d) => ({ ...d, quantity: Math.max(1, Number(e.target.value) || 1) }))
                  }
                />
              </div>
              {editPreview ? (
                <div className="rounded-xl border border-line bg-canvas px-4 py-3 font-mono text-sm">
                  <p>Price / unit: {editPreview.pricePerUnit.toFixed(2)}</p>
                  <p>Taxable: {editPreview.taxable.toFixed(2)}</p>
                  <p className="font-semibold">Sub total: {editPreview.subtotal.toFixed(2)}</p>
                </div>
              ) : null}
              <Button className="w-full" disabled={!editDraft.batch} onClick={saveEdit}>
                Save changes
              </Button>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
