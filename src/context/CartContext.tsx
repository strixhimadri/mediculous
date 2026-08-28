"use client"

import { createContext, useContext, useMemo, useState, type ReactNode } from "react"

export type CartItem = {
  medicineName: string
  quantity: number
  sellingPrice: number
  gst: number
  packSize: string
}

type CartState = {
  items: CartItem[]
  addItem: (item: CartItem) => void
  updateQty: (medicineName: string, quantity: number) => void
  removeItem: (medicineName: string) => void
  clear: () => void
  count: number
}

const CartCtx = createContext<CartState | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  const value = useMemo<CartState>(
    () => ({
      items,
      count: items.reduce((s, i) => s + i.quantity, 0),
      addItem: (item) => {
        setItems((prev) => {
          const existing = prev.find((p) => p.medicineName === item.medicineName)
          if (existing) {
            return prev.map((p) =>
              p.medicineName === item.medicineName
                ? { ...p, quantity: p.quantity + item.quantity }
                : p,
            )
          }
          return [...prev, item]
        })
      },
      updateQty: (medicineName, quantity) => {
        if (quantity <= 0) {
          setItems((prev) => prev.filter((p) => p.medicineName !== medicineName))
          return
        }
        setItems((prev) =>
          prev.map((p) => (p.medicineName === medicineName ? { ...p, quantity } : p)),
        )
      },
      removeItem: (medicineName) => {
        setItems((prev) => prev.filter((p) => p.medicineName !== medicineName))
      },
      clear: () => setItems([]),
    }),
    [items],
  )

  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>
}

export function useCart() {
  const ctx = useContext(CartCtx)
  if (!ctx) throw new Error("useCart must be used inside CartProvider")
  return ctx
}
