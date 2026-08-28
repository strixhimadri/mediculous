import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  className,
}: {
  label: string
  value: React.ReactNode
  icon?: LucideIcon
  hint?: string
  className?: string
}) {
  return (
    <article
      className={cn(
        "glass group p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-ink-soft">{label}</p>
        {Icon ? (
          <span className="grid size-9 place-items-center rounded-xl bg-canvas text-ink transition-transform group-hover:scale-105">
            <Icon className="size-4" aria-hidden />
          </span>
        ) : null}
      </div>
      <p className="mt-2 text-xl font-semibold tabular-nums text-ink sm:text-2xl">{value}</p>
      {hint ? <p className="mt-1 text-xs text-ink-soft">{hint}</p> : null}
    </article>
  )
}
