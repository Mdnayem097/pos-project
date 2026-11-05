import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  tone?: "brand" | "green" | "red" | "stone";
}

const iconTones = {
  brand: "bg-brand-50 text-brand-600",
  green: "bg-emerald-50 text-emerald-700",
  red: "bg-red-50 text-red-600",
  stone: "bg-stone-100 text-stone-600",
};

const topBorders = {
  brand: "group-hover:bg-brand-500",
  green: "group-hover:bg-emerald-500",
  red: "group-hover:bg-red-500",
  stone: "group-hover:bg-stone-700",
};

export default function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "brand",
}: StatCardProps) {
  return (
    <div className="card group relative overflow-hidden flex items-start justify-between gap-3 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div
        className={`absolute inset-x-0 top-0 h-[4px] bg-transparent transition-all duration-200 rounded-t-2xl ${topBorders[tone]}`}
      />
      <div className="min-w-0">
        <p className="text-sm text-stone-500 transition-colors group-hover:text-stone-800">{label}</p>
        <p className="mt-1.5 truncate font-display text-3xl font-semibold tabular-nums tracking-tight transition-transform duration-200 group-hover:translate-x-0.5">
          {value}
        </p>
        {hint && <p className="mt-1 text-xs text-stone-500">{hint}</p>}
      </div>
      <div className={`rounded-lg p-2.5 transition-colors duration-200 ${iconTones[tone]}`}>
        <Icon size={20} />
      </div>
    </div>
  );
}
