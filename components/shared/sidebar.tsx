"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Dumbbell, Apple, Moon, CheckSquare, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Overview" },
  { href: "/dashboard/health", icon: Activity, label: "Health" },
  { href: "/dashboard/gym", icon: Dumbbell, label: "Gym" },
  { href: "/dashboard/nutrition", icon: Apple, label: "Nutrition" },
  { href: "/dashboard/sleep", icon: Moon, label: "Sleep" },
  { href: "/dashboard/todos", icon: CheckSquare, label: "To-Do" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 shrink-0 border-r border-border flex flex-col">
      <div className="p-6 border-b border-border">
        <h1 className="text-lg font-semibold text-foreground tracking-tight">Dashboard</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Your personal hub</p>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-border">
        <p className="text-xs text-muted-foreground">Powered by Claude AI</p>
      </div>
    </aside>
  );
}
