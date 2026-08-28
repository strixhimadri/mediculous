"use client"

import { useMemo, useState } from "react"
import { Link, useNavigate } from "@/lib/navigation"
import { Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { GlassPanel } from "@/components/layout/GlassPanel"
import { PageHeader } from "@/components/layout/PageHeader"
import { useAppState } from "@/context/AppState"
import { useCart } from "@/context/CartContext"
import { formatInrPlain } from "@/lib/format"

export function CartPage() {
  const navigate = useNavigate()
  const { items, updateQty, removeItem, clear } = useCart()
  const { submitOrder } = useAppState()
  const [submitting, setSubmitting] = useState(false)

  const total = useMemo(
    () =>
      items.reduce(
        (sum, item) => sum + item.quantity * item.sellingPrice * (1 + item.gst / 100),
        0,
      ),
    [items],
  )

  async function handleSubmit() {
    if (!items.length) {
      toast.error("Cart is empty")
      return
    }
    setSubmitting(true)
    try {
      const orderId = await submitOrder(
        items.map((i) => ({ medicineName: i.medicineName, quantity: i.quantity })),
      )
      clear()
      toast.success(`Order #${orderId.slice(0, 8)} submitted for approval`)
      navigate("/shop/orders")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not submit order")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Your cart"
        description="Submit when ready — admin will review and approve before dispatch."
        actions={
          <Button variant="glass" asChild>
            <Link to="/shop">Continue shopping</Link>
          </Button>
        }
      />

      <GlassPanel className="overflow-hidden">
        {items.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm text-ink-soft">Your cart is empty.</p>
            <Button className="mt-4" asChild>
              <Link to="/shop">Browse catalog</Link>
            </Button>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Medicine</TableHead>
                  <TableHead>Pack</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Line total</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => {
                  const lineTotal = item.quantity * item.sellingPrice * (1 + item.gst / 100)
                  return (
                    <TableRow key={item.medicineName}>
                      <TableCell className="max-w-xs font-medium">{item.medicineName}</TableCell>
                      <TableCell className="font-mono text-xs">{item.packSize}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={1}
                          className="w-20"
                          value={item.quantity}
                          onChange={(e) => updateQty(item.medicineName, Number(e.target.value))}
                        />
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {formatInrPlain(item.sellingPrice)}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{formatInrPlain(lineTotal)}</TableCell>
                      <TableCell>
                        <Button
                          size="icon-sm"
                          variant="glass"
                          aria-label="Remove"
                          onClick={() => removeItem(item.medicineName)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
            <div className="flex flex-col items-end gap-3 border-t border-line px-5 py-4">
              <p className="font-mono text-sm font-semibold">Estimated total: {formatInrPlain(total)}</p>
              <Button size="lg" onClick={handleSubmit} disabled={submitting}>
                {submitting ? "Submitting…" : "Submit order"}
              </Button>
            </div>
          </>
        )}
      </GlassPanel>
    </div>
  )
}
