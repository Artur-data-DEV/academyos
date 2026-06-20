import type { ReactNode } from "react";

import { cn } from "@/lib/utils/format";

type CardProps = {
  children: ReactNode;
  className?: string;
};

export function Card({ children, className }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-[#444] bg-[#303031] p-3 shadow-[0_12px_28px_rgba(0,0,0,0.35)] md:p-5",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardTitle({ children, className }: CardProps) {
  return (
    <h3 className={cn("text-base font-semibold text-[#FFD369]", className)}>{children}</h3>
  );
}

export function CardDescription({ children, className }: CardProps) {
  return <p className={cn("mt-1 text-sm text-[#D1D7DD]", className)}>{children}</p>;
}
