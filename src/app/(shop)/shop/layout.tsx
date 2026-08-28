"use client"

import { ProtectedRoute } from "@/components/auth/ProtectedRoute"
import { ShopShell } from "@/components/layout/ShopShell"
import { AppStateProvider } from "@/context/AppState"
import { CartProvider } from "@/context/CartContext"

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute roles={["retailer"]}>
      <AppStateProvider>
        <CartProvider>
          <ShopShell>{children}</ShopShell>
        </CartProvider>
      </AppStateProvider>
    </ProtectedRoute>
  )
}
