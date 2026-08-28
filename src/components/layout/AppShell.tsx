"use client"

import { usePathname } from "next/navigation"
import type { ReactNode } from "react"
import { AuroraField } from "@/components/layout/AuroraField"
import { DataErrorBanner } from "@/components/layout/DataErrorBanner"
import { SkipLink } from "@/components/layout/SkipLink"
import { Navbar } from "@/components/layout/Navbar"

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="relative min-h-svh overflow-x-clip">
      <AuroraField />
      <SkipLink />
      <Navbar />
      <main id="main" className="relative px-4 py-6 pb-16 sm:px-6">
        <div key={pathname} className="animate-fade-up mx-auto max-w-[1400px] space-y-5">
          <DataErrorBanner />
          {children}
        </div>
      </main>
    </div>
  )
}
