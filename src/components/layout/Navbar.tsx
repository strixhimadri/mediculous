"use client"

import { useState } from "react"
import { Link, NavLink, useLocation, useNavigate } from "@/lib/navigation"
import {
  BarChart3,
  Code2,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Store,
  User,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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

const navItemClass = (isActive: boolean) =>
  cn(
    "relative rounded-full px-3 py-2 text-xs font-semibold tracking-wide uppercase transition-all duration-200",
    isActive ? "bg-brand text-white shadow-sm hover:bg-brand-hover" : "text-ink-soft hover:bg-brand/10 hover:text-brand",
  )

const linkClass = ({ isActive }: { isActive: boolean }) => navItemClass(isActive)

const mobileLinks = [
  { to: "/app", label: "Dashboard" },
  { to: "/app/medicines", label: "List stock" },
  { to: "/app/medicines/expiry", label: "Expiry alert" },
  { to: "/app/medicines/expired", label: "Expired product" },
  { to: "/app/orders/franchise", label: "Franchise order" },
  { to: "/app/franchises", label: "List franchise" },
  { to: "/app/reports", label: "Sales report" },
]

const mobileDevLinks = [
  { to: "/app/dev/users", label: "Dev — Users" },
  { to: "/app/dev/audit", label: "Dev — Audit log" },
  { to: "/app/dev/health", label: "Dev — Health" },
]

export function Navbar() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  const medicinesOn = pathname.startsWith("/app/medicines")
  const ordersOn = pathname.startsWith("/app/orders") || pathname.startsWith("/app/franchises")
  const reportsOn = pathname.startsWith("/app/reports")
  const devOn = pathname.startsWith("/app/dev")

  return (
    <header className="sticky top-3 z-50 px-3 sm:px-4">
      <div className="mx-auto max-w-[1400px] rounded-full border border-line bg-white px-3 py-2 shadow-[var(--shadow-md)] sm:px-4">
        <div className="flex items-center gap-2">
        <NavLink to="/" className="flex min-w-0 shrink items-center gap-2 py-1 pr-2">
          <BrandMark className="size-8 shrink-0 border-line" />
          <span className="truncate font-display text-base tracking-tight text-ink sm:text-lg">Mediculous</span>
        </NavLink>

        <nav aria-label="Console" className="hidden min-w-0 flex-1 items-center justify-center gap-0.5 min-[734px]:flex">
          <NavLink to="/app" end className={linkClass}>
            <span className="inline-flex items-center gap-1.5">
              <LayoutDashboard className="size-3.5" /> Dashboard
            </span>
          </NavLink>

          <DropdownMenu>
            <DropdownMenuTrigger className={navItemClass(medicinesOn)}>
              <span className="inline-flex items-center gap-1">
                <Package className="size-3.5" /> Medicines <ChevronDown className="size-3" />
              </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem asChild>
                <Link to="/app/medicines">List stock</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/app/medicines/expiry">Expiry alert</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/app/medicines/expired">Expired product</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger className={navItemClass(ordersOn)}>
              <span className="inline-flex items-center gap-1">
                Order <ChevronDown className="size-3" />
              </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem asChild>
                <Link to="/app/orders/franchise">Franchise order</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/app/franchises">List franchise</Link>
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                Hospital order <span className="ml-auto text-[10px] uppercase text-steel">Soon</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger className={navItemClass(reportsOn)}>
              <span className="inline-flex items-center gap-1">
                <BarChart3 className="size-3.5" /> Report <ChevronDown className="size-3" />
              </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem asChild>
                <Link to="/app/reports">Sales report</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/app/medicines/expiry">Expiry report</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {user?.isSuperAdmin ? (
            <DropdownMenu>
              <DropdownMenuTrigger className={navItemClass(devOn)}>
                <span className="inline-flex items-center gap-1">
                  <Code2 className="size-3.5" /> Dev <ChevronDown className="size-3" />
                </span>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem asChild>
                  <Link to="/app/dev/users">Users</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/app/dev/audit">Audit log</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/app/dev/health">Health</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="text-ink hover:bg-canvas min-[734px]:hidden"
            aria-label="Open menu"
            onClick={() => setOpen(true)}
          >
            <Menu className="size-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="peach" size="sm" className="hidden border-line text-ink min-[734px]:inline-flex">
                <User className="size-4" />
                <span className="hidden sm:inline">{user?.displayName ?? user?.email ?? "Admin"}</span>
                <ChevronDown className="size-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link to="/app">Console</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/app/franchises">
                  <Store className="mr-2 size-4" /> Franchises
                </Link>
              </DropdownMenuItem>
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Navigate</DialogTitle>
          </DialogHeader>
          <nav className="grid gap-1">
            {mobileLinks.map((item) => (
              <Button key={item.to} variant="glass" className="justify-start" asChild>
                <Link to={item.to} onClick={() => setOpen(false)}>
                  {item.label}
                </Link>
              </Button>
            ))}
            {user?.isSuperAdmin ? (
              <>
                <div className="my-2 border-t border-line" />
                <p className="px-2 text-[10px] font-semibold uppercase tracking-wide text-steel">Developer</p>
                {mobileDevLinks.map((item) => (
                  <Button key={item.to} variant="glass" className="justify-start" asChild>
                    <Link to={item.to} onClick={() => setOpen(false)}>
                      {item.label}
                    </Link>
                  </Button>
                ))}
              </>
            ) : null}
            <div className="my-2 border-t border-line" />
            <Button variant="glass" className="justify-start" asChild>
              <Link to="/app/franchises" onClick={() => setOpen(false)}>
                <Store className="mr-2 size-4" /> Franchises
              </Link>
            </Button>
            <Button
              variant="glass"
              className="justify-start"
              onClick={async () => {
                setOpen(false)
                await signOut()
                navigate("/login")
              }}
            >
              <LogOut className="mr-2 size-4" /> Sign out
            </Button>
          </nav>
        </DialogContent>
      </Dialog>
    </header>
  )
}
