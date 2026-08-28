import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/db/prisma"
import { AppError } from "@/lib/errors"
import { mapCatalogRow, mapStockRow, stockToUpsertPayload } from "@/lib/mappers"
import type { AuthContext } from "@/lib/auth/requireUser"

async function writeAudit(
  actorId: string,
  action: string,
  entityType: string,
  entityId?: string,
  metadata: Record<string, unknown> = {},
) {
  await prisma.auditLog.create({
    data: {
      actorId,
      action,
      entityType,
      entityId: entityId ?? null,
      metadata: metadata as Prisma.InputJsonValue,
    },
  })
}

export async function listStock(_ctx: AuthContext) {
  const rows = await prisma.wholesalerStock.findMany({
    orderBy: [{ name: "asc" }, { expiry: "asc" }],
  })
  return rows.map(mapStockRow)
}

export async function listCatalog(_ctx: AuthContext) {
  const rows = await prisma.wholesalerStock.findMany({
    orderBy: [{ name: "asc" }, { expiry: "asc" }],
  })

  return rows
    .filter((r) => r.qtyAvailable - r.qtyReserved > 0)
    .map((r) =>
      mapCatalogRow({
        ...r,
        qtyAvailable: r.qtyAvailable - r.qtyReserved,
      }),
    )
}

export async function upsertStockBatches(ctx: AuthContext, rows: Record<string, unknown>[]) {
  const payload = stockToUpsertPayload(rows)
  let count = 0

  await prisma.$transaction(async (tx) => {
    for (const row of payload) {
      await tx.wholesalerStock.upsert({
        where: { name_batch: { name: row.name, batch: row.batch } },
        create: {
          name: row.name,
          brand: row.brand,
          sku: row.sku,
          hsn: row.hsn,
          gst: row.gst,
          expiry: row.expiry,
          buyingPrice: row.buyingPrice,
          sellingPrice: row.sellingPrice,
          packSize: row.packSize,
          batch: row.batch,
          shelf: row.shelf,
          purchased: row.purchased,
          sold: row.sold,
          qtyAvailable: row.qtyAvailable,
        },
        update: {
          brand: row.brand,
          sku: row.sku,
          hsn: row.hsn,
          gst: row.gst,
          expiry: row.expiry,
          buyingPrice: row.buyingPrice,
          sellingPrice: row.sellingPrice,
          packSize: row.packSize,
          shelf: row.shelf,
          purchased: row.purchased,
          sold: row.sold,
          qtyAvailable: row.qtyAvailable,
        },
      })
      count++
    }

    await tx.auditLog.create({
      data: {
        actorId: ctx.userId,
        action: "stock_import",
        entityType: "wholesaler_stock",
        metadata: { count },
      },
    })
  })

  return { count }
}

export async function updateStockShelf(_ctx: AuthContext, id: string, shelf: string) {
  await prisma.wholesalerStock.update({
    where: { id },
    data: { shelf },
  })
}
