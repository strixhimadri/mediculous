import type { UserRole } from "@prisma/client"
import { createClient } from "@/lib/auth/server"
import { prisma } from "@/lib/db/prisma"
import { AppError } from "@/lib/errors"

export type AuthContext = {
  userId: string
  email: string
  role: UserRole
  franchiseId: string | null
  displayName: string | null
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

  const profile = await prisma.profile.findUnique({ where: { id: user.id } })
  if (!profile) {
    throw AppError.forbidden("Profile not found")
  }
  if (!profile.active) {
    throw AppError.forbidden("Account is inactive")
  }

  return {
    userId: user.id,
    email: user.email ?? "",
    role: profile.role,
    franchiseId: profile.franchiseId,
    displayName: profile.displayName,
  }
}

export function requireAdmin(ctx: AuthContext): void {
  if (ctx.role !== "admin") {
    throw AppError.forbidden("Admin access required")
  }
}

export function requireActiveRetailer(ctx: AuthContext): void {
  if (ctx.role !== "retailer" || !ctx.franchiseId) {
    throw AppError.forbidden("Active retailer with linked franchise required")
  }
}

export function requireFranchiseAccess(ctx: AuthContext, franchiseId: string): void {
  if (ctx.role === "admin") return
  if (ctx.role === "retailer" && ctx.franchiseId === franchiseId) return
  throw AppError.forbidden("Cannot access another franchise")
}
