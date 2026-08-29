import { prisma } from "@/lib/db/prisma"
import { AppError } from "@/lib/errors"
import type { AuthContext } from "@/lib/auth/requireUser"
import { requireFranchiseAccess } from "@/lib/auth/requireUser"

function mapInventoryRow(r: {
  id: string
  franchiseId: string
  name: string
  brand: string | null
  batch: string
  expiry: Date
  hsn: string
  gst: { toNumber(): number } | number
  packSize: string
  shelf: string
  qty: number
  sourceOrderId: string | null
}) {
  return {
    id: r.id,
    franchise_id: r.franchiseId,
    name: r.name,
    brand: r.brand ?? "",
    batch: r.batch,
    expiry: r.expiry.toISOString().slice(0, 10),
    hsn: r.hsn,
    gst: Number(r.gst),
    pack_size: r.packSize,
    shelf: r.shelf,
    qty: r.qty,
    source_order_id: r.sourceOrderId,
  }
}

export async function listInventory(ctx: AuthContext, franchiseId: string) {
  requireFranchiseAccess(ctx, franchiseId)

  const rows = await prisma.retailerInventory.findMany({
    where: { franchiseId },
    orderBy: { name: "asc" },
  })

  return rows.map(mapInventoryRow)
}

export async function updateInventoryShelf(ctx: AuthContext, id: string, shelf: string) {
  const item = await prisma.retailerInventory.findUnique({ where: { id } })
  if (!item) throw AppError.notFound("Inventory item not found")
  requireFranchiseAccess(ctx, item.franchiseId)

  const row = await prisma.retailerInventory.update({
    where: { id },
    data: { shelf },
  })

  return mapInventoryRow(row)
}

export async function updateInventoryQty(ctx: AuthContext, id: string, qty: number) {
  if (!Number.isInteger(qty) || qty < 0) {
    throw AppError.badRequest("qty must be a non-negative integer")
  }

  const item = await prisma.retailerInventory.findUnique({ where: { id } })
  if (!item) throw AppError.notFound("Inventory item not found")
  requireFranchiseAccess(ctx, item.franchiseId)

  const row = await prisma.retailerInventory.update({
    where: { id },
    data: { qty },
  })

  return mapInventoryRow(row)
}
