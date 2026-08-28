import type { ReactNode } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function TableToolbar({
  pageSize,
  onPageSize,
  query,
  onQuery,
  children,
}: {
  pageSize: number
  onPageSize: (n: number) => void
  query: string
  onQuery: (q: string) => void
  children?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-center gap-2">
        <Label htmlFor="page-size">Show</Label>
        <Select value={String(pageSize)} onValueChange={(v) => onPageSize(Number(v))}>
          <SelectTrigger id="page-size" className="w-24">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[10, 25, 50].map((n) => (
              <SelectItem key={n} value={String(n)}>
                {n}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-ink-soft">entries</span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {children}
        <div className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-soft" />
          <Input
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="Search"
            className="pl-9"
            aria-label="Search table"
          />
        </div>
      </div>
    </div>
  )
}
