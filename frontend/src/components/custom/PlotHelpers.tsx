import type { ReactNode } from "react";

// Helper components for consistent styling of stats and details
export function StatCard({
  label,
  value,
  icon,
  color = "text-[#3d4a3d]",
}: {
  label: string;
  value: number;
  icon: ReactNode;
  color?: string;
}) {
  return (
    <div className="bg-white p-3.5 rounded-2xl border border-gray-100 flex items-center gap-3 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_4px_15px_-4px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all">
      <div className="w-9 h-9 bg-[#f7f6f0] rounded-xl flex items-center justify-center text-[#3d4a3d] shadow-inner">
        {icon}
      </div>
      <div>
        <p className="text-[9px] text-gray-400 font-black uppercase tracking-wider truncate mb-0.5">
          {label}
        </p>
        <p className={`text-base font-black leading-none ${color}`}>
          {value.toLocaleString()}
        </p>
      </div>
    </div>
  );
}

// Reusable components for section headers and detail rows
export function SectionHeader({ title }: { title: string }) {
  return (
    <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">
      {title}
    </h4>
  );
}

// Used for displaying key value pairs in the details section of the plot card
export function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-gray-500 font-medium">{label}</span>
      <span className="font-bold text-[#1a1c1a]">{value || "N/A"}</span>
    </div>
  );
}
