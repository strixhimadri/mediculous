import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Keep Supabase on the server as Node packages — avoids broken vendor-chunk resolution in dev.
  serverExternalPackages: ["@supabase/supabase-js", "@supabase/ssr"],
}

export default nextConfig
