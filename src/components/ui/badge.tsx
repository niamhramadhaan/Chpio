import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border border-white/10 px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-teal-400/50 focus:ring-offset-2 dark:border-white/10 dark:focus:ring-teal-400/50",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[#1A201F]/80 text-white/85 shadow hover:bg-[#1A201F]/80/80 dark:bg-white/10 dark:text-[#1A201F] dark:hover:bg-white/10/80",
        secondary:
          "border-transparent bg-white/5 text-white/80 hover:bg-white/5/80 dark:bg-[#252b2a] dark:text-white/85 dark:hover:bg-[#252b2a]/80",
        destructive:
          "border-transparent bg-red-500 text-destructive-foreground shadow hover:bg-red-500/80 dark:bg-red-400 dark:hover:bg-red-400/80",
        outline: "text-white/85 dark:text-white/85",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
