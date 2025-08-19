import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const mapButtonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-card/95 text-card-foreground shadow-soft hover:bg-primary hover:text-primary-foreground backdrop-blur-md border border-border/50",
        primary: "bg-gradient-primary text-primary-foreground shadow-medium hover:shadow-strong hover:scale-105",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        outline: "border border-input bg-transparent hover:bg-accent hover:text-accent-foreground",
        floating: "bg-gradient-glass backdrop-blur-xl shadow-medium hover:shadow-strong border border-border/30 hover:border-primary/50 transition-spring",
        streetview: "bg-accent text-accent-foreground shadow-medium hover:shadow-strong hover:scale-105"
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-lg px-8",
        icon: "h-10 w-10",
        floating: "h-12 w-12 rounded-xl"
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface MapButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof mapButtonVariants> {
  asChild?: boolean
}

const MapButton = React.forwardRef<HTMLButtonElement, MapButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(mapButtonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
MapButton.displayName = "MapButton"

export { MapButton, mapButtonVariants }