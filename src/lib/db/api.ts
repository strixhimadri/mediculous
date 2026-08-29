import { apiFetch } from "@/lib/api/http"
import type { Franchise } from "@/data/franchises"
import type { FranchiseOrder, OrderLine } from "@/data/orders"
import type { StockItem } from "@/data/stock"
import type { StockImportRow } from "@/lib/stockImport"
import type { FranchiseImportRow } from "@/lib/franchiseImport"

let adminBootstrapPromise: Promise<{
  stock: StockItem[]
  franchises: Franchise[]
  orders: FranchiseOrder[]
}> | null = null

let shopBootstrapPromise: Promise<{
  catalog: StockItem[]
  orders: FranchiseOrder[]
}> | null = null

export async function fetchAdminBootstrap() {
  if (!adminBootstrapPromise) {
    adminBootstrapPromise = apiFetch<{
      stock: StockItem[]
      franchises: Franchise[]
      orders: FranchiseOrder[]
    }>("/api/admin/bootstrap").finally(() => {
      adminBootstrapPromise = null
    })
  }
  return adminBootstrapPromise
}

export async function fetchShopBootstrap() {
  if (!shopBootstrapPromise) {
    shopBootstrapPromise = apiFetch<{
      catalog: StockItem[]
      orders: FranchiseOrder[]
    }>("/api/shop/bootstrap").finally(() => {
      shopBootstrapPromise = null
    })
  }
  return shopBootstrapPromise
}

export async function fetchAdminStock(): Promise<StockItem[]> {
  return apiFetch<StockItem[]>("/api/stock")
}

export async function fetchCatalog(): Promise<StockItem[]> {
  return apiFetch<StockItem[]>("/api/catalog")
}

export async function upsertStock(rows: StockImportRow[]): Promise<number> {
  const result = await apiFetch<{ count: number }>("/api/stock/upsert", {
    method: "POST",
    body: JSON.stringify({ rows }),
  })
  return result.count
}

export async function updateStockShelf(id: string, shelf: string): Promise<void> {
  await apiFetch(`/api/stock/${id}/shelf`, {
    method: "PATCH",
    body: JSON.stringify({ shelf }),
  })
}

export async function fetchFranchises(): Promise<Franchise[]> {
  return apiFetch<Franchise[]>("/api/franchises")
}

export async function insertFranchise(row: FranchiseImportRow): Promise<Franchise> {
  return apiFetch<Franchise>("/api/franchises", {
    method: "POST",
    body: JSON.stringify(row),
  })
}

export async function updateFranchiseRow(id: string, row: FranchiseImportRow): Promise<Franchise> {
  return apiFetch<Franchise>(`/api/franchises/${id}`, {
    method: "PATCH",
    body: JSON.stringify(row),
  })
}

export async function deleteFranchise(id: string): Promise<void> {
  await apiFetch(`/api/franchises/${id}`, { method: "DELETE" })
}

export async function fetchOrders(): Promise<FranchiseOrder[]> {
  return apiFetch<FranchiseOrder[]>("/api/orders")
}

export async function fetchRetailerOrders(franchiseId: string): Promise<FranchiseOrder[]> {
  const all = await fetchOrders()
  return all.filter((o) => o.franchiseId === franchiseId)
}

export async function updateOrderMeta(
  orderId: string,
  patch: { billNumber?: string; billDate?: string; invoiceNote?: string; remark?: string; totalAmount?: number },
): Promise<FranchiseOrder> {
  const data = await apiFetch<{ order: FranchiseOrder }>(`/api/orders/${orderId}/meta`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  })
  return data.order
}

export async function approveOrderRpc(
  orderId: string,
  lines: OrderLine[],
  billNumber: string,
  billDate: string,
  invoiceNote?: string,
): Promise<FranchiseOrder> {
  const data = await apiFetch<{ order: FranchiseOrder }>(`/api/orders/${orderId}/approve`, {
    method: "POST",
    body: JSON.stringify({ lines, billNumber, billDate, invoiceNote }),
  })
  return data.order
}

export async function dispatchOrderRpc(orderId: string): Promise<FranchiseOrder> {
  const data = await apiFetch<{ order: FranchiseOrder }>(`/api/orders/${orderId}/dispatch`, {
    method: "POST",
  })
  return data.order
}

export async function rejectOrderRpc(orderId: string, reason?: string): Promise<FranchiseOrder> {
  const data = await apiFetch<{ order: FranchiseOrder }>(`/api/orders/${orderId}/reject`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  })
  return data.order
}

export async function deleteOrder(orderId: string): Promise<void> {
  await apiFetch(`/api/orders/${orderId}`, { method: "DELETE" })
}

export async function submitRetailerOrder(
  lines: { medicineName: string; quantity: number }[],
): Promise<FranchiseOrder> {
  const data = await apiFetch<{ order: FranchiseOrder }>("/api/orders/submit", {
    method: "POST",
    body: JSON.stringify({ lines }),
  })
  return data.order
}

export async function updateOrderLineLocal(
  orderId: string,
  lineId: string,
  patch: Partial<OrderLine>,
): Promise<FranchiseOrder> {
  const data = await apiFetch<{ order: FranchiseOrder }>(`/api/orders/${orderId}/lines/${lineId}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  })
  return data.order
}

export async function removeOrderLine(orderId: string, lineId: string): Promise<FranchiseOrder> {
  const data = await apiFetch<{ order: FranchiseOrder }>(`/api/orders/${orderId}/lines/${lineId}`, {
    method: "DELETE",
  })
  return data.order
}

export async function addOrderLine(orderId: string, line: OrderLine): Promise<FranchiseOrder> {
  const data = await apiFetch<{ order: FranchiseOrder }>(`/api/orders/${orderId}/lines`, {
    method: "POST",
    body: JSON.stringify(line),
  })
  return data.order
}

export async function fetchRetailerInventory(franchiseId: string) {
  return apiFetch<Record<string, unknown>[]>(`/api/inventory/${franchiseId}`)
}

export async function updateRetailerInventoryShelf(id: string, shelf: string) {
  const data = await apiFetch<{ item: Record<string, unknown> }>(`/api/inventory/${id}/shelf`, {
    method: "PATCH",
    body: JSON.stringify({ shelf }),
  })
  return data.item
}

export async function updateRetailerInventoryQty(id: string, qty: number) {
  const data = await apiFetch<{ item: Record<string, unknown> }>(`/api/inventory/${id}/qty`, {
    method: "PATCH",
    body: JSON.stringify({ qty }),
  })
  return data.item
}
