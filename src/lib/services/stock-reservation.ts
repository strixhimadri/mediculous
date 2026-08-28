import type { Prisma } from "@prisma/client"
import { AppError } from "@/lib/errors"

type Tx = Prisma.TransactionClient

export async function reserveStockFefo(tx: Tx, medName: string, qtyNeeded: number) {
  const batches = await tx.wholesalerStock.findMany({
    where: {
      name: medName,
    },
    orderBy: { expiry: "asc" },
  })

  let remaining = qtyNeeded
  for (const batch of batches) {
    if (remaining <= 0) break
    const available = batch.qtyAvailable - batch.qtyReserved
    if (available <= 0) continue

    const take = Math.min(available, remaining)
    await tx.wholesalerStock.update({
      where: { id: batch.id },
      data: { qtyReserved: batch.qtyReserved + take },
    })
    remaining -= take
  }

  if (remaining > 0) {
    throw AppError.badRequest(`Could not reserve full quantity for ${medName}`)
  }
}

export async function releaseReservationFefo(tx: Tx, medName: string, qtyRelease: number) {
  const batches = await tx.wholesalerStock.findMany({
    where: {
      name: medName,
      qtyReserved: { gt: 0 },
    },
    orderBy: { expiry: "asc" },
  })

  let remaining = qtyRelease
  for (const batch of batches) {
    if (remaining <= 0) break
    const releaseAmt = Math.min(batch.qtyReserved, remaining)
    await tx.wholesalerStock.update({
      where: { id: batch.id },
      data: { qtyReserved: batch.qtyReserved - releaseAmt },
    })
    remaining -= releaseAmt
  }
}

export async function getAvailableQty(tx: Tx, medName: string): Promise<number> {
  const batches = await tx.wholesalerStock.findMany({
    where: { name: medName },
    select: { qtyAvailable: true, qtyReserved: true },
  })
  return batches.reduce((sum, b) => sum + (b.qtyAvailable - b.qtyReserved), 0)
}

export async function lockStockRow(tx: Tx, medName: string, batch: string) {
  const rows = await tx.$queryRaw<
    {
      id: string
      name: string
      brand: string | null
      expiry: Date
      hsn: string
      pack_size: string
      shelf: string
      qty_available: number
      qty_reserved: number
    }[]
  >`
    SELECT id, name, brand, expiry, hsn, pack_size, shelf, qty_available, qty_reserved
    FROM wholesaler_stock
    WHERE name = ${medName} AND batch = ${batch}
    FOR UPDATE
  `
  return rows[0] ?? null
}
