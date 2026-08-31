import Image from "next/image"
import { cn } from "@/lib/utils"

type PharmaHeroVisualProps = {
  className?: string
  priority?: boolean
  variant?: "card" | "panel" | "bleed" | "dramatic"
}

export function PharmaHeroVisual({
  className,
  priority = false,
  variant = "card",
}: PharmaHeroVisualProps) {
  const imageSrc = variant === "dramatic" ? "/images/hero-vials.jpg" : "/images/hero-vials.jpg"

  if (variant === "bleed") {
    return (
      <div className={cn("relative isolate overflow-hidden", className)} aria-hidden>
        <Image
          src={imageSrc}
          alt=""
          fill
          priority={priority}
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-white/90 via-white/60 to-white/80" />
        <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-white/35" />
      </div>
    )
  }

  if (variant === "dramatic") {
    return (
      <div
        className={cn(
          "relative isolate overflow-hidden rounded-[2rem] bg-[#1c1c1c] shadow-[0_32px_80px_rgba(0,0,0,0.22)]",
          className,
        )}
        aria-hidden
      >
        <Image
          src={imageSrc}
          alt="Pharmaceutical vials with clinical labeling"
          fill
          priority={priority}
          sizes="(max-width: 1024px) 100vw, 560px"
          className="object-cover object-center"
        />
        <div
          className="absolute inset-0 opacity-90"
          style={{
            background:
              "linear-gradient(118deg, rgba(255,255,255,0.42) 0%, rgba(255,255,255,0.08) 28%, transparent 52%), linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 45%)",
          }}
        />
        <div className="absolute inset-y-0 left-[18%] w-[38%] bg-gradient-to-r from-white/25 via-white/10 to-transparent blur-2xl" />
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
        src={imageSrc}
        alt="Pharmaceutical vials with clinical labeling"
        fill
        priority={priority}
        sizes="(max-width: 1024px) 100vw, 560px"
        className="object-cover object-center"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-white/15" />
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-white/75 to-transparent" />
    </div>
  )
}
