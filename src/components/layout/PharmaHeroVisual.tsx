import Image from "next/image"
import { cn } from "@/lib/utils"

type PharmaHeroVisualProps = {
  className?: string
  priority?: boolean
  variant?: "card" | "panel" | "bleed"
}

export function PharmaHeroVisual({
  className,
  priority = false,
  variant = "card",
}: PharmaHeroVisualProps) {
  if (variant === "bleed") {
    return (
      <div className={cn("relative isolate overflow-hidden", className)} aria-hidden>
        <Image
          src="/images/hero-pharma.jpg"
          alt=""
          fill
          priority={priority}
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-white/88 via-white/55 to-white/72" />
        <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-white/40" />
      </div>
    )
  }

  return (
    <div
      className={cn(
        "relative isolate overflow-hidden shadow-[var(--shadow-lg)]",
        variant === "panel" ? "rounded-[2rem]" : "rounded-[1.75rem]",
        className,
      )}
      aria-hidden
    >
      <Image
        src="/images/hero-pharma.jpg"
        alt="Translucent pharmaceutical capsules"
        fill
        priority={priority}
        sizes="(max-width: 1024px) 100vw, 560px"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-white/20" />
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-white/80 to-transparent" />
    </div>
  )
}
