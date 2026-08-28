"use client"

import type { ReactNode } from "react"
import { LogOut, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AuroraField } from "@/components/layout/AuroraField"
import { BrandMark, SkipLink } from "@/components/layout/SkipLink"
import { useAuth } from "@/context/AuthContext"
import { useNavigate } from "@/lib/navigation"

export function InventoryShell({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="relative min-h-svh overflow-x-clip">
      <AuroraField />
      <SkipLink />
      <header className="sticky top-3 z-50 px-3 sm:px-4">
        <div className="mx-auto max-w-[1200px] rounded-full border border-line bg-white px-4 py-2 shadow-[var(--shadow-md)]">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <BrandMark className="size-8" />
              <span className="font-display text-lg text-ink">My Stock</span>
              <Package className="size-4 text-ink-soft" />
            </div>
            <div className="ml-auto flex items-center gap-2">
              <span className="hidden text-sm text-ink-soft sm:inline">
                {user?.displayName ?? user?.email}
              </span>
              <Button
                variant="glass"
                size="sm"
                onClick={async () => {
                  await signOut()
                  navigate("/login")
                }}
              >
                <LogOut className="size-4" /> Sign out
              </Button>
            </div>
          </div>
        </div>
      </header>
      <main id="main" className="relative mx-auto max-w-[1200px] px-4 py-6 sm:px-6">
        {children}
      </main>
    </div>
  )
}
