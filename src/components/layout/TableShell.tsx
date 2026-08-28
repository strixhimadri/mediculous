"use client"

import { useMemo, useState, type ReactNode } from "react"
import { GlassPanel } from "@/components/layout/GlassPanel"

export function usePagedRows<T>(rows: T[], initialSize = 25, initialQuery = "") {
  const [pageSize, setPageSize] = useState(initialSize)
  const [page, setPage] = useState(1)
  const [query, setQuery] = useState(initialQuery)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((row) => JSON.stringify(row).toLowerCase().includes(q))
  }, [rows, query])

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, pages)
  const slice = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)

  return {
    pageSize,
    setPageSize: (n: number) => {
      setPageSize(n)
      setPage(1)
    },
    page: safePage,
    setPage,
    query,
    setQuery: (q: string) => {
      setQuery(q)
      setPage(1)
    },
    filtered,
    slice,
    pages,
  }
}

export function TableShell({
  toolbar,
  footer,
  children,
}: {
  toolbar: ReactNode
  footer: ReactNode
  children: ReactNode
}) {
  return (
    <GlassPanel className="overflow-hidden">
      <div className="p-4">{toolbar}</div>
      {children}
      {footer}
    </GlassPanel>
  )
}

export { TableToolbar } from "@/components/layout/TableToolbar"
