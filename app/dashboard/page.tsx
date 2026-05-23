"use client";

import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { Sun, Footprints, Flame, Heart, Moon, Scale, Apple } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppleHealthImport } from "@/components/shared/apple-health-import";
import { ShortcutSetup } from "@/components/shared/shortcut-setup";
import { AIChat } from "@/components/shared/ai-chat";
import { LiveBadge } from "@/components/shared/live-badge";
import { useRealtimeAH } from "@/hooks/use-realtime-ah";
import { AH } from "@/lib/apple-health";

interface AHRow { record_type: string; value: number | null; unit: string | null; start_date: string }

interface TodayStats {
  steps: number; activeCal: number;
  latestHR: number | null; sleepHrs: number | null;
  latestWeight: number | null; weightUnit: string;
}

function StatCard({ icon: Icon, label, value, unit, color, live }: {
  icon: React.ElementType; label: string; value: string | number | null;
  unit?: string; color: string; live?: boolean;
}) {
  return (
    <Card className="relative overflow-hidden">
      {live && (
        <span className="absolute top-2.5 right-2.5">
          <LiveBadge active />
        </span>
      )}
      <CardContent className="pt-4 pb-4">
        <div className={`inline-flex h-8 w-8 rounded-lg items-center justify-center mb-2 ${color}`}>
          <Icon className="h-4 w-4" />
        </div>
        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
        <div className="flex items-baseline gap-1">
          <span className="text-xl font-semibold tabular-nums">{value ?? "—"}</span>
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
  const [flashHR, setFlashHR] = useState(false);

  const loadStats = useCallback(async () => {
    try {
      const res = await fetch("/api/apple-health/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          types: [AH.STEPS, AH.ACTIVE_CAL, AH.HEART_RATE, AH.SLEEP, AH.WEIGHT],
          days: 2,
        }),
      });
      if (!res.ok) return;
      const rows: AHRow[] = await res.json();
      if (!rows.length) return;
      setHasData(true);

      const today = format(new Date(), "yyyy-MM-dd");
      const todayRows = (type: string) => rows.filter((r) => r.record_type === type && r.start_date.startsWith(today));
      const allRows   = (type: string) => rows.filter((r) => r.record_type === type);

      const steps     = todayRows(AH.STEPS).reduce((s, r) => s + (r.value ?? 0), 0);
      const activeCal = todayRows(AH.ACTIVE_CAL).reduce((s, r) => s + (r.value ?? 0), 0);
      const hrRows    = allRows(AH.HEART_RATE);
      const latestHR  = hrRows.length ? Math.round(hrRows[hrRows.length - 1].value ?? 0) : null;
      const sleepRows = allRows(AH.SLEEP);
      const sleepHrs  = sleepRows.length
        ? Math.round(sleepRows.reduce((s, r) => s + (r.value ?? 0), 0) * 10) / 10 : null;
      const weightRows   = allRows(AH.WEIGHT);
      const latestWeight = weightRows.length ? Math.round((weightRows[weightRows.length - 1].value ?? 0) * 10) / 10 : null;

      setStats(prev => {
        // Flash HR card if it changed
        if (prev.latestHR !== latestHR && latestHR !== null) setFlashHR(true);
        return { steps: Math.round(steps), activeCal: Math.round(activeCal), latestHR, sleepHrs, latestWeight, weightUnit: weightRows[0]?.unit ?? "kg" };
      });
    } catch { /* Supabase not set up */ }
    finally { setLoaded(true); }
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  // Flash effect clears after 1s
  useEffect(() => {
    if (!flashHR) return;
    const t = setTimeout(() => setFlashHR(false), 1000);
    return () => clearTimeout(t);
  }, [flashHR]);

  // Supabase Realtime — auto-refresh when Shortcut pushes new data
  const isLive = useRealtimeAH(loadStats);

  const greeting = () => {
    const h = new Date().getHours();
    return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  };

  const aiContext = hasData
    ? `Today — Steps: ${stats.steps.toLocaleString()}, Active cal: ${stats.activeCal} kcal, HR: ${stats.latestHR ?? "N/A"} bpm, Sleep: ${stats.sleepHrs ?? "N/A"}h, Weight: ${stats.latestWeight ?? "N/A"}${stats.weightUnit}.`
    : "No Apple Health data yet.";

  return (
    <div className="p-5 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <Sun className="h-4 w-4 text-amber-400" />
            <h1 className="text-lg font-semibold">{greeting()}</h1>
            {isLive && <LiveBadge active />}
          </div>
          <p className="text-xs text-muted-foreground">{format(new Date(), "EEEE, MMMM d")}</p>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          <ShortcutSetup />
          <AppleHealthImport onImported={loadStats} />
        </div>
      </div>

      {loaded && !hasData && (
        <div className="text-center py-12 text-muted-foreground">
          <Apple className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">No data yet</p>
          <p className="text-xs mt-1 mb-4">Set up Live Sync for real-time readings, or import a past export</p>
        </div>
      )}

      {hasData && (
        <div className="grid grid-cols-2 gap-3 mb-6">
          <StatCard icon={Footprints} label="Steps Today"    value={stats.steps.toLocaleString()}        unit="steps"           color="bg-sky-400/10 text-sky-400"      live={isLive} />
          <StatCard icon={Flame}      label="Active Cal"     value={stats.activeCal.toLocaleString()}     unit="kcal"            color="bg-orange-400/10 text-orange-400" live={isLive} />
          <StatCard icon={Heart}      label="Heart Rate"     value={stats.latestHR}                       unit="bpm"             color="bg-rose-400/10 text-rose-400"    live={isLive} />
          <StatCard icon={Moon}       label="Last Sleep"     value={stats.sleepHrs}                       unit="hrs"             color="bg-indigo-400/10 text-indigo-400" />
          <StatCard icon={Scale}      label="Weight"         value={stats.latestWeight}                   unit={stats.weightUnit} color="bg-emerald-400/10 text-emerald-400" />
        </div>
      )}

      <Tabs defaultValue="ai">
        <TabsList className="mb-4"><TabsTrigger value="ai" className="flex-1">AI Assistant</TabsTrigger></TabsList>
        <TabsContent value="ai">
          <Card>
            <CardContent className="pt-5 h-80 flex flex-col">
              <AIChat section="health" placeholder="Ask anything about your health today…" contextData={aiContext} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
