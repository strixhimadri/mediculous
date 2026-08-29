"use client"

import { useEffect, useState } from "react"
import { CheckCircle2, Loader2, XCircle } from "lucide-react"
import { GlassPanel } from "@/components/layout/GlassPanel"
import { PageHeader } from "@/components/layout/PageHeader"
import { apiFetch } from "@/lib/api/http"
import { getRouteMeta } from "@/lib/routeMeta"

export function DevHealthPage() {
  const meta = getRouteMeta("/app/dev/health")
  const [health, setHealth] = useState<{ ok: boolean; service: string; timestamp: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void (async () => {
      try {
        const data = await apiFetch<{ ok: boolean; service: string; timestamp: string }>("/api/health")
        setHealth(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Health check failed")
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const checks = [
    { label: "API health", ok: health?.ok ?? false, detail: health?.service ?? error ?? "—" },
    {
      label: "Supabase URL",
      ok: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
      detail: process.env.NEXT_PUBLIC_SUPABASE_URL ? "Configured (client)" : "Missing",
    },
    {
      label: "Service role key",
      ok: false,
      detail: "Server-only — check .env on deploy",
    },
  ]

  return (
    <div className="space-y-5">
      <PageHeader title={meta.title} description={meta.description} crumbs={meta.crumbs} />
      <GlassPanel className="p-5">
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="size-6 animate-spin text-ink-soft" />
          </div>
        ) : (
          <ul className="space-y-3">
            {checks.map((check) => (
              <li
                key={check.label}
                className="flex items-start justify-between gap-4 rounded-xl border border-line bg-white px-4 py-3"
              >
                <div>
                  <p className="font-medium text-ink">{check.label}</p>
                  <p className="mt-0.5 text-xs text-ink-soft">{check.detail}</p>
                  {health?.timestamp && check.label === "API health" ? (
                    <p className="mt-1 font-mono text-[10px] text-steel">{health.timestamp}</p>
                  ) : null}
                </div>
                {check.ok ? (
                  <CheckCircle2 className="size-5 shrink-0 text-ink" />
                ) : (
                  <XCircle className="size-5 shrink-0 text-steel" />
                )}
              </li>
            ))}
          </ul>
        )}
      </GlassPanel>
    </div>
  )
}
