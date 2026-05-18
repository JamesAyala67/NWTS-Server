import React from "react";
import { Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function StatMiniCard({
  label,
  value,
}: {
  label: string;
  value: string;
  isCurrency?: boolean;
}) {
  return (
    <div className="bg-white px-4 py-2 rounded-lg border border-gray-100 shadow-sm flex flex-col min-w-[120px]">
      <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">
        {label}
      </span>
      <span className="text-sm font-bold text-[#1e293b]">{value}</span>
    </div>
  );
}

export function InfoCard({
  title,
  icon,
  children,
  onAdd,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  onAdd?: () => void;
}) {
  return (
    <Card className="border-none shadow-sm bg-white overflow-hidden flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between border-b border-black pt-1 pb-2 px-4 shrink-0">
        <div className="flex items-center gap-2">
          {icon}
          <CardTitle className="text-xs font-bold text-gray-600 uppercase tracking-tight">
            {title}
          </CardTitle>
        </div>
        {onAdd && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onAdd}
            className="h-6 w-6 p-0 rounded-full hover:bg-gray-100 text-[#4a5a4a]"
          >
            <Plus className="h-3 w-3" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="pb-4 px-4 flex-1">{children}</CardContent>
    </Card>
  );
}

export function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
        {label}
      </span>
      <span className="text-gray-700 font-medium break-words leading-tight">
        {value}
      </span>
    </div>
  );
}
