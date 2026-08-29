import type { UserRole } from "@prisma/client"
import { createClient } from "@/lib/auth/server"
import { getCachedProfile, invalidateProfileCache, setCachedProfile } from "@/lib/auth/profile-cache"
import { isAllowlistedDeveloper, isConsoleRole, isSuperAdminRole } from "@/lib/auth/roles"
import { prisma } from "@/lib/db/prisma"
import { AppError } from "@/lib/errors"

export type AuthContext = {
  userId: string
  email: string
  role: UserRole
  franchiseId: string | null
  displayName: string | null
  mustChangePassword: boolean
}

async function maybePromoteSuperAdmin(userId: string, email: string, role: UserRole): Promise<UserRole> {
  if (role === "super_admin" || !isAllowlistedDeveloper(email)) return role
  await prisma.$executeRaw`SELECT public.promote_super_admin(${userId}::uuid)`
  invalidateProfileCache(userId)
  return "super_admin"
}

export async function requireUser(): Promise<AuthContext> {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    throw AppError.unauthorized("Missing or invalid session")
  }

  const cached = getCachedProfile(user.id)
  if (cached) return cached

  let profile = await prisma.profile.findUnique({ where: { id: user.id } })
  if (!profile) {
    throw AppError.forbidden("Profile not found")
  }

  const email = user.email ?? ""

  // Allowlisted developers may start inactive (new signups default to inactive).
  if (!profile.active && isAllowlistedDeveloper(email)) {
    await prisma.$executeRaw`SELECT public.promote_super_admin(${user.id}::uuid)`
    invalidateProfileCache(user.id)
    profile = await prisma.profile.findUniqueOrThrow({ where: { id: user.id } })
  }

  if (!profile.active) {
    throw AppError.forbidden("Account is inactive")
  }

  const role = await maybePromoteSuperAdmin(user.id, email, profile.role)
  if (role !== profile.role) {
    profile = await prisma.profile.findUniqueOrThrow({ where: { id: user.id } })
  }

  const ctx: AuthContext = {
    userId: user.id,
    email,
    role: profile.role,
    franchiseId: profile.franchiseId,
    displayName: profile.displayName,
    mustChangePassword: profile.mustChangePassword,
  }

  setCachedProfile(user.id, ctx)
  return ctx
}

export function requireConsoleAccess(ctx: AuthContext): void {
  if (!isConsoleRole(ctx.role)) {
    throw AppError.forbidden("Console access required")
  }
}

/** @deprecated use requireConsoleAccess */
export function requireAdmin(ctx: AuthContext): void {
  requireConsoleAccess(ctx)
}

export function requireSuperAdmin(ctx: AuthContext): void {
  if (!isSuperAdminRole(ctx.role)) {
    throw AppError.forbidden("Super admin access required")
  }
}

export function requireActiveRetailer(ctx: AuthContext): void {
  if (ctx.role !== "retailer" || !ctx.franchiseId) {
    throw AppError.forbidden("Active retailer with linked franchise required")
  }
}

export function requireFranchiseAccess(ctx: AuthContext, franchiseId: string): void {
  if (isConsoleRole(ctx.role)) return
  if (ctx.role === "retailer" && ctx.franchiseId === franchiseId) return
  throw AppError.forbidden("Cannot access another franchise")
}
