"use client"

import { ProtectedRoute } from "@/components/auth/ProtectedRoute"
import { ShopShell } from "@/components/layout/ShopShell"
import { AppStateProvider } from "@/context/AppState"
import { CartProvider } from "@/context/CartContext"

export default function ShopStoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute roles={["retailer"]} requirePasswordChanged>
      <AppStateProvider>
        <CartProvider>
          <ShopShell>{children}</ShopShell>
        </CartProvider>
      </AppStateProvider>
    </ProtectedRoute>
  )
}
