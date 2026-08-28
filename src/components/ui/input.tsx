import * as React from "react"
import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      ref={ref}
      className={cn(
        "h-10 w-full rounded-xl border border-line bg-white px-3.5 text-sm text-ink shadow-sm placeholder:text-ink-soft focus-visible:border-brand/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/20",
        className,
      )}
      {...props}
    />
  ),
)
Input.displayName = "Input"

export { Input }
