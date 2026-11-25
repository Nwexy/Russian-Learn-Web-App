import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "accent";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variantClasses = {
    default: "border-transparent bg-primary/15 text-primary border border-primary/30",
    secondary: "border-transparent bg-secondary text-secondary-foreground border border-border/50",
    destructive: "border-transparent bg-rose-500/15 text-rose-500 border border-rose-500/30",
    outline: "text-foreground border border-border/80 bg-background/50",
    accent: "border-transparent bg-purple-500/15 text-purple-400 border border-purple-500/30",
  }[variant];

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-lg px-2.5 py-0.5 text-xs font-semibold tracking-wide transition-colors",
        variantClasses,
        className
      )}
      {...props}
    />
  );
}

export { Badge };

