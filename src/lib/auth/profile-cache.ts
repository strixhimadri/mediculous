import type { AuthContext } from "@/lib/auth/requireUser"

type CacheEntry = { ctx: AuthContext; expiresAt: number }

const cache = new Map<string, CacheEntry>()
const TTL_MS = 60_000

export function getCachedProfile(userId: string): AuthContext | null {
  const entry = cache.get(userId)
  if (!entry) return null
  if (entry.expiresAt <= Date.now()) {
    cache.delete(userId)
    return null
  }
  return entry.ctx
}

export function setCachedProfile(userId: string, ctx: AuthContext) {
  cache.set(userId, { ctx, expiresAt: Date.now() + TTL_MS })
}

export function invalidateProfileCache(userId?: string) {
  if (userId) cache.delete(userId)
  else cache.clear()
}
