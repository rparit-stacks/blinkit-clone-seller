import clsx from "clsx";
import type { LucideIcon } from "lucide-react";

interface Props {
  label: string;
  value: string | number;
  sub?: string;
  icon: LucideIcon;
  color?: "blue" | "green" | "yellow" | "purple" | "red";
  trend?: { value: number; label: string };
}

const colors = {
  blue:   { bg: "bg-blue-50",   icon: "bg-blue-600",   text: "text-blue-600" },
  green:  { bg: "bg-green-50",  icon: "bg-green-600",  text: "text-green-600" },
  yellow: { bg: "bg-amber-50",  icon: "bg-amber-500",  text: "text-amber-600" },
  purple: { bg: "bg-purple-50", icon: "bg-purple-600", text: "text-purple-600" },
  red:    { bg: "bg-red-50",    icon: "bg-red-500",    text: "text-red-600" },
};

export default function StatCard({ label, value, sub, icon: Icon, color = "blue", trend }: Props) {
  const c = colors[color];
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className={clsx("w-10 h-10 rounded-xl flex items-center justify-center", c.icon)}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {trend && (
          <span className={clsx(
            "text-xs font-semibold px-2 py-0.5 rounded-full",
            trend.value >= 0 ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
          )}>
            {trend.value >= 0 ? "+" : ""}{trend.value}% {trend.label}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-sm text-slate-500 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}
