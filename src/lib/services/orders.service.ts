import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/db/prisma"
import { AppError } from "@/lib/errors"
import {
  lineTotal,
  mapOrderRow,
  orderLinesToApprovePayload,
  toBillDateIso,
} from "@/lib/mappers"
import type { AuthContext } from "@/lib/auth/requireUser"
import {
  getAvailableQty,
  lockStockRow,
  releaseReservationFefo,
  reserveStockFefo,
} from "@/lib/services/stock-reservation"

export async function listOrders(ctx: AuthContext) {
  const where =
    ctx.role === "retailer" && ctx.franchiseId ? { franchiseId: ctx.franchiseId } : undefined

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      franchise: { select: { name: true } },
      lines: true,
    },
  })

  return orders.map((order) =>
    mapOrderRow(order, order.lines, order.franchise.name),
  )
}

export async function submitOrder(
  ctx: AuthContext,
  lines: { medicineName: string; quantity: number }[],
) {
  if (!ctx.franchiseId) {
    throw AppError.forbidden("Retailer account is not linked to a franchise")
  }

  if (!lines.length) {
    throw AppError.badRequest("Order must have at least one line")
  }

  return prisma.$transaction(async (tx) => {
    for (const line of lines) {
      if (line.quantity <= 0) {
        throw AppError.badRequest(`Invalid quantity for ${line.medicineName}`)
      }
      const available = await getAvailableQty(tx, line.medicineName)
      if (available < line.quantity) {
        throw AppError.badRequest(`Insufficient stock for ${line.medicineName}`)
      }
    }

    const order = await tx.order.create({
      data: {
        franchiseId: ctx.franchiseId!,
        status: "pending",
        totalAmount: 0,
      },
    })

    let total = 0
    let sortIdx = 0

    for (const line of lines) {
      const stockRow = await tx.wholesalerStock.findFirst({
        where: {
          name: line.medicineName,
        },
        orderBy: { expiry: "asc" },
      })

      const sellPrice = stockRow ? Number(stockRow.sellingPrice) : 0
      const gstRate = stockRow ? Number(stockRow.gst) : 0

      await tx.orderLine.create({
        data: {
          orderId: order.id,
          medicineName: line.medicineName,
          quantity: line.quantity,
          pricePerUnit: sellPrice,
          gst: gstRate,
          sortOrder: sortIdx,
        },
      })

      await reserveStockFefo(tx, line.medicineName, line.quantity)
      total += lineTotal(line.quantity, sellPrice, gstRate)
      sortIdx++
    }

    await tx.order.update({
      where: { id: order.id },
      data: { totalAmount: total },
    })

    await tx.auditLog.create({
      data: {
        actorId: ctx.userId,
        action: "order_submit",
        entityType: "orders",
        entityId: order.id,
      },
    })

    return order.id
  })
}

export async function updateOrderMeta(
  _ctx: AuthContext,
  orderId: string,
  patch: Record<string, unknown>,
) {
  const order = await prisma.order.findUnique({ where: { id: orderId } })
  if (!order) throw AppError.notFound("Order not found")

  const update: {
    billNumber?: string
    invoiceNote?: string | null
    remark?: string | null
    billDate?: Date | null
  } = {}

  if (patch.billNumber !== undefined) update.billNumber = String(patch.billNumber)
  if (patch.invoiceNote !== undefined) update.invoiceNote = patch.invoiceNote ? String(patch.invoiceNote) : null
  if (patch.remark !== undefined) update.remark = patch.remark ? String(patch.remark) : null
  if (patch.billDate !== undefined) {
    update.billDate = patch.billDate ? toBillDateIso(String(patch.billDate)) : null
  }

  await prisma.order.update({ where: { id: orderId }, data: update })
}

