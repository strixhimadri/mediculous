"use client"

import { ProtectedRoute } from "@/components/auth/ProtectedRoute"
import { InventoryShell } from "@/views/inventory/InventoryShell"

export default function InventoryProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute roles={["retailer"]} redirectTo="/inventory/login">
      <InventoryShell>{children}</InventoryShell>
    </ProtectedRoute>
  )
}
