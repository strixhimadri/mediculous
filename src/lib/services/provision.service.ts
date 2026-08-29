import { createAdminClient } from "@/lib/auth/admin"
import type { AuthContext } from "@/lib/auth/requireUser"
import { prisma } from "@/lib/db/prisma"
import { AppError } from "@/lib/errors"
import { mapFranchiseRow } from "@/lib/mappers"

export type ProvisionFranchiseInput = {
  name: string
  phone?: string
  whatsapp?: string
  yearlyOrder?: number
  aov?: number
  monthPotential?: number
  thisMonth?: number
  changePct?: number
  lastOrder?: string
  email: string
  temporaryPassword: string
}

export async function provisionFranchiseWithRetailer(_ctx: AuthContext, input: ProvisionFranchiseInput) {
  const email = input.email.trim().toLowerCase()
  const admin = createAdminClient()

  const franchise = await prisma.franchise.create({
    data: {
      name: input.name,
      phone: input.phone ?? "",
      whatsapp: input.whatsapp ?? "",
      yearlyOrder: input.yearlyOrder ?? 0,
      aov: input.aov ?? 0,
      monthPotential: input.monthPotential ?? 0,
      thisMonth: input.thisMonth ?? 0,
      changePct: input.changePct ?? 0,
      lastOrder: input.lastOrder ? new Date(input.lastOrder) : null,
    },
  })

  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password: input.temporaryPassword,
    email_confirm: true,
    user_metadata: { display_name: input.name },
  })

  if (authError || !authData.user) {
    await prisma.franchise.delete({ where: { id: franchise.id } }).catch(() => undefined)
    if (authError?.message?.includes("already")) {
      throw AppError.badRequest("A user with this email already exists")
    }
    throw AppError.badRequest(authError?.message ?? "Failed to create auth user")
  }

  try {
    await prisma.$executeRaw`
      SELECT public.provision_retailer_profile(
        ${authData.user.id}::uuid,
        ${franchise.id}::uuid,
        ${input.name}
      )
    `
  } catch (err) {
    await admin.auth.admin.deleteUser(authData.user.id).catch(() => undefined)
    await prisma.franchise.delete({ where: { id: franchise.id } }).catch(() => undefined)
    throw AppError.internal(err instanceof Error ? err.message : "Failed to provision profile")
  }

  return { franchise: mapFranchiseRow(franchise), email }
}
