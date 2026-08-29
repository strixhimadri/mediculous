"use client"

import { useCallback, useEffect, useState } from "react"
import { Pencil } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { GlassPanel } from "@/components/layout/GlassPanel"
import { PageHeader } from "@/components/layout/PageHeader"
import { useAuth } from "@/context/AuthContext"
import * as api from "@/lib/db/api"
import type { DbRetailerInventory } from "@/types/database"

function formatDate(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString("en-GB")
}

export function InventoryListPage() {
  const { user } = useAuth()
  const [rows, setRows] = useState<DbRetailerInventory[]>([])
  const [loading, setLoading] = useState(true)
  const [edit, setEdit] = useState<{ id: string; shelf: string; qty: number } | null>(null)

  const load = useCallback(async () => {
    if (!user?.franchiseId) return
    setLoading(true)
    try {
      const data = await api.fetchRetailerInventory(user.franchiseId)
      setRows(data as DbRetailerInventory[])
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load inventory")
    } finally {
      setLoading(false)
    }
  }, [user?.franchiseId])

  useEffect(() => {
    void load()
  }, [load])

  async function saveEdit() {
    if (!edit) return
    const snapshot = rows
    setRows((prev) =>
      prev.map((row) =>
        row.id === edit.id ? { ...row, shelf: edit.shelf, qty: edit.qty } : row,
      ),
    )
    setEdit(null)
    try {
      const shelfItem = await api.updateRetailerInventoryShelf(edit.id, edit.shelf)
      const qtyItem = await api.updateRetailerInventoryQty(edit.id, edit.qty)
      setRows((prev) =>
        prev.map((row) =>
          row.id === edit.id
            ? { ...row, ...(qtyItem as DbRetailerInventory), ...(shelfItem as DbRetailerInventory) }
            : row,
        ),
      )
      toast.success("Updated")
    } catch (err) {
      setRows(snapshot)
      toast.error(err instanceof Error ? err.message : "Update failed")
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Your inventory"
        description="Medicines received after wholesaler dispatch. Adjust shelf and quantity as you sell or count stock."
      />

      <GlassPanel className="overflow-hidden">
        {loading ? (
          <p className="p-8 text-center text-sm text-ink-soft">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="p-8 text-center text-sm text-ink-soft">
            No inventory yet. Items appear here after your wholesaler dispatches an order.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Medicine</TableHead>
                <TableHead>Batch</TableHead>
                <TableHead>Expiry</TableHead>
                <TableHead>Shelf</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead className="w-16" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="max-w-xs font-medium">{row.name}</TableCell>
                  <TableCell className="font-mono text-xs">{row.batch}</TableCell>
                  <TableCell className="font-mono text-xs">{formatDate(row.expiry)}</TableCell>
                  <TableCell className="font-mono text-xs">{row.shelf || "—"}</TableCell>
                  <TableCell className="font-mono text-xs">{row.qty}</TableCell>
                  <TableCell>
                    <Button
                      size="icon-sm"
                      variant="glass"
                      aria-label="Edit"
                      onClick={() =>
                        setEdit({ id: row.id, shelf: row.shelf, qty: row.qty })
                      }
                    >
                      <Pencil className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </GlassPanel>

      <Dialog open={!!edit} onOpenChange={() => setEdit(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit item</DialogTitle>
          </DialogHeader>
          {edit ? (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Shelf</Label>
                <Input value={edit.shelf} onChange={(e) => setEdit({ ...edit, shelf: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Quantity</Label>
                <Input
                  type="number"
                  min={0}
                  value={edit.qty}
                  onChange={(e) => setEdit({ ...edit, qty: Number(e.target.value) })}
                />
              </div>
              <Button className="w-full" onClick={() => void saveEdit()}>
                Save
              </Button>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
