"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Sun, Footprints, Flame, Heart, Moon, Scale, Apple } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { AppleHealthImport } from "@/components/shared/apple-health-import";
import { AIChat } from "@/components/shared/ai-chat";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AH } from "@/lib/apple-health";

interface AHRow { record_type: string; value: number | null; unit: string | null; start_date: string }

interface TodayStats {
  steps: number;
  activeCal: number;
  latestHR: number | null;
  sleepHrs: number | null;
  latestWeight: number | null;
  weightUnit: string;
}

function StatCard({ icon: Icon, label, value, unit, color }: {
  icon: React.ElementType; label: string; value: string | number | null; unit?: string; color: string;
}) {
  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <div className={`inline-flex h-8 w-8 rounded-lg items-center justify-center mb-2 ${color}`}>
          <Icon className="h-4 w-4" />
        </div>
        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
        <div className="flex items-baseline gap-1">
          <span className="text-xl font-semibold">{value ?? "—"}</span>
          {unit && value !== null && <span className="text-xs text-muted-foreground">{unit}</span>}
        </div>
      </CardContent>
    </Card>
  );
}

export default function TodayPage() {
  const [stats, setStats] = useState<TodayStats>({
    steps: 0, activeCal: 0, latestHR: null, sleepHrs: null, latestWeight: null, weightUnit: "kg",
  });
  const [hasData, setHasData] = useState(false);
  const [loaded, setLoaded] = useState(false);

  async function loadStats() {
    try {
      const res = await fetch("/api/apple-health/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          types: [AH.STEPS, AH.ACTIVE_CAL, AH.HEART_RATE, AH.SLEEP, AH.WEIGHT],
          days: 2,
        }),
      });
      if (!res.ok) { setLoaded(true); return; }
      const rows: AHRow[] = await res.json();
      if (!rows.length) { setLoaded(true); return; }

      setHasData(true);
      const today = format(new Date(), "yyyy-MM-dd");

      const todayRows = (type: string) =>
        rows.filter((r) => r.record_type === type && r.start_date.startsWith(today));
      const allRows = (type: string) => rows.filter((r) => r.record_type === type);

      const steps = todayRows(AH.STEPS).reduce((s, r) => s + (r.value ?? 0), 0);
      const activeCal = todayRows(AH.ACTIVE_CAL).reduce((s, r) => s + (r.value ?? 0), 0);
      const hrRows = allRows(AH.HEART_RATE);
      const latestHR = hrRows.length ? hrRows[hrRows.length - 1].value : null;
      const sleepRows = allRows(AH.SLEEP);
      const sleepHrs = sleepRows.length
        ? Math.round(sleepRows.reduce((s, r) => s + (r.value ?? 0), 0) * 10) / 10
        : null;
      const weightRows = allRows(AH.WEIGHT);
      const latestWeight = weightRows.length ? weightRows[weightRows.length - 1].value : null;
      const weightUnit = weightRows[0]?.unit ?? "kg";

      setStats({
        steps: Math.round(steps),
        activeCal: Math.round(activeCal),
        latestHR: latestHR ? Math.round(latestHR) : null,
        sleepHrs,
        latestWeight: latestWeight ? Math.round(latestWeight * 10) / 10 : null,
        weightUnit,
      });
    } catch {
      // Supabase not configured yet
    } finally {
      setLoaded(true);
    }
  }

  useEffect(() => { loadStats(); }, []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  const contextData = hasData
    ? `Today's stats — Steps: ${stats.steps}, Active calories: ${stats.activeCal} kcal, Heart rate: ${stats.latestHR ?? "N/A"} bpm, Last sleep: ${stats.sleepHrs ?? "N/A"}h, Latest weight: ${stats.latestWeight ?? "N/A"}${stats.weightUnit}.`
    : "No Apple Health data imported yet.";

  return (
    <div className="p-5 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <Sun className="h-4 w-4 text-amber-400" />
            <h1 className="text-lg font-semibold">{greeting()}</h1>
          </div>
          <p className="text-xs text-muted-foreground">{format(new Date(), "EEEE, MMMM d")}</p>
        </div>
        <AppleHealthImport onImported={loadStats} />
      </div>

      {/* Stats grid */}
      {loaded && !hasData && (
        <div className="text-center py-10 text-muted-foreground">
          <Apple className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">No Apple Health data yet</p>
          <p className="text-xs mt-1">Tap &quot;Import Apple Health&quot; to sync your iPhone data</p>
        </div>
      )}

      {hasData && (
        <div className="grid grid-cols-2 gap-3 mb-6">
          <StatCard icon={Footprints} label="Steps Today"   value={stats.steps.toLocaleString()}          unit="steps"        color="bg-sky-400/10 text-sky-400"     />
          <StatCard icon={Flame}      label="Active Cal."   value={stats.activeCal.toLocaleString()}       unit="kcal"         color="bg-orange-400/10 text-orange-400"/>
          <StatCard icon={Heart}      label="Heart Rate"    value={stats.latestHR}                         unit="bpm"          color="bg-rose-400/10 text-rose-400"   />
          <StatCard icon={Moon}       label="Last Sleep"    value={stats.sleepHrs}                         unit="hrs"          color="bg-indigo-400/10 text-indigo-400"/>
          <StatCard icon={Scale}      label="Weight"        value={stats.latestWeight}                     unit={stats.weightUnit} color="bg-emerald-400/10 text-emerald-400" />
        </div>
      )}

      {/* AI assistant */}
      <Tabs defaultValue="ai">
        <TabsList className="mb-4">
          <TabsTrigger value="ai">AI Assistant</TabsTrigger>
        </TabsList>
        <TabsContent value="ai">
          <Card>
            <CardContent className="pt-5 h-80 flex flex-col">
              <AIChat
                section="health"
                placeholder="Ask anything about your health today…"
                contextData={contextData}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
