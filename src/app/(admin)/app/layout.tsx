"use client"

import { ProtectedRoute } from "@/components/auth/ProtectedRoute"
import { AppShell } from "@/components/layout/AppShell"
import { AppStateProvider } from "@/context/AppState"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute roles={["admin"]}>
      <AppStateProvider>
        <AppShell>{children}</AppShell>
      </AppStateProvider>
    </ProtectedRoute>
  )
}
