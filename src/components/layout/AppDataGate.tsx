"use client"

import type { ReactNode } from "react"
import { useAppState } from "@/context/AppState"

export function AppDataGate({ children }: { children: ReactNode }) {
  const { loading } = useAppState()

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-pulse rounded-full bg-canvas" aria-label="Loading data" />
      </div>
    )
  }

  return children
}
