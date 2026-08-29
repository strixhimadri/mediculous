"use client"

import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import type { Franchise } from "@/data/franchises"
import type { FranchiseOrder, OrderLine } from "@/data/orders"
import type { StockItem } from "@/data/stock"
import { useAuth } from "@/context/AuthContext"
import { isConsoleRole } from "@/lib/auth/roles"
import * as api from "@/lib/db/api"
import type { FranchiseImportRow } from "@/lib/franchiseImport"
import type { StockImportRow } from "@/lib/stockImport"
import { isSupabaseConfigured } from "@/lib/auth/client"
import { runOptimistic } from "@/lib/state/optimistic"

export type DispatchResult = { ok: true } | { ok: false; message: string }

export type RefreshScope = "all" | "franchises" | "orders" | "stock" | "shop"

type RefreshOptions = { silent?: boolean; scope?: RefreshScope }

type AppState = {
  loading: boolean
  error: string | null
  stock: StockItem[]
  catalog: StockItem[]
  updateShelf: (id: string, shelf: string) => Promise<void>
  importStock: (rows: StockImportRow[]) => Promise<void>
  franchises: Franchise[]
  addFranchise: (row: FranchiseImportRow) => Promise<void>
  updateFranchise: (id: string, row: FranchiseImportRow) => Promise<void>
  removeFranchise: (id: string) => Promise<void>
  importFranchises: (rows: FranchiseImportRow[]) => Promise<void>
  upsertFranchise: (franchise: Franchise) => void
  refresh: (opts?: RefreshOptions) => Promise<void>
  clearError: () => void
  orders: FranchiseOrder[]
  updateOrder: (id: string, patch: Partial<FranchiseOrder>) => Promise<void>
  approveOrder: (
    id: string,
    lines: OrderLine[],
    billNumber: string,
    billDate: string,
    invoiceNote?: string,
  ) => Promise<DispatchResult>
  dispatchOrder: (id: string) => Promise<DispatchResult>
  rejectOrder: (id: string, reason?: string) => Promise<DispatchResult>
  removeOrder: (id: string) => Promise<void>
  updateLine: (orderId: string, lineId: string, patch: Partial<OrderLine>) => Promise<void>
  removeLine: (orderId: string, lineId: string) => Promise<void>
  addLine: (orderId: string, line: OrderLine) => Promise<void>
  submitOrder: (lines: { medicineName: string; quantity: number }[]) => Promise<string>
}

const Ctx = createContext<AppState | null>(null)
const IMPORT_BATCH = 8

function upsertFranchiseList(list: Franchise[], franchise: Franchise): Franchise[] {
  const idx = list.findIndex((f) => f.id === franchise.id)
  if (idx >= 0) {
    const next = [...list]
    next[idx] = franchise
    return next
  }
  return [...list, franchise]
}