export async function approveOrder(
  ctx: AuthContext,
  orderId: string,
  lines: Record<string, unknown>[],
  billNumber: string,
  billDate: string,
  invoiceNote?: string,
) {
  const payload = orderLinesToApprovePayload(lines)

  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { lines: true },
    })
    if (!order) throw AppError.notFound("Order not found")
    if (order.status !== "pending") throw AppError.badRequest("Order is not pending")

    for (const ln of order.lines) {
      await releaseReservationFefo(tx, ln.medicineName, ln.quantity)
    }

    await tx.orderLine.deleteMany({ where: { orderId } })

    let total = 0
    for (const line of payload) {
      await tx.orderLine.create({
        data: {
          orderId,
          medicineName: line.medicineName,
          quantity: line.quantity,
          batch: line.batch,
          pricePerUnit: line.pricePerUnit,
          gst: line.gst,
          sortOrder: line.sortOrder,
        },
      })
      total += lineTotal(line.quantity, Number(line.pricePerUnit), Number(line.gst))
    }

    await tx.order.update({
      where: { id: orderId },
      data: {
        status: "approved",
        totalAmount: total,
        billNumber: billNumber ?? "",
        billDate: billDate ? toBillDateIso(billDate) : new Date(),
        invoiceNote: invoiceNote ?? null,
        approvedAt: new Date(),
      },
    })

    await tx.auditLog.create({
      data: {
        actorId: ctx.userId,
        action: "order_approve",
        entityType: "orders",
        entityId: orderId,
      },
    })
  })
}

export async function dispatchOrder(ctx: AuthContext, orderId: string) {
  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { lines: { orderBy: { sortOrder: "asc" } } },
    })
    if (!order) throw AppError.notFound("Order not found")
    if (order.status !== "approved") throw AppError.badRequest("Order must be approved first")

    for (const ln of order.lines) {
      if (!ln.batch) {
        throw AppError.badRequest(`Assign a batch for ${ln.medicineName} before dispatch`)
      }

      const stockRow = await lockStockRow(tx, ln.medicineName, ln.batch)
      if (!stockRow) {
        throw AppError.badRequest(`Batch ${ln.batch} not found for ${ln.medicineName}`)
      }
      if (stockRow.qty_available < ln.quantity) {
        throw AppError.badRequest(`Insufficient qty for ${ln.medicineName} batch ${ln.batch}`)
      }

      await tx.wholesalerStock.update({
        where: { id: stockRow.id },
        data: {
          qtyAvailable: stockRow.qty_available - ln.quantity,
          qtyReserved: Math.max(stockRow.qty_reserved - ln.quantity, 0),
          sold: { increment: ln.quantity },
        },
      })

      await tx.retailerInventory.upsert({
        where: {
          franchiseId_name_batch: {
            franchiseId: order.franchiseId,
            name: ln.medicineName,
            batch: ln.batch,
          },
        },
        create: {
          franchiseId: order.franchiseId,
          name: ln.medicineName,
          brand: stockRow.brand,
          batch: ln.batch,
          expiry: stockRow.expiry,
          hsn: stockRow.hsn,
          gst: ln.gst,
          packSize: stockRow.pack_size,
          shelf: stockRow.shelf,
          qty: ln.quantity,
          sourceOrderId: orderId,
        },
        update: {
          qty: { increment: ln.quantity },
        },
      })
    }

    await tx.order.update({
      where: { id: orderId },
      data: { status: "dispatched", dispatchedAt: new Date() },
    })

    await tx.auditLog.create({
      data: {
        actorId: ctx.userId,
        action: "order_dispatch",
        entityType: "orders",
        entityId: orderId,
      },
    })
  })
}

export async function rejectOrder(ctx: AuthContext, orderId: string, reason?: string) {
  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { lines: true },
    })
    if (!order) throw AppError.notFound("Order not found")
    if (order.status !== "pending") throw AppError.badRequest("Only pending orders can be rejected")

    for (const ln of order.lines) {
      await releaseReservationFefo(tx, ln.medicineName, ln.quantity)
    }

    await tx.order.update({
      where: { id: orderId },
      data: {
        status: "rejected",
        remark: reason ?? order.remark,
        rejectedAt: new Date(),
      },
    })

    await tx.auditLog.create({
      data: {
        actorId: ctx.userId,
        action: "order_reject",
        entityType: "orders",
        entityId: orderId,
        metadata: { reason } as Prisma.InputJsonValue,
      },
    })
  })
}

