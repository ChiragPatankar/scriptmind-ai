"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: "default" | "glass" | "search";
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  error?: string;
  label?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    { className, variant = "default", leftIcon, rightIcon, error, label, type, id: propId, ...props },
    ref
  ) => {
    const generatedId = React.useId();
    const inputId = propId || generatedId;

    const variants = {
      default:
        "bg-surface-2 border border-border focus:border-accent/60 focus:ring-2 focus:ring-accent/20",
      glass:
        "glass border border-white/10 focus:border-accent/40 focus:ring-2 focus:ring-accent/20",
      search:
        "bg-surface-2/80 border border-border/60 focus:border-accent/60 focus:ring-2 focus:ring-accent/20 pl-5",
    };

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-text-secondary"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <span className="absolute left-3.5 text-text-muted pointer-events-none">
              {leftIcon}
            </span>
          )}
          <input
            id={inputId}
            type={type}
            className={cn(
              "flex h-11 w-full rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted",
              "transition-all duration-200 outline-none",
              "disabled:cursor-not-allowed disabled:opacity-50",
              variants[variant],
              leftIcon && "pl-10",
              rightIcon && "pr-10",
              error && "border-red-500/60 focus:border-red-500 focus:ring-red-500/20",
              className
            )}
            ref={ref}
            {...props}
          />
          {rightIcon && (
            <span className="absolute right-3.5 text-text-muted">
              {rightIcon}
            </span>
          )}
        </div>
        {error && (
          <p className="text-xs text-red-400 mt-0.5">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };
