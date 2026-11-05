interface BadgeProps {
  children: React.ReactNode;
  tone?: "brand" | "green" | "red" | "amber" | "stone";
}

const tones = {
  brand: "bg-brand-50 text-brand-700 ring-brand-200",
  green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  red: "bg-red-50 text-red-700 ring-red-200",
  amber: "bg-amber-50 text-amber-700 ring-amber-200",
  stone: "bg-stone-100 text-stone-700 ring-stone-200",
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
