import { Activity, Dumbbell, Apple, Moon, CheckSquare, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

const sections = [
  {
    href: "/dashboard/health",
    icon: Activity,
    title: "Health Metrics",
    description: "Track weight, BMI, body fat %, and measurements",
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
  },
  {
    href: "/dashboard/gym",
    icon: Dumbbell,
    title: "Gym Progress",
    description: "Log workouts, track PRs, and monitor volume",
    color: "text-orange-400",
    bg: "bg-orange-400/10",
  },
  {
    href: "/dashboard/nutrition",
    icon: Apple,
    title: "Nutrition",
    description: "Monitor calories, macros, and meal patterns",
    color: "text-rose-400",
    bg: "bg-rose-400/10",
  },
  {
    href: "/dashboard/sleep",
    icon: Moon,
    title: "Sleep & Recovery",
    description: "Track sleep duration, quality, and recovery",
    color: "text-indigo-400",
    bg: "bg-indigo-400/10",
  },
  {
    href: "/dashboard/todos",
    icon: CheckSquare,
    title: "To-Do List",
    description: "Manage tasks, priorities, and deadlines",
    color: "text-sky-400",
    bg: "bg-sky-400/10",
  },
];

export default function DashboardPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <TrendingUp className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-semibold">Overview</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Track your health, fitness, and productivity — all in one place with AI-powered insights.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {sections.map(({ href, icon: Icon, title, description, color, bg }) => (
          <Link key={href} href={href}>
            <Card className="h-full hover:border-primary/40 transition-colors cursor-pointer group">
              <CardHeader className="pb-3">
                <div className={`inline-flex w-10 h-10 rounded-lg ${bg} items-center justify-center mb-2`}>
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
                <CardTitle className="text-base group-hover:text-primary transition-colors">{title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{description}</p>
                <p className="text-xs text-primary mt-3 font-medium">AI assistant included →</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
