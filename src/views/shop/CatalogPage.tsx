"use client"

import { useMemo, useState } from "react"
import { Link } from "@/lib/navigation"
import { Plus, Search } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { GlassPanel } from "@/components/layout/GlassPanel"
import { PageHeader } from "@/components/layout/PageHeader"
import { PaginationBar } from "@/components/layout/PaginationBar"
import { useAppState } from "@/context/AppState"
import { useCart } from "@/context/CartContext"
import { formatInrPlain } from "@/lib/format"

const PAGE_SIZE = 20

export function CatalogPage() {
  const { catalog, loading } = useAppState()
  const { addItem } = useCart()
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [qtyByMed, setQtyByMed] = useState<Record<string, number>>({})

  const aggregated = useMemo(() => {
    const map = new Map<
      string,
      { name: string; packSize: string; sellingPrice: number; gst: number; qty: number }
    >()
    for (const row of catalog) {
      const existing = map.get(row.name)
      if (existing) {
        existing.qty += row.qty
      } else {
        map.set(row.name, {
          name: row.name,
          packSize: row.packSize,
          sellingPrice: row.sellingPrice,
          gst: row.gst,
          qty: row.qty,
        })
      }
    }
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name))
  }, [catalog])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return aggregated
    return aggregated.filter((r) => r.name.toLowerCase().includes(q))
  }, [aggregated, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function handleAdd(name: string, row: (typeof aggregated)[0]) {
    const qty = Math.max(1, qtyByMed[name] ?? 1)
    if (qty > row.qty) {
      toast.error(`Only ${row.qty} units available`)
      return
    }
    addItem({
      medicineName: name,
      quantity: qty,
      sellingPrice: row.sellingPrice,
      gst: row.gst,
      packSize: row.packSize,
    })
    toast.success(`Added ${name} to cart`)
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Medicine catalog"
        description="Available medicines from your wholesaler. Prices include GST rate shown per line."
        actions={
          <Button asChild>
            <Link to="/shop/cart">View cart</Link>
          </Button>
        }
      />

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-soft" />
        <Input
          className="pl-9"
          placeholder="Search medicines…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
        />
      </div>

      <GlassPanel className="overflow-hidden">
        {loading ? (
          <p className="p-8 text-center text-sm text-ink-soft">Loading catalog…</p>
        ) : filtered.length === 0 ? (
          <p className="p-8 text-center text-sm text-ink-soft">No medicines available right now.</p>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Medicine</TableHead>
                  <TableHead>Pack</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>GST</TableHead>
                  <TableHead>Available</TableHead>
                  <TableHead className="text-right">Order</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageRows.map((row) => (
                  <TableRow key={row.name}>
                    <TableCell className="max-w-xs font-medium">{row.name}</TableCell>
                    <TableCell className="font-mono text-xs">{row.packSize}</TableCell>
                    <TableCell className="font-mono text-xs">{formatInrPlain(row.sellingPrice)}</TableCell>
                    <TableCell className="font-mono text-xs">{row.gst}%</TableCell>
                    <TableCell className="font-mono text-xs">{row.qty}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Input
                          type="number"
                          min={1}
                          max={row.qty}
                          className="w-20"
                          value={qtyByMed[row.name] ?? 1}
                          onChange={(e) =>
                            setQtyByMed((prev) => ({
                              ...prev,
                              [row.name]: Number(e.target.value),
                            }))
                          }
                        />
                        <Button size="sm" onClick={() => handleAdd(row.name, row)}>
                          <Plus className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <PaginationBar
              page={page}
              pages={totalPages}
              from={filtered.length ? (page - 1) * PAGE_SIZE + 1 : 0}
              to={Math.min(page * PAGE_SIZE, filtered.length)}
              total={filtered.length}
              onPage={setPage}
            />
          </>
        )}
      </GlassPanel>
    </div>
  )
}