export async function deleteOrder(ctx: AuthContext, orderId: string) {
  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { lines: true },
    })
    if (!order) throw AppError.notFound("Order not found")

    if (order.status === "pending") {
      for (const ln of order.lines) {
        await releaseReservationFefo(tx, ln.medicineName, ln.quantity)
      }
    } else if (order.status === "approved" || order.status === "dispatched") {
      throw AppError.badRequest("Cannot delete approved or dispatched orders")
    }

    await tx.order.delete({ where: { id: orderId } })

    await tx.auditLog.create({
      data: {
        actorId: ctx.userId,
        action: "order_delete",
        entityType: "orders",
        entityId: orderId,
        metadata: { status: order.status } as Prisma.InputJsonValue,
      },
    })
  })
}

export async function updateOrderLine(
  _ctx: AuthContext,
  orderId: string,
  lineId: string,
  patch: Record<string, unknown>,
) {
  const order = await prisma.order.findUnique({ where: { id: orderId } })
  if (!order) throw AppError.notFound("Order not found")
  if (order.status !== "pending" && order.status !== "approved") {
    throw AppError.badRequest("Cannot edit lines on this order")
  }

  const update: {
    quantity?: number
    batch?: string
    pricePerUnit?: number
    gst?: number
  } = {}

  if (patch.quantity !== undefined) update.quantity = Number(patch.quantity)
  if (patch.batch !== undefined) update.batch = String(patch.batch)
  if (patch.pricePerUnit !== undefined) update.pricePerUnit = Number(patch.pricePerUnit)
  if (patch.gst !== undefined) update.gst = Number(patch.gst)

  await prisma.orderLine.updateMany({
    where: { id: lineId, orderId },
    data: update,
  })

  const lines = await prisma.orderLine.findMany({ where: { orderId } })
  const total = lines.reduce(
    (sum, ln) => sum + lineTotal(ln.quantity, Number(ln.pricePerUnit), Number(ln.gst)),
    0,
  )
  await prisma.order.update({ where: { id: orderId }, data: { totalAmount: total } })
}

export async function deleteOrderLine(_ctx: AuthContext, orderId: string, lineId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } })
  if (!order) throw AppError.notFound("Order not found")

  await prisma.orderLine.deleteMany({ where: { id: lineId, orderId } })

  const lines = await prisma.orderLine.findMany({ where: { orderId } })
  const total = lines.reduce(
    (sum, ln) => sum + lineTotal(ln.quantity, Number(ln.pricePerUnit), Number(ln.gst)),
    0,
  )
  await prisma.order.update({ where: { id: orderId }, data: { totalAmount: total } })
}

export async function addOrderLine(
  _ctx: AuthContext,
  orderId: string,
  line: Record<string, unknown>,
) {
  const order = await prisma.order.findUnique({ where: { id: orderId } })
  if (!order) throw AppError.notFound("Order not found")

  await prisma.orderLine.create({
    data: {
      orderId,
      medicineName: String(line.medicineName),
      quantity: Number(line.quantity),
      batch: String(line.batch ?? ""),
      pricePerUnit: Number(line.pricePerUnit ?? 0),
      gst: Number(line.gst ?? 0),
    },
  })

  const lines = await prisma.orderLine.findMany({ where: { orderId } })
  const total = lines.reduce(
    (sum, ln) => sum + lineTotal(ln.quantity, Number(ln.pricePerUnit), Number(ln.gst)),
    0,
  )
  await prisma.order.update({ where: { id: orderId }, data: { totalAmount: total } })
}
