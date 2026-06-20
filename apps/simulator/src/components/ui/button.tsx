import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils/format";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
};

const variantClass: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "bg-[#FFD369] text-[#171819] hover:bg-[#EBB91B] hover:text-[#171819] disabled:bg-[#777] disabled:text-[#D1D7DD]",
  secondary:
    "border border-[#555] bg-[#303031] text-white hover:bg-[#3A3B3D] hover:text-white disabled:bg-[#555] disabled:text-[#BBB]",
  ghost:
    "border border-[#555] bg-[#303031] text-[#F8F8F8] hover:border-[#FFD369] hover:bg-[#3A3B3D] hover:text-[#FFD369]",
  danger:
    "bg-rose-600 text-white hover:bg-rose-500 hover:text-white disabled:bg-rose-300 disabled:text-rose-100",
};

export function Button({
  children,
  className,
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed",
        variantClass[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

