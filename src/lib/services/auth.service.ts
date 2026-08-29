import { createClient } from "@supabase/supabase-js"
import { createAdminClient } from "@/lib/auth/admin"
import { invalidateProfileCache } from "@/lib/auth/profile-cache"
import type { AuthContext } from "@/lib/auth/requireUser"
import { prisma } from "@/lib/db/prisma"
import { AppError } from "@/lib/errors"

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
