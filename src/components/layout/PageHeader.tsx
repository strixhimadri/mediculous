import type { ReactNode } from "react"
import { Link } from "@/lib/navigation"
import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

export function PageHeader({
  title,
  description,
  crumbs,
  actions,
  className,
}: {
  title: string
  description?: string
  crumbs?: { label: string; to?: string }[]
  actions?: ReactNode
  className?: string
}) {
  return (
    <header className={cn("space-y-3", className)}>
      {crumbs && crumbs.length > 0 ? (
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-xs text-steel">
          {crumbs.map((crumb, i) => (
            <span key={`${crumb.label}-${i}`} className="inline-flex items-center gap-1">
              {i > 0 ? <ChevronRight className="size-3 opacity-60" aria-hidden /> : null}
              {crumb.to ? (
                <Link to={crumb.to} className="transition-colors hover:text-navy">
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-ink-soft">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      ) : null}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl text-ink sm:text-3xl">{title}</h1>
          {description ? <p className="mt-1 max-w-2xl text-sm leading-relaxed text-steel">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  )
}
