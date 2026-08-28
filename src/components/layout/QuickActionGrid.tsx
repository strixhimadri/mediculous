import { Link } from "@/lib/navigation"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export function QuickActionGrid({
  items,
}: {
  items: { to: string; label: string; description: string; icon: LucideIcon }[]
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          className={cn(
            "group flex min-h-[88px] flex-col justify-between rounded-lg border border-line bg-white p-4",
            "transition-all duration-200 hover:border-steel hover:shadow-[var(--shadow-md)]",
          )}
        >
          <item.icon className="size-5 text-steel transition-colors group-hover:text-navy" aria-hidden />
          <div>
            <p className="font-medium text-ink">{item.label}</p>
            <p className="mt-0.5 text-xs text-steel">{item.description}</p>
          </div>
        </Link>
      ))}
    </div>
  )
}
