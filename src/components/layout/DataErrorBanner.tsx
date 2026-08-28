import { AlertCircle, X } from "lucide-react"
import { useAppState } from "@/context/AppState"

export function DataErrorBanner() {
  const { error, refresh, loading, clearError } = useAppState()

  if (!error) return null

  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-[1rem] border border-line bg-white px-4 py-3 text-sm text-ink"
    >
      <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="font-medium">Could not load data</p>
        <p className="mt-0.5 text-ink-soft">{error}</p>
      </div>
      <button
        type="button"
        onClick={() => refresh()}
        disabled={loading}
        className="shrink-0 rounded-full px-3 py-1 text-xs font-medium hover:bg-canvas disabled:opacity-50"
      >
        Retry
      </button>
      <button
        type="button"
        onClick={clearError}
        className="shrink-0 rounded-full p-1 hover:bg-canvas"
        aria-label="Dismiss"
      >
        <X className="size-4" />
      </button>
    </div>
  )
}
