"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/context/AuthContext"
import { isApiConfigured } from "@/lib/api/http"
import { isConsoleRole } from "@/lib/auth/roles"
import type { UserRole } from "@/types/database"

const PASSWORD_SETUP_PATH = "/shop/profile/setup"

type ProtectedRouteProps = {
  children: React.ReactNode
  roles?: UserRole[]
  redirectTo?: string
  wrongRoleRedirect?: string
  requirePasswordChanged?: boolean
  allowPasswordSetup?: boolean
}

export function ProtectedRoute({
  children,
  roles,
  redirectTo = "/login",
  wrongRoleRedirect,
  requirePasswordChanged = false,
  allowPasswordSetup = false,
}: ProtectedRouteProps) {
  const { user, loading, configured } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (loading || !configured) return

    if (!user) {
      const current = pathname || window.location.pathname
      router.replace(`${redirectTo}?redirect=${encodeURIComponent(current)}`)
      return
    }

    if (allowPasswordSetup) {
      if (!user.mustChangePassword) {
        router.replace("/shop")
      }
      return
    }

    if (requirePasswordChanged && user.mustChangePassword && pathname !== PASSWORD_SETUP_PATH) {
      router.replace(PASSWORD_SETUP_PATH)
      return
    }

    if (roles && !roles.includes(user.role)) {
      const fallback = wrongRoleRedirect ?? (isConsoleRole(user.role) ? "/app" : "/shop")
      router.replace(fallback)
    }
  }, [
    user,
    loading,
    configured,
    roles,
    redirectTo,
    wrongRoleRedirect,
    router,
    requirePasswordChanged,
    allowPasswordSetup,
    pathname,
  ])

  if (!configured) {
    return (
      <div className="flex min-h-svh items-center justify-center p-6">
        <div className="glass max-w-md rounded-[1.25rem] p-8 text-center">
          <h1 className="font-display text-xl text-ink">Not configured</h1>
          <p className="mt-3 text-sm text-ink-soft">
            Set <code className="font-mono text-xs">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
            <code className="font-mono text-xs">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in{" "}
            <code className="font-mono text-xs">.env</code>.
          </p>
        </div>
      </div>
    )
  }

  if (!isApiConfigured()) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-white">
        <div className="h-8 w-8 animate-pulse rounded-full bg-canvas" aria-label="Loading" />
      </div>
    )
  }
  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-white">
        <div className="h-8 w-8 animate-pulse rounded-full bg-canvas" aria-label="Loading session" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-white">
        <div className="h-8 w-8 animate-pulse rounded-full bg-canvas" aria-label="Checking access" />
      </div>
    )
  }

  if (allowPasswordSetup && !user.mustChangePassword) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-white">
        <div className="h-8 w-8 animate-pulse rounded-full bg-canvas" aria-label="Redirecting" />
      </div>
    )
  }

  if (requirePasswordChanged && user.mustChangePassword && pathname !== PASSWORD_SETUP_PATH) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-white">
        <div className="h-8 w-8 animate-pulse rounded-full bg-canvas" aria-label="Redirecting" />
      </div>
    )
  }

  if (roles && !roles.includes(user.role)) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-white">
        <div className="h-8 w-8 animate-pulse rounded-full bg-canvas" aria-label="Redirecting" />
      </div>
    )
  }

  if (roles?.includes("retailer") && !user.franchiseId && !allowPasswordSetup) {
    return (
      <div className="flex min-h-svh items-center justify-center p-6">
        <div className="glass max-w-md rounded-[1.25rem] p-8 text-center">
          <h1 className="font-display text-xl text-ink">Account not ready</h1>
          <p className="mt-3 text-sm text-ink-soft">
            Your retailer account is not linked to a franchise yet. Ask your wholesaler administrator
            to activate your account.
          </p>
        </div>
      </div>
    )
  }

  return children
}
