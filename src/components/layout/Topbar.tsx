"use client"

import { useState } from "react"
import { Link, useLocation, useNavigate } from "@/lib/navigation"
import { ChevronDown, ChevronRight, LogOut, Menu, Search, Store, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { BrandMark } from "@/components/layout/SkipLink"
import { SidebarNav } from "@/components/layout/SidebarNav"
import { getRouteMeta } from "@/lib/routeMeta"

export function Topbar() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const meta = getRouteMeta(pathname)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")

  return (
    <header className="sticky top-0 z-40 shrink-0 border-b border-line bg-white/95 backdrop-blur-sm">
      <div className="flex h-14 items-center gap-3 px-3 sm:px-4">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          aria-label="Open menu"
          onClick={() => setOpen(true)}
        >
          <Menu className="size-4" />
        </Button>

        <nav aria-label="Breadcrumb" className="hidden min-w-0 flex-1 items-center gap-1 text-xs text-steel md:flex">
          {meta.crumbs.map((crumb, i) => (
            <span key={`${crumb.label}-${i}`} className="inline-flex min-w-0 items-center gap-1">
              {i > 0 ? <ChevronRight className="size-3 shrink-0 opacity-60" aria-hidden /> : null}
              {crumb.to ? (
                <Link to={crumb.to} className="truncate transition-colors hover:text-navy">
                  {crumb.label}
                </Link>
              ) : (
                <span className="truncate font-medium text-ink">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>

        <Link to="/" className="flex items-center gap-2 md:hidden">
          <BrandMark />
          <span className="font-display text-base text-ink">Mediculous</span>
        </Link>

        <div className="relative ml-auto hidden w-full max-w-xs lg:block">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-steel" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search console…"
            className="h-9 pl-9"
            aria-label="Search console"
            onKeyDown={(e) => {
              if (e.key === "Enter" && query.trim()) navigate(`/app/medicines?q=${encodeURIComponent(query.trim())}`)
            }}
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="gel" size="sm" className="shrink-0">
              <User className="size-4" />
              <span className="hidden sm:inline">Ayan</span>
              <ChevronDown className="size-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => navigate("/app")}>Dashboard</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => navigate("/app/franchises")}>
              <Store className="mr-2 size-4" /> Franchises
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => navigate("/")}>
              <LogOut className="mr-2 size-4" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto border-ink bg-ink p-0 text-white [&>button]:text-sky [&>button]:hover:bg-white/10">
          <DialogHeader className="border-b border-white/10 px-4 py-3">
            <DialogTitle className="text-white">Navigate</DialogTitle>
          </DialogHeader>
          <SidebarNav onNavigate={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </header>
  )
}
