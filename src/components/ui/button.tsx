import Link from "next/link";
import { type ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  href?: string;
}

const variants = {
  primary:
    "bg-ink text-surface hover:bg-ink/90 shadow-sm shadow-ink/10",
  secondary:
    "bg-surface text-ink border border-[var(--border)] hover:border-gold/40 hover:bg-cream-dark/50",
  ghost: "bg-transparent text-ink-muted hover:text-ink hover:bg-ink/5",
  danger: "bg-red-600/90 text-white hover:bg-red-700",
};

const sizes = {
  sm: "px-4 py-2 text-xs tracking-wide",
  md: "px-6 py-2.5 text-sm",
  lg: "px-8 py-3.5 text-sm tracking-wide",
};

function buttonClassName(
  variant: keyof typeof variants,
  size: keyof typeof sizes,
  className: string,
  disabled?: boolean
) {
  return `inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-200 ${
    disabled ? "opacity-40 cursor-not-allowed pointer-events-none" : ""
  } ${variants[variant]} ${sizes[size]} ${className}`;
}

export function Button({
  variant = "primary",
  size = "md",
  loading,
  className = "",
  children,
  disabled,
  href,
  ...props
}: ButtonProps) {
  const classes = buttonClassName(variant, size, className, disabled || loading);

  if (href && !disabled && !loading) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button
      className={classes}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  );
}
