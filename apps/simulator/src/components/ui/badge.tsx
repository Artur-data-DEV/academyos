import type { ReactNode } from "react";

import { cn } from "@/lib/utils/format";

type BadgeProps = {
  children: ReactNode;
  tone?: "neutral" | "green" | "red" | "blue" | "amber";
  className?: string;
};

const toneClasses: Record<NonNullable<BadgeProps["tone"]>, string> = {
  neutral: "border border-[#555] bg-[#171819] text-[#D1D7DD]",
  green: "border border-emerald-200 bg-emerald-50 text-emerald-700",
  red: "border border-rose-200 bg-rose-50 text-rose-700",
  blue: "border border-[#555] bg-[#303031] text-[#F8F8F8]",
  amber: "border border-[#FFD369] bg-[#171819] text-[#FFD369]",
};

export function Badge({ children, tone = "neutral", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

