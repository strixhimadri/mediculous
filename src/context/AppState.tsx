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

export type DispatchResult = { ok: true } | { ok: false; message: string }

type RefreshOptions = { silent?: boolean }

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
        if (isConsoleRole(userRole)) {
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
    void refresh()
  }, [userId, configured, sessionKey, refresh])

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
      updateShelf: async (id, shelf) => {
        setStock((prev) => prev.map((s) => (s.id === id ? { ...s, shelf } : s)))
        await api.updateStockShelf(id, shelf)
        await refresh({ silent: true })
      },
      importStock: async (rows) => {
        await api.upsertStock(rows)
        await refresh({ silent: true })
      },
      addFranchise: async (row) => {
        await api.insertFranchise(row)
        await refresh({ silent: true })
      },
      updateFranchise: async (id, row) => {
        await api.updateFranchiseRow(id, row)
        await refresh({ silent: true })
      },
      removeFranchise: async (id) => {
        await api.deleteFranchise(id)
        await refresh({ silent: true })
      },
      importFranchises: async (rows) => {
        for (let i = 0; i < rows.length; i += IMPORT_BATCH) {
          const batch = rows.slice(i, i + IMPORT_BATCH)
          await Promise.all(batch.map((row) => api.insertFranchise(row)))
        }
        await refresh({ silent: true })
      },
      updateOrder: async (id, patch) => {
        await api.updateOrderMeta(id, {
          billNumber: patch.billNumber,
          billDate: patch.billDate,
          invoiceNote: patch.invoiceNote,
          remark: patch.remark,
          totalAmount: patch.totalAmount,
        })
        await refresh({ silent: true })
      },
      approveOrder: async (id, lines, billNumber, billDate, invoiceNote) => {
        try {
          await api.approveOrderRpc(id, lines, billNumber, billDate, invoiceNote)
          await refresh({ silent: true })
          return { ok: true as const }
        } catch (err) {
          return { ok: false as const, message: err instanceof Error ? err.message : "Approve failed" }
        }
      },
      dispatchOrder: async (id) => {
        try {
          await api.dispatchOrderRpc(id)
          await refresh({ silent: true })
          return { ok: true as const }
        } catch (err) {
          return { ok: false as const, message: err instanceof Error ? err.message : "Dispatch failed" }
        }
      },
      rejectOrder: async (id, reason) => {
        try {
          await api.rejectOrderRpc(id, reason)
          await refresh({ silent: true })
          return { ok: true as const }
        } catch (err) {
          return { ok: false as const, message: err instanceof Error ? err.message : "Reject failed" }
        }
      },
      removeOrder: async (id) => {
        await api.deleteOrder(id)
        await refresh({ silent: true })
      },
      updateLine: async (orderId, lineId, patch) => {
        await api.updateOrderLineLocal(orderId, lineId, patch)
        await refresh({ silent: true })
      },
      removeLine: async (orderId, lineId) => {
        await api.removeOrderLine(orderId, lineId)
        await refresh({ silent: true })
      },
      addLine: async (orderId, line) => {
        await api.addOrderLine(orderId, line)
        await refresh({ silent: true })
      },
      submitOrder: async (lines) => {
        const orderId = await api.submitRetailerOrder(lines)
        await refresh({ silent: true })
        return orderId
      },
    }),
    [loading, error, stock, catalog, franchises, orders, refresh, clearError],
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
