import React from 'react';
import { cn } from '../../utils/cn';

export const Card = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-[26px] border border-white/70 bg-[linear-gradient(180deg,#fbfdff_0%,#f2f6fc_100%)] text-gray-950 shadow-[var(--card-shadow)]",
      "transition-all duration-300 stage-card-lift",
      className
    )}
    {...props}
  />
));
Card.displayName = "Card"

export const CardHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader"

export const CardTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("text-2xl font-bold leading-none tracking-tight", className)}
    {...props}
  />
));
CardTitle.displayName = "CardTitle"

export const CardContent = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent"
