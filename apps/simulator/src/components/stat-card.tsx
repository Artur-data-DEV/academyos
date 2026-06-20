import { Card } from "@/components/ui/card";

type StatCardProps = {
  label: string;
  value: string;
  hint?: string;
};

export function StatCard({ label, value, hint }: StatCardProps) {
  return (
    <Card>
      <p className="text-xs text-[#D1D7DD] md:text-sm">{label}</p>
      <p className="mt-1 text-lg font-semibold text-[#F8F8F8] md:mt-2 md:text-2xl">
        {value}
      </p>
      {hint ? <p className="mt-0.5 text-xs text-[#A2AAB1]">{hint}</p> : null}
    </Card>
  );
}

