import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-teal-400/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:w-4 h-4 [&_svg]:shrink-0 dark:focus-visible:ring-teal-400/50",
  {
    variants: {
      variant: {
        default:
          "bg-[#1A201F]/80 text-white/85 shadow hover:bg-[#1A201F]/80/90 dark:bg-white/10 dark:text-[#1A201F] dark:hover:bg-white/10/90",
        destructive:
          "bg-red-500 text-destructive-foreground shadow-sm hover:bg-red-500/90 dark:bg-red-400 dark:hover:bg-red-400/90",
        outline:
          "border border-white/10 bg-white/5 shadow-sm hover:bg-white/5 hover:text-white/80 dark:border-white/15 dark:bg-[#1A201F]/80 dark:hover:bg-[#252b2a] dark:hover:text-white/85",
        secondary:
          "bg-white/5 text-white/80 shadow-sm hover:bg-white/5/80 dark:bg-[#252b2a] dark:text-white/85 dark:hover:bg-[#252b2a]/80",
        ghost: "hover:bg-white/5 hover:text-white/80 dark:hover:bg-[#252b2a] dark:hover:text-white/85",
        link: "text-white/80 underline-offset-4 hover:underline dark:text-white/60",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
