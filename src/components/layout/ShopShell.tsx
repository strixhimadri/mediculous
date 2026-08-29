"use client"

import type { ReactNode } from "react"
import { AuroraField } from "@/components/layout/AuroraField"
import { AppDataGate } from "@/components/layout/AppDataGate"
import { DataErrorBanner } from "@/components/layout/DataErrorBanner"
import { SkipLink } from "@/components/layout/SkipLink"
import { RetailerNavbar } from "@/components/layout/RetailerNavbar"

export function ShopShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-svh overflow-x-clip">
      <AuroraField />
      <SkipLink />
      <RetailerNavbar />
      <main id="main" className="relative px-4 py-6 pb-16 sm:px-6">
        <div className="mx-auto max-w-[1200px] space-y-5">
          <DataErrorBanner />
          <AppDataGate>{children}</AppDataGate>
        </div>
      </main>
    </div>
  )
}
