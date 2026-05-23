"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sun, Heart, Zap, CheckSquare } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/dashboard",         icon: Sun,         label: "Today"   },
  { href: "/dashboard/health",  icon: Heart,       label: "Health"  },
  { href: "/dashboard/fitness", icon: Zap,         label: "Fitness" },
  { href: "/dashboard/todos",   icon: CheckSquare, label: "Tasks"   },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex items-stretch justify-around h-16 max-w-2xl mx-auto">
        {tabs.map(({ href, icon: Icon, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 text-xs font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5 transition-transform",
                  active && "scale-110"
                )}
                strokeWidth={active ? 2.5 : 1.75}
              />
              <span className={cn("text-[10px] tracking-wide", active && "font-semibold")}>
                {label}
              </span>
              {active && (
                <span className="absolute bottom-0 w-8 h-0.5 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
