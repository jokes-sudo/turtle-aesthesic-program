"use client";

import { cn } from "@/lib/utils";

export function LiveBadge({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-400">
      <span className="relative flex h-1.5 w-1.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
      </span>
      LIVE
    </span>
  );
}

export function LiveValue({ value, unit, color, live }: {
  value: string | number | null; unit?: string; color?: string; live?: boolean;
}) {
  return (
    <div className={cn("flex items-baseline gap-1 transition-all", live && "animate-pulse-once")}>
      <span className={cn("text-xl font-semibold tabular-nums", color)}>{value ?? "—"}</span>
      {unit && value !== null && <span className="text-xs text-muted-foreground">{unit}</span>}
    </div>
  );
}
