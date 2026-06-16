import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-md border border-white/10 bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-white/85 placeholder:text-white/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-teal-400/50 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:border-white/10 dark:border-white/15 dark:file:text-white/85 dark:placeholder:text-white/40 dark:focus-visible:ring-teal-400/50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
