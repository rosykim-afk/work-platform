"use client"

import * as React from "react"
import { ToggleGroup as ToggleGroupPrimitive } from "@base-ui/react/toggle-group"
import { Toggle } from "@base-ui/react/toggle"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const toggleVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors hover:bg-muted hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-pressed:bg-accent data-pressed:text-accent-foreground h-8",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        outline:
          "border border-input bg-transparent hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        default: "px-3",
        sm: "h-7 px-2.5 text-xs",
        lg: "h-10 px-5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

interface ToggleGroupProps<Value extends string>
  extends ToggleGroupPrimitive.Props<Value> {
  className?: string
}

function ToggleGroup<Value extends string>({
  className,
  ...props
}: ToggleGroupProps<Value>) {
  return (
    <ToggleGroupPrimitive
      data-slot="toggle-group"
      className={cn("flex items-center gap-1", className)}
      {...props}
    />
  )
}

interface ToggleGroupItemProps<Value extends string>
  extends Toggle.Props<Value>,
    VariantProps<typeof toggleVariants> {
  className?: string
}

function ToggleGroupItem<Value extends string>({
  className,
  variant,
  size,
  ...props
}: ToggleGroupItemProps<Value>) {
  return (
    <Toggle
      data-slot="toggle-group-item"
      className={cn(toggleVariants({ variant, size }), className)}
      {...props}
    />
  )
}

export { ToggleGroup, ToggleGroupItem, toggleVariants }
