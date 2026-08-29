import { createClient } from "@supabase/supabase-js"

function assertAdminKey(key: string): void {
  if (key.startsWith("sb_publishable_")) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is set to a publishable key. Create a secret key in Supabase → Settings → API Keys and paste the sb_secret_… value instead.",
    )
  }
  if (key.startsWith("eyJ")) return // legacy JWT service_role key
  if (!key.startsWith("sb_secret_")) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY must be a secret key (sb_secret_…) or legacy service_role JWT from Supabase → Settings → API Keys.",
    )
  }
}

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL are required")
  }
  assertAdminKey(serviceKey)
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
