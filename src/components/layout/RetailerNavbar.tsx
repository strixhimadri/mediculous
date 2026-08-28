"use client"

import { NavLink, useNavigate } from "@/lib/navigation"
import { ExternalLink, LogOut, Package, ShoppingCart, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { BrandMark } from "@/components/layout/SkipLink"
import { useAuth } from "@/context/AuthContext"
import { cn } from "@/lib/utils"

const inventorySiteUrl = "/inventory"

const linkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "rounded-full px-3 py-2 text-xs font-semibold tracking-wide uppercase transition-all duration-200",
    isActive ? "bg-brand text-white shadow-sm" : "text-ink-soft hover:bg-brand/10 hover:text-brand",
  )

export function RetailerNavbar() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()

  return (
    <header className="sticky top-3 z-50 px-3 sm:px-4">
      <div className="mx-auto max-w-[1200px] rounded-full border border-line bg-white px-3 py-2 shadow-[var(--shadow-md)] sm:px-4">
        <div className="flex items-center gap-2">
          <NavLink to="/shop" className="flex min-w-0 shrink items-center gap-2 py-1 pr-2">
            <BrandMark className="size-8 shrink-0 border-line" />
            <span className="truncate font-display text-base tracking-tight text-ink sm:text-lg">
              Mediculous Shop
            </span>
          </NavLink>

          <nav aria-label="Shop" className="hidden min-w-0 flex-1 items-center justify-center gap-1 sm:flex">
            <NavLink to="/shop" end className={linkClass}>
              <span className="inline-flex items-center gap-1.5">
                <Package className="size-3.5" /> Catalog
              </span>
            </NavLink>
            <NavLink to="/shop/cart" className={linkClass}>
              <span className="inline-flex items-center gap-1.5">
                <ShoppingCart className="size-3.5" /> Cart
              </span>
            </NavLink>
            <NavLink to="/shop/orders" className={linkClass}>
              My orders
            </NavLink>
          </nav>

          <div className="ml-auto flex items-center gap-1">
            {inventorySiteUrl ? (
              <Button variant="glass" size="sm" className="hidden sm:inline-flex" asChild>
                <a href={inventorySiteUrl} target="_blank" rel="noopener noreferrer">
                  My stock <ExternalLink className="size-3.5" />
                </a>
              </Button>
            ) : null}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="peach" size="sm" className="border-line text-ink">
                  <User className="size-4" />
                  <span className="hidden max-w-[120px] truncate sm:inline">
                    {user?.displayName ?? user?.email ?? "Account"}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => navigate("/shop/orders")}>My orders</DropdownMenuItem>
                {inventorySiteUrl ? (
                  <DropdownMenuItem onSelect={() => window.open(inventorySiteUrl, "_blank")}>
                    Manage my stock
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={async () => {
                    await signOut()
                    navigate("/login")
                  }}
                >
                  <LogOut className="mr-2 size-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  )
}
