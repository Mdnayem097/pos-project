interface BadgeProps {
  children: React.ReactNode;
  tone?: "brand" | "green" | "red" | "amber" | "stone";
}

const tones = {
  brand: "bg-brand-50 dark:bg-brand-500/15 text-brand-700 dark:text-brand-300 ring-brand-200 dark:ring-brand-500/30",
  green: "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 ring-emerald-200 dark:ring-emerald-500/30",
  red: "bg-red-50 dark:bg-red-500/15 text-red-700 dark:text-rose-400 ring-red-200 dark:ring-rose-500/30",
  amber: "bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 ring-amber-200 dark:ring-amber-500/30",
  stone: "bg-stone-100 dark:bg-[#162035] text-stone-700 dark:text-slate-300 ring-stone-200 dark:ring-[#1F293D]",
};

export default function Badge({ children, tone = "stone" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
