import { createClient } from "@supabase/supabase-js"
import { createClient as createServerClient } from "@/lib/auth/server"
import { createAdminClient } from "@/lib/auth/admin"
import { invalidateProfileCache } from "@/lib/auth/profile-cache"
import type { AuthContext } from "@/lib/auth/requireUser"
import { requireUser } from "@/lib/auth/requireUser"
import { isSuperAdminRole } from "@/lib/auth/roles"
import { prisma } from "@/lib/db/prisma"
import { AppError } from "@/lib/errors"

export type AuthProfile = {
  id: string
  email: string
  role: AuthContext["role"]
  franchiseId: string | null
  displayName: string | null
  mustChangePassword: boolean
  isSuperAdmin: boolean
}

function toAuthProfile(ctx: AuthContext): AuthProfile {
  return {
    id: ctx.userId,
    email: ctx.email,
    role: ctx.role,
    franchiseId: ctx.franchiseId,
    displayName: ctx.displayName,
    mustChangePassword: ctx.mustChangePassword,
    isSuperAdmin: isSuperAdminRole(ctx.role),
  }
}

export async function signIn(email: string, password: string): Promise<AuthProfile> {
  const supabase = await createServerClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  })

  if (error) {
    throw AppError.unauthorized(error.message)
  }

  invalidateProfileCache()
  const ctx = await requireUser()
  return toAuthProfile(ctx)
}

export async function signOut(): Promise<void> {
  const supabase = await createServerClient()
  await supabase.auth.signOut()
  invalidateProfileCache()
}

export async function changePassword(
  ctx: AuthContext,
  currentPassword: string,
  newPassword: string,
) {
  if (newPassword.length < 8) {
    throw AppError.badRequest("New password must be at least 8 characters")
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) throw AppError.internal("Supabase not configured")

  const verifyClient = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { error: verifyError } = await verifyClient.auth.signInWithPassword({
    email: ctx.email,
    password: currentPassword,
  })
  if (verifyError) {
    throw AppError.forbidden("Current password is incorrect")
  }

  const admin = createAdminClient()
  const { error: updateError } = await admin.auth.admin.updateUserById(ctx.userId, {
    password: newPassword,
  })
  if (updateError) {
    throw AppError.badRequest(updateError.message)
  }

  await prisma.profile.update({
    where: { id: ctx.userId },
    data: { mustChangePassword: false },
  })
  invalidateProfileCache(ctx.userId)
}