function replaceOrder(orders: FranchiseOrder[], order: FranchiseOrder): FranchiseOrder[] {
  return orders.map((o) => (o.id === order.id ? order : o))
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const { user, configured } = useAuth()
  const userId = user?.id
  const userRole = user?.role
  const franchiseId = user?.franchiseId ?? null

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stock, setStock] = useState<StockItem[]>([])
  const [catalog, setCatalog] = useState<StockItem[]>([])
  const [franchises, setFranchises] = useState<Franchise[]>([])
  const [orders, setOrders] = useState<FranchiseOrder[]>([])
  const refreshGen = useRef(0)
  const loadedSessionKey = useRef<string | null>(null)

  const sessionKey =
    userId && userRole ? `${userId}:${userRole}:${franchiseId ?? ""}` : null

  const clearError = useCallback(() => setError(null), [])

  const refresh = useCallback(
    async (opts?: RefreshOptions) => {
      const gen = ++refreshGen.current
      const scope = opts?.scope ?? "all"

      if (!configured || !userId || !userRole) {
        setStock([])
        setCatalog([])
        setFranchises([])
        setOrders([])
        setLoading(false)
        loadedSessionKey.current = null
        return
      }

      if (!opts?.silent) setLoading(true)
      if (!opts?.silent) setError(null)

      try {
        if (scope === "franchises" && isConsoleRole(userRole)) {
          const rows = await api.fetchFranchises()
          if (gen !== refreshGen.current) return
          setFranchises(rows)
        } else if (scope === "orders") {
          const rows = await api.fetchOrders()
          if (gen !== refreshGen.current) return
          setOrders(rows)
        } else if (scope === "stock" && isConsoleRole(userRole)) {
          const rows = await api.fetchAdminStock()
          if (gen !== refreshGen.current) return
          setStock(rows)
        } else if (scope === "shop" && franchiseId) {
          const data = await api.fetchShopBootstrap()
          if (gen !== refreshGen.current) return
          setCatalog(data.catalog)
          setOrders(data.orders)
        } else if (isConsoleRole(userRole)) {
          const data = await api.fetchAdminBootstrap()
          if (gen !== refreshGen.current) return
          setStock(data.stock)
          setFranchises(data.franchises)
          setOrders(data.orders)
          setCatalog([])
        } else if (franchiseId) {
          const data = await api.fetchShopBootstrap()
          if (gen !== refreshGen.current) return
          setCatalog(data.catalog)
          setOrders(data.orders)
          setStock([])
          setFranchises([])
        } else {
          if (gen !== refreshGen.current) return
          setError("Your retailer account is not linked to a franchise. Contact your administrator.")
          setCatalog([])
          setOrders([])
        }
        loadedSessionKey.current = sessionKey
      } catch (err) {
        if (gen !== refreshGen.current) return
        setError(err instanceof Error ? err.message : "Failed to load data")
      } finally {
        if (gen === refreshGen.current && !opts?.silent) setLoading(false)
      }
    },
    [configured, userId, userRole, franchiseId, sessionKey],
  )

  useEffect(() => {
    if (!userId || !configured || !sessionKey) {
      loadedSessionKey.current = null
      setLoading(false)
      return
    }
    if (loadedSessionKey.current === sessionKey) return
    void refresh({ scope: "all" })
  }, [userId, configured, sessionKey, refresh])

  const upsertFranchise = useCallback((franchise: Franchise) => {
    setFranchises((prev) => upsertFranchiseList(prev, franchise))
  }, [])

  const value = useMemo<AppState>(
    () => ({
      loading,
      error,
      stock,
      catalog,
      franchises,
      orders,
      refresh,
      clearError,
      upsertFranchise,
      updateShelf: async (id, shelf) => {
        let snapshot: StockItem[] = []
        setStock((prev) => {
          snapshot = prev
          return prev.map((s) => (s.id === id ? { ...s, shelf } : s))
        })
        try {
          await api.updateStockShelf(id, shelf)
        } catch (err) {
          setStock(snapshot)
          throw err
        }
      },
      importStock: async (rows) => {
        await api.upsertStock(rows)
        await refresh({ silent: true, scope: "stock" })
      },
      addFranchise: async (row) => {
        const franchise = await api.insertFranchise(row)
        setFranchises((prev) => upsertFranchiseList(prev, franchise))
      },
      updateFranchise: async (id, row) => {
        const franchise = await api.updateFranchiseRow(id, row)
        setFranchises((prev) => upsertFranchiseList(prev, franchise))
      },
      removeFranchise: async (id) => {
        let snapshotFranchises: Franchise[] = []
        let snapshotOrders: FranchiseOrder[] = []
        await runOptimistic({
          apply: () => {
            setFranchises((prev) => {
              snapshotFranchises = prev
              return prev.filter((f) => f.id !== id)
            })
            setOrders((prev) => {
              snapshotOrders = prev
              return prev.filter((o) => o.franchiseId !== id)
            })
          },
          rollback: () => {
            setFranchises(snapshotFranchises)
            setOrders(snapshotOrders)
          },
          action: () => api.deleteFranchise(id),
        })
      },
      importFranchises: async (rows) => {
        const created: Franchise[] = []
        for (let i = 0; i < rows.length; i += IMPORT_BATCH) {
          const batch = rows.slice(i, i + IMPORT_BATCH)
          const results = await Promise.all(batch.map((row) => api.insertFranchise(row)))
          created.push(...results)
        }
        setFranchises((prev) => {
          let next = prev
          for (const franchise of created) {
            next = upsertFranchiseList(next, franchise)
          }
          return next
        })
      },
      updateOrder: async (id, patch) => {
        const order = await api.updateOrderMeta(id, {
          billNumber: patch.billNumber,
          billDate: patch.billDate,
          invoiceNote: patch.invoiceNote,
          remark: patch.remark,
          totalAmount: patch.totalAmount,
        })
        setOrders((prev) => replaceOrder(prev, order))
      },
      approveOrder: async (id, lines, billNumber, billDate, invoiceNote) => {
        try {
          const order = await api.approveOrderRpc(id, lines, billNumber, billDate, invoiceNote)
          setOrders((prev) => replaceOrder(prev, order))
          return { ok: true as const }
        } catch (err) {
          return { ok: false as const, message: err instanceof Error ? err.message : "Approve failed" }
        }
      },
      dispatchOrder: async (id) => {
        try {
          const order = await api.dispatchOrderRpc(id)
          setOrders((prev) => replaceOrder(prev, order))
          return { ok: true as const }
        } catch (err) {
          return { ok: false as const, message: err instanceof Error ? err.message : "Dispatch failed" }
        }
      },
      rejectOrder: async (id, reason) => {
        try {
          const order = await api.rejectOrderRpc(id, reason)
          setOrders((prev) => replaceOrder(prev, order))
          return { ok: true as const }
        } catch (err) {
          return { ok: false as const, message: err instanceof Error ? err.message : "Reject failed" }
        }
      },
      removeOrder: async (id) => {
        let snapshot: FranchiseOrder[] = []
        await runOptimistic({
          apply: () => {
            setOrders((prev) => {
              snapshot = prev
              return prev.filter((o) => o.id !== id)
            })
          },
          rollback: () => setOrders(snapshot),
          action: () => api.deleteOrder(id),
        })
      },
      updateLine: async (orderId, lineId, patch) => {
        const order = await api.updateOrderLineLocal(orderId, lineId, patch)
        setOrders((prev) => replaceOrder(prev, order))
      },
      removeLine: async (orderId, lineId) => {
        const order = await api.removeOrderLine(orderId, lineId)
        setOrders((prev) => replaceOrder(prev, order))
      },
      addLine: async (orderId, line) => {
        const order = await api.addOrderLine(orderId, line)
        setOrders((prev) => replaceOrder(prev, order))
      },
      submitOrder: async (lines) => {
        const order = await api.submitRetailerOrder(lines)
        setOrders((prev) => [order, ...prev])
        return order.id
      },
    }),
    [loading, error, stock, catalog, franchises, orders, refresh, clearError, upsertFranchise],
  )

  return createElement(Ctx.Provider, { value }, children)
}

export function useAppState() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error("useAppState must be used inside AppStateProvider")
  return ctx
}

export function useActiveStock(): StockItem[] {
  const { stock, catalog } = useAppState()
  const { user } = useAuth()
  return isConsoleRole(user?.role ?? "") ? stock : catalog
}

export function isLiveMode() {
  return isSupabaseConfigured()
}
