import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-[11px] font-medium",
  {
    variants: {
      tone: {
        day: "bg-canvas text-ink ring-1 ring-line",
        hold: "bg-canvas text-ink-soft ring-1 ring-line",
        night: "bg-canvas text-ink-soft ring-1 ring-line",
        rose: "bg-canvas text-ink-soft ring-1 ring-line",
        cobalt: "bg-canvas text-ink ring-1 ring-line",
        glass: "bg-white text-ink-soft ring-1 ring-line",
      },
    },
    defaultVariants: { tone: "glass" },
  },
)

function Badge({
  className,
  tone,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />
}

export { Badge }
