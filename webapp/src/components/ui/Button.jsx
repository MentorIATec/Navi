import React from 'react';
import { cn } from '../../utils/cn';

export const Button = React.forwardRef(({ className, variant = "primary", size = "default", disabled, isLoading, children, ...props }, ref) => {
  const baseStyles = "inline-flex items-center justify-center whitespace-nowrap rounded-2xl text-sm font-semibold ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--navy-700)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 font-display";
  
  const variants = {
    primary: "bg-[linear-gradient(135deg,var(--navy-500)_0%,var(--navy-700)_100%)] text-white shadow-[0_18px_40px_rgba(16,38,69,0.22)] hover:-translate-y-0.5 hover:shadow-[0_24px_44px_rgba(16,38,69,0.28)] active:scale-[0.98]",
    secondary: "bg-[var(--coral-100)] text-[var(--navy-700)] hover:bg-[#f5e1dc] active:scale-[0.98]",
    outline: "border border-[rgba(15,76,129,0.18)] bg-white/75 text-[var(--navy-700)] hover:bg-white active:scale-[0.98]",
    ghost: "text-[var(--navy-600)] hover:bg-white/60 hover:text-[var(--navy-700)]",
  };

  const sizes = {
    default: "h-12 px-6 py-2",
    sm: "h-9 rounded-md px-3",
    lg: "h-14 rounded-xl px-8 text-base",
    icon: "h-10 w-10",
  };

  return (
    <button
      ref={ref}
      disabled={disabled || isLoading}
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {isLoading ? (
        <svg className="mr-2 h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : null}
      {children}
    </button>
  );
});
Button.displayName = "Button";
