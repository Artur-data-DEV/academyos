import { cn } from "@/lib/utils/format";

type ProgressBarProps = {
  value: number;
  className?: string;
};

export function ProgressBar({ value, className }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div className={cn("h-2 w-full rounded-full bg-[#444]", className)}>
      <div
        className="h-2 rounded-full bg-gradient-to-r from-[#FFD369] to-[#BC973E] transition-all"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

