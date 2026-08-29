"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { GlassPanel } from "@/components/layout/GlassPanel"
import { PageHeader } from "@/components/layout/PageHeader"
import { PaginationBar } from "@/components/layout/PaginationBar"
import { TableShell, TableToolbar, usePagedRows } from "@/components/layout/TableShell"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { fetchDevAudit } from "@/lib/api/http"
import { getRouteMeta } from "@/lib/routeMeta"

type AuditRow = {
  id: string
  actorId: string | null
  action: string
  entityType: string
  entityId: string | null
  createdAt: string
}

export function DevAuditPage() {
  const meta = getRouteMeta("/app/dev/audit")
  const [rows, setRows] = useState<AuditRow[]>([])
  const [loading, setLoading] = useState(true)
  const page = usePagedRows(rows, 50)

  useEffect(() => {
    void (async () => {
      try {
        const data = await fetchDevAudit()
        setRows(data)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not load audit log")
      } finally {
        setLoading(false)
      }
    })()
  }, [])

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
        <Table className="min-w-[720px]">
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>Actor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="py-12 text-center">
                  <Loader2 className="mx-auto size-6 animate-spin text-ink-soft" />
                </TableCell>
              </TableRow>
            ) : page.slice.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-12 text-center text-sm text-ink-soft">
                  No audit events yet
                </TableCell>
              </TableRow>
            ) : (
              page.slice.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-mono text-xs">
                    {new Date(row.createdAt).toLocaleString("en-IN")}
                  </TableCell>
                  <TableCell className="text-sm">{row.action}</TableCell>
                  <TableCell className="font-mono text-xs">
                    {row.entityType}
                    {row.entityId ? ` · ${row.entityId.slice(0, 8)}…` : ""}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{row.actorId?.slice(0, 8) ?? "—"}…</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableShell>
    </div>
  )
}
