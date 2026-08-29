import { createAdminClient } from "@/lib/auth/admin"
import { prisma } from "@/lib/db/prisma"
import { AppError } from "@/lib/errors"
import { mapFranchiseRow } from "@/lib/mappers"
import type { AuthContext } from "@/lib/auth/requireUser"

export async function listFranchises(ctx: AuthContext) {
  if (ctx.role === "retailer" && ctx.franchiseId) {
    const row = await prisma.franchise.findUnique({ where: { id: ctx.franchiseId } })
    return row ? [mapFranchiseRow(row)] : []
  }

  const rows = await prisma.franchise.findMany({ orderBy: { name: "asc" } })
  return rows.map(mapFranchiseRow)
}

export async function createFranchise(_ctx: AuthContext, body: Record<string, unknown>) {
  const row = await prisma.franchise.create({
    data: {
      name: String(body.name),
      phone: String(body.phone ?? ""),
      whatsapp: String(body.whatsapp ?? ""),
      yearlyOrder: Number(body.yearlyOrder ?? 0),
      aov: Number(body.aov ?? 0),
      monthPotential: Number(body.monthPotential ?? 0),
      thisMonth: Number(body.thisMonth ?? 0),
      changePct: Number(body.changePct ?? 0),
      lastOrder: body.lastOrder ? new Date(String(body.lastOrder)) : null,
    },
  })
  return mapFranchiseRow(row)
}

export async function updateFranchise(_ctx: AuthContext, id: string, body: Record<string, unknown>) {
  const existing = await prisma.franchise.findUnique({ where: { id } })
  if (!existing) throw AppError.notFound("Franchise not found")

  await prisma.franchise.update({
    where: { id },
    data: {
      name: String(body.name),
      phone: String(body.phone ?? ""),
      whatsapp: String(body.whatsapp ?? ""),
      yearlyOrder: Number(body.yearlyOrder ?? 0),
      aov: Number(body.aov ?? 0),
      monthPotential: Number(body.monthPotential ?? 0),
      thisMonth: Number(body.thisMonth ?? 0),
      changePct: Number(body.changePct ?? 0),
      lastOrder: body.lastOrder ? new Date(String(body.lastOrder)) : null,
    },
  })
}

export async function deleteFranchise(_ctx: AuthContext, id: string) {
  const existing = await prisma.franchise.findUnique({ where: { id } })
  if (!existing) throw AppError.notFound("Franchise not found")

  const linkedProfiles = await prisma.profile.findMany({
    where: { franchiseId: id },
    select: { id: true },
  })

  await prisma.$executeRaw`SELECT public.delete_franchise_bundle(${id}::uuid)`

  if (linkedProfiles.length) {
    const admin = createAdminClient()
    await Promise.all(
      linkedProfiles.map((profile) =>
        admin.auth.admin.deleteUser(profile.id).catch(() => undefined),
      ),
    )
  }
}
