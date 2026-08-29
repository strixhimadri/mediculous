"use client"

import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import type { AuthChangeEvent, Session } from "@supabase/supabase-js"
import { fetchAuthProfile } from "@/lib/api/http"
import { getSupabase, isSupabaseConfigured } from "@/lib/auth/client"
import { invalidateProfileCache } from "@/lib/auth/profile-cache"
import type { UserRole } from "@/types/database"

export type AuthUser = {
  id: string
  email: string
  role: UserRole
  franchiseId: string | null
  displayName: string | null
  mustChangePassword: boolean
  isSuperAdmin: boolean
}

type AuthState = {
  user: AuthUser | null
  session: Session | null
  loading: boolean
  configured: boolean
  apiReady: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null; user?: AuthUser }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthCtx = createContext<AuthState | null>(null)

async function hydrateUser(session: Session): Promise<AuthUser | null> {
  const profile = await fetchAuthProfile()
  if (profile) return profile

  const supabase = getSupabase()
  await supabase.auth.signOut()
  return null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = isSupabaseConfigured()
  const apiReady = configured
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(configured)
  const userRef = useRef<AuthUser | null>(null)
  userRef.current = user

  const signOut = useCallback(async () => {
    if (!configured) {
      setUser(null)
      setSession(null)
      return
    }
    const supabase = getSupabase()
    await supabase.auth.signOut()
    invalidateProfileCache()
    setUser(null)
    setSession(null)
    setLoading(false)
  }, [configured])

  const refreshProfile = useCallback(async () => {
    if (!session) return
    try {
      const next = await hydrateUser(session)
      setUser(next)
      if (!next) setSession(null)
    } catch {
      await signOut()
    }
  }, [session, signOut])

  useEffect(() => {
    if (!configured) {
      setLoading(false)
      return
    }

    const supabase = getSupabase()
    let mounted = true

    async function initSession() {
      const {
        data: { session: initialSession },
      } = await supabase.auth.getSession()
      if (!mounted) return

      setSession(initialSession)
      if (initialSession) {
        try {
          const nextUser = await hydrateUser(initialSession)
          if (mounted) setUser(nextUser)
        } catch {
          if (mounted) await signOut()
        }
      }
      if (mounted) setLoading(false)
    }

    void initSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, nextSession: Session | null) => {
      if (!mounted) return
      if (event === "INITIAL_SESSION") return

      setSession(nextSession)

      if (!nextSession) {
        setUser(null)
        setLoading(false)
        return
      }

      if (event === "TOKEN_REFRESHED" && userRef.current) {
        setLoading(false)
        return
      }

      if (event === "SIGNED_IN" && userRef.current) {
        setLoading(false)
        return
      }

      try {
        const nextUser = await hydrateUser(nextSession)
        setUser(nextUser)
        if (!nextUser) setSession(null)
      } catch {
        await signOut()
      }

      setLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [configured, signOut])

  const signIn = useCallback(
    async (email: string, password: string) => {
      if (!configured) {
        return {
          error:
            "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
        }
      }
      const supabase = getSupabase()
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      })
      if (error) return { error: error.message }

      if (data.session) {
        const nextUser = await hydrateUser(data.session)
        setSession(data.session)
        setUser(nextUser)
        setLoading(false)
        if (!nextUser) {
          await supabase.auth.signOut()
          return {
            error: "Account is inactive or not linked to a franchise. Contact your administrator.",
          }
        }
        return { error: null, user: nextUser }
      }

      setLoading(false)
      return { error: null }
    },
    [configured],
  )

  const value = useMemo<AuthState>(
    () => ({ user, session, loading, configured, apiReady, signIn, signOut, refreshProfile }),
    [user, session, loading, configured, apiReady, signIn, signOut, refreshProfile],
  )

  return createElement(AuthCtx.Provider, { value }, children)
}

export function useAuth() {
  const ctx = useContext(AuthCtx)
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider")
  return ctx
}

export function useRequireRole(roles: UserRole[]) {
  const { user, loading } = useAuth()
  const allowed = user ? roles.includes(user.role) : false
  return { user, loading, allowed }
}
