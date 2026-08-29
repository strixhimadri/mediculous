import type { UserRole } from "@prisma/client"
import { createAdminClient } from "@/lib/auth/admin"
import type { AuthContext } from "@/lib/auth/requireUser"
import { prisma } from "@/lib/db/prisma"
import { AppError } from "@/lib/errors"

export async function listDevUsers(_ctx: AuthContext) {
  const profiles = await prisma.profile.findMany({
    orderBy: { createdAt: "desc" },
    include: { franchise: { select: { name: true } } },
  })

  const admin = createAdminClient()
  const { data: authList, error } = await admin.auth.admin.listUsers({ perPage: 1000 })
  if (error) throw AppError.internal(error.message)

  const emailById = new Map(authList.users.map((u) => [u.id, u.email ?? ""]))

  return profiles.map((p) => ({
    id: p.id,
    email: emailById.get(p.id) ?? "",
    role: p.role,
    franchiseId: p.franchiseId,
    franchiseName: p.franchise?.name ?? null,
    displayName: p.displayName,
    active: p.active,
    mustChangePassword: p.mustChangePassword,
    createdAt: p.createdAt.toISOString(),
  }))
}

export async function updateDevUser(
  _ctx: AuthContext,
  userId: string,
  data: { role: UserRole; franchiseId: string | null; active: boolean },
) {
  if (data.role === "retailer" && !data.franchiseId && data.active) {
    throw AppError.badRequest("Retailer must be linked to a franchise")
  }
  if ((data.role === "admin" || data.role === "super_admin") && data.franchiseId) {
    throw AppError.badRequest("Admin roles cannot have a franchise")
  }

  await prisma.$executeRaw`
    SELECT public.update_profile_access(
      ${userId}::uuid,
      ${data.role}::public.user_role,
      ${data.franchiseId}::uuid,
      ${data.active}
    )
  `
}

export async function resetDevUserPassword(_ctx: AuthContext, userId: string, newPassword: string) {
  if (newPassword.length < 8) {
    throw AppError.badRequest("Password must be at least 8 characters")
  }
  const admin = createAdminClient()
  const { error } = await admin.auth.admin.updateUserById(userId, { password: newPassword })
  if (error) throw AppError.badRequest(error.message)

  await prisma.profile.update({
    where: { id: userId },
    data: { mustChangePassword: true },
  })
}

export async function listAuditLog(_ctx: AuthContext, limit = 100) {
  return prisma.auditLog.findMany({
    take: limit,
    orderBy: { createdAt: "desc" },
  })
}

export type CreateDevUserInput = {
  email: string
  password: string
  displayName?: string
  role: UserRole
  franchiseId?: string | null
  mustChangePassword?: boolean
}

export async function createDevUser(_ctx: AuthContext, input: CreateDevUserInput) {
  const email = input.email.trim().toLowerCase()
  if (input.password.length < 8) {
    throw AppError.badRequest("Password must be at least 8 characters")
  }
  if (input.role === "retailer" && !input.franchiseId) {
    throw AppError.badRequest("Retailer must be linked to a franchise")
  }
  if ((input.role === "admin" || input.role === "super_admin") && input.franchiseId) {
    throw AppError.badRequest("Admin roles cannot have a franchise")
  }

  const admin = createAdminClient()
  const displayName = input.displayName?.trim() || email.split("@")[0]

  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password: input.password,
    email_confirm: true,
    user_metadata: { display_name: displayName },
  })

  if (authError || !authData.user) {
    throw AppError.badRequest(authError?.message ?? "Failed to create auth user")
  }

  const userId = authData.user.id

  try {
    if (input.role === "retailer") {
      await prisma.$executeRaw`
        SELECT public.provision_retailer_profile(
          ${userId}::uuid,
          ${input.franchiseId}::uuid,
          ${displayName}
        )
      `
      if (input.mustChangePassword === false) {
        await prisma.profile.update({
          where: { id: userId },
          data: { mustChangePassword: false },
        })
      }
    } else if (input.role === "admin") {
      await prisma.$executeRaw`SELECT public.promote_admin(${userId}::uuid)`
      await prisma.profile.update({
        where: { id: userId },
        data: { displayName, mustChangePassword: input.mustChangePassword ?? false },
      })
    } else {
      await prisma.$executeRaw`SELECT public.promote_super_admin(${userId}::uuid)`
      await prisma.profile.update({
        where: { id: userId },
        data: { displayName, mustChangePassword: false },
      })
    }
  } catch (err) {
    await admin.auth.admin.deleteUser(userId).catch(() => undefined)
    throw AppError.internal(err instanceof Error ? err.message : "Failed to provision profile")
  }

  return { id: userId, email }
}
