import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const brandButton =
  "border border-brand-dark bg-brand text-white shadow-[0_8px_22px_rgba(0,0,0,0.18)] hover:bg-brand-hover hover:shadow-[0_12px_28px_rgba(0,0,0,0.22)]"

const actionButton =
  "border border-line bg-white text-ink shadow-[var(--shadow-sm)] hover:border-ink/20 hover:bg-canvas"

const buttonVariants = cva(
  "inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition-all duration-200 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45 cursor-pointer focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-black/20 focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        gel: brandButton,
        peach: brandButton,
        glass: actionButton,
        outline:
          "border-2 border-ink bg-white text-ink hover:border-ink hover:bg-canvas",
        ghost: "bg-transparent text-ink-soft hover:bg-canvas hover:text-ink",
        danger: brandButton,
        day: actionButton,
      },
      size: {
        default: "h-11 px-5",
        sm: "h-9 min-h-9 px-4 text-xs",
        lg: "h-12 min-h-12 px-7 text-base",
        icon: "size-11 min-h-11 rounded-full",
        "icon-sm": "size-8 min-h-8 min-w-8 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "gel",
      size: "default",
    },
  },
)

const Button = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean }
>(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  return <Comp ref={ref} className={cn(buttonVariants({ variant, size, className }))} {...props} />
})
Button.displayName = "Button"

export { Button, buttonVariants }
