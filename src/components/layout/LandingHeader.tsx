"use client"

import { useState } from "react"
import { Link } from "@/lib/navigation"
import { ChevronDown, Menu, Search, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { BrandMark } from "@/components/layout/SkipLink"
import { cn } from "@/lib/utils"

const navLinks = [
  { href: "#home", label: "Home" },
  { href: "#about", label: "About" },
  { href: "#services", label: "Services" },
]

const navLinkClass =
  "rounded-full px-3.5 py-2 text-sm font-medium text-ink-soft transition-all duration-200 hover:bg-canvas hover:text-ink"

export function LandingHeader() {
  const [menuOpen, setMenuOpen] = useState(false)

  function closeMenu() {
    setMenuOpen(false)
  }

  return (
    <header className="sticky top-4 z-50 px-4 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="glass flex items-center gap-2 rounded-[1.75rem] px-3 py-2 sm:gap-3 sm:px-5">
          <Link to="/" className="flex min-w-0 shrink items-center gap-2 py-1 sm:gap-2.5">
            <BrandMark className="shrink-0" />
            <div className="min-w-0 leading-tight">
              <span className="font-display block truncate text-base text-ink">Mediculous</span>
              <span className="hidden text-[11px] font-medium text-ink-soft min-[734px]:block">
                Wholesale operations software
              </span>
            </div>
          </Link>

          <nav
            aria-label="Primary"
            className="hidden min-w-0 flex-1 items-center justify-center min-[734px]:flex"
          >
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} className={navLinkClass}>
                {link.label}
              </a>
            ))}
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="hidden min-[734px]:inline-flex"
              aria-label="Search"
            >
              <Search className="size-4" />
            </Button>
            <Button variant="peach" size="sm" className="hidden min-[734px]:inline-flex" asChild>
              <Link to="/login">Sign in</Link>
            </Button>
            <Button size="sm" className="hidden min-[734px]:inline-flex" asChild>
              <Link to="/app">
                <Sparkles className="size-3.5" />
                Get started
                <ChevronDown className="size-3.5 -rotate-90" />
              </Link>
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-ink hover:bg-canvas min-[734px]:hidden"
              aria-label="Open menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(true)}
            >
              <Menu className="size-5" />
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={menuOpen} onOpenChange={setMenuOpen}>
        <DialogContent className="max-h-[85vh] gap-0 overflow-hidden p-0 sm:max-w-sm">
          <DialogHeader className="border-b border-line px-5 py-4">
            <DialogTitle className="font-display text-lg">Menu</DialogTitle>
          </DialogHeader>
          <nav aria-label="Mobile" className="flex flex-col gap-1 p-3">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={cn(navLinkClass, "block rounded-xl px-4 py-3 text-base text-ink")}
                onClick={closeMenu}
              >
                {link.label}
              </a>
            ))}
            <div className="my-2 border-t border-line" />
            <Button variant="peach" className="w-full justify-center" asChild>
              <Link to="/login" onClick={closeMenu}>
                Sign in
              </Link>
            </Button>
            <Button className="w-full justify-center" asChild>
              <Link to="/app" onClick={closeMenu}>
                <Sparkles className="size-4" />
                Get started
              </Link>
            </Button>
          </nav>
        </DialogContent>
      </Dialog>
    </header>
  )
}
