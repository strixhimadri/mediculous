"use client"

import { useState } from "react"
import { Pencil } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TableShell, TableToolbar, usePagedRows } from "@/components/layout/TableShell"
import { PaginationBar } from "@/components/layout/PaginationBar"
import { PageHeader } from "@/components/layout/PageHeader"
import { useAppState } from "@/context/AppState"
import { getRouteMeta } from "@/lib/routeMeta"

export function ShelfPage() {
  const { stock, updateShelf } = useAppState()
  const page = usePagedRows(stock, 25)
  const [edit, setEdit] = useState<{ id: string; shelf: string } | null>(null)
  const meta = getRouteMeta("/app/shelf")

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
              <TableHead>S No</TableHead>
              <TableHead>Medicine</TableHead>
              <TableHead>Batch</TableHead>
              <TableHead>Qty</TableHead>
              <TableHead>Shelf</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {page.slice.map((row, i) => (
              <TableRow key={row.id}>
                <TableCell className="font-mono text-xs">{(page.page - 1) * page.pageSize + i + 1}</TableCell>
                <TableCell className="font-medium">{row.name}</TableCell>
                <TableCell className="font-mono text-xs">{row.batch}</TableCell>
                <TableCell>{row.qty.toLocaleString("en-IN")}</TableCell>
                <TableCell>
                  <Button size="sm" variant="glass" onClick={() => setEdit({ id: row.id, shelf: row.shelf })}>
                    {row.shelf} <Pencil className="size-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableShell>
      <Dialog open={!!edit} onOpenChange={() => setEdit(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move batch</DialogTitle>
          </DialogHeader>
          <Input value={edit?.shelf ?? ""} onChange={(e) => setEdit((s) => (s ? { ...s, shelf: e.target.value } : s))} />
          <Button
            className="mt-3"
            onClick={() => {
              if (edit) void updateShelf(edit.id, edit.shelf).then(() => setEdit(null))
              setEdit(null)
              toast.success("Shelf saved")
            }}
          >
            Save
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}
