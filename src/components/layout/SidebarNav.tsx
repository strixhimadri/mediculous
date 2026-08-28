"use client"

import { useState } from "react"
import { NavLink, useLocation } from "@/lib/navigation"
import {
  BarChart3,
  ChevronDown,
  LayoutDashboard,
} from "lucide-react"
import { cn } from "@/lib/utils"

const linkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "flex min-h-10 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors duration-150",
    isActive ? "bg-navy text-white shadow-sm" : "text-sky hover:bg-white/10 hover:text-white",
  )

const childClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "relative flex min-h-9 items-center rounded-md py-2 pl-9 pr-3 text-sm transition-colors duration-150",
    isActive ? "bg-navy text-white" : "text-sky hover:bg-white/10 hover:text-white",
  )

function NavGroup({
  label,
  open,
  onToggle,
  children,
}: {
  label: string
  open: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={onToggle}
        className="flex min-h-10 w-full items-center justify-between rounded-md px-3 text-xs font-medium tracking-wide text-sky/90 transition-colors hover:bg-white/5 hover:text-white"
        aria-expanded={open}
      >
        {label}
        <ChevronDown className={cn("size-3.5 transition-transform duration-200", open && "rotate-180")} />
      </button>
      {open ? <div className="mt-0.5 flex flex-col gap-0.5">{children}</div> : null}
    </div>
  )
}

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const { pathname } = useLocation()

  const [medicinesOpen, setMedicinesOpen] = useState(pathname.startsWith("/app/medicines"))
  const [ordersOpen, setOrdersOpen] = useState(
    pathname.startsWith("/app/orders") || pathname.startsWith("/app/franchises"),
  )

  return (
    <nav aria-label="Console" className="flex flex-col gap-0.5 p-3 pb-6">
      <NavLink to="/app" end className={linkClass} onClick={onNavigate}>
        <LayoutDashboard className="size-4 shrink-0" />
        Dashboard
      </NavLink>

      <NavGroup label="Medicines" open={medicinesOpen} onToggle={() => setMedicinesOpen((v) => !v)}>
        <NavLink to="/app/medicines" end className={childClass} onClick={onNavigate}>
          List stock
        </NavLink>
        <NavLink to="/app/medicines/expiry" className={childClass} onClick={onNavigate}>
          Expiry alert
        </NavLink>
        <NavLink to="/app/medicines/expired" className={childClass} onClick={onNavigate}>
          Expired product
        </NavLink>
      </NavGroup>

      <NavGroup label="Orders" open={ordersOpen} onToggle={() => setOrdersOpen((v) => !v)}>
        <NavLink to="/app/orders/franchise" end className={childClass} onClick={onNavigate}>
          Franchise order
        </NavLink>
        <NavLink to="/app/franchises" className={childClass} onClick={onNavigate}>
          List franchise
        </NavLink>
        <NavLink to="/app/orders/hospital" className={childClass} onClick={onNavigate}>
          Hospital order
        </NavLink>
      </NavGroup>

      <div className="mt-2 flex flex-col gap-0.5 border-t border-white/10 pt-3">
        <NavLink to="/app/reports" className={linkClass} onClick={onNavigate}>
          <BarChart3 className="size-4 shrink-0" />
          Sales report
        </NavLink>
      </div>
    </nav>
  )
}
