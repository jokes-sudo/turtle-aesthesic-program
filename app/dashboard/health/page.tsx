"use client";

import { useCallback, useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { Heart, Scale, Moon, Apple, Utensils, Plus, Trash2 } from "lucide-react";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AIChat } from "@/components/shared/ai-chat";
import { AppleHealthImport } from "@/components/shared/apple-health-import";
import { ShortcutSetup } from "@/components/shared/shortcut-setup";
import { LiveBadge } from "@/components/shared/live-badge";
import { useRealtimeAH } from "@/hooks/use-realtime-ah";
import { AH } from "@/lib/apple-health";

type AHRow = { value: number | null; unit: string | null; start_date: string };

function useAHData(type: string, days = 30, aggregate?: "day") {
  const [data, setData] = useState<AHRow[]>([]);
  const load = useCallback(async () => {
    try {
      const params = new URLSearchParams({ type, days: String(days) });
      if (aggregate) params.set("aggregate", aggregate);
      const res = await fetch(`/api/apple-health/data?${params}`);
      if (res.ok) setData(await res.json());
    } catch { /* no-op */ }
  }, [type, days, aggregate]);
  useEffect(() => { load(); }, [load]);
  return { data, reload: load };
}

// Nutrition log types
interface NutritionLog {
  id: string; date: string; meal_name: string | null;
  calories: number | null; protein_g: number | null; carbs_g: number | null; fats_g: number | null;
}

const emptyNutrition = { date: format(new Date(), "yyyy-MM-dd"), meal_name: "", calories: "", protein_g: "", carbs_g: "", fats_g: "" };

function chartDate(iso: string) {
  try { return format(parseISO(iso), "MMM d"); } catch { return iso.slice(5, 10); }
}

export default function HealthPage() {
  // Apple Health data
  const weight = useAHData(AH.WEIGHT, 90);
  const bodyFat = useAHData(AH.BODY_FAT, 90);
  const heartRate = useAHData(AH.HEART_RATE, 7);
  const restingHR = useAHData(AH.RESTING_HR, 30);
  const sleep = useAHData(AH.SLEEP, 14);
  const ahCalories = useAHData(AH.CAL_FOOD, 7, "day");
  const ahProtein = useAHData(AH.PROTEIN, 7, "day");

  // Manual nutrition logs (fallback / supplement)
  const [nutLogs, setNutLogs] = useState<NutritionLog[]>([]);
  const [nutForm, setNutForm] = useState(emptyNutrition);
  const [nutOpen, setNutOpen] = useState(false);
  const [nutLoading, setNutLoading] = useState(false);

  async function loadNutrition() {
    try {
      const res = await fetch("/api/nutrition");
      if (res.ok) setNutLogs(await res.json());
    } catch { /* no-op */ }
  }
  useEffect(() => { loadNutrition(); }, []);

  async function addNutrition() {
    setNutLoading(true);
    await fetch("/api/nutrition", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: nutForm.date,
        meal_name: nutForm.meal_name || null,
        calories: nutForm.calories ? parseFloat(nutForm.calories) : null,
        protein_g: nutForm.protein_g ? parseFloat(nutForm.protein_g) : null,
        carbs_g: nutForm.carbs_g ? parseFloat(nutForm.carbs_g) : null,
        fats_g: nutForm.fats_g ? parseFloat(nutForm.fats_g) : null,
      }),
    });
    setNutForm(emptyNutrition); setNutOpen(false); setNutLoading(false);
    loadNutrition();
  }

  async function deleteNutrition(id: string) {
    await fetch(`/api/nutrition?id=${id}`, { method: "DELETE" });
    loadNutrition();
  }

  function reloadAll() {
    weight.reload(); bodyFat.reload(); heartRate.reload();
    restingHR.reload(); sleep.reload(); ahCalories.reload(); ahProtein.reload();
  }

  const isLive = useRealtimeAH(reloadAll);

  // Derived stats
  const latestWeight = weight.data.at(-1);
  const latestBF = bodyFat.data.at(-1);
  const latestRHR = restingHR.data.at(-1);
  const totalSleepHrs = sleep.data.reduce((s, r) => s + (r.value ?? 0), 0);
  const avgSleep = sleep.data.length
    ? Math.round((totalSleepHrs / sleep.data.filter((r) => r.value).length) * 10) / 10 : null;

  const weightChart = weight.data.slice(-30).map((r) => ({ date: chartDate(r.start_date), value: r.value }));
  const hrChart = heartRate.data.slice(-200).map((r) => ({ date: chartDate(r.start_date), bpm: r.value ? Math.round(r.value) : null }));
  const sleepChart = sleep.data.map((r) => ({ date: chartDate(r.start_date), hrs: r.value }));

  const hasAH = weight.data.length > 0 || heartRate.data.length > 0 || sleep.data.length > 0;

  const aiContext = `Latest weight: ${latestWeight?.value ?? "N/A"}${latestWeight?.unit ?? "kg"}, body fat: ${latestBF?.value ?? "N/A"}%, resting HR: ${latestRHR?.value ?? "N/A"} bpm, avg sleep last 14d: ${avgSleep ?? "N/A"}h. Data from Apple Health.`;

  return (
    <div className="p-5 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <Heart className="h-4 w-4 text-rose-400" />
            <h1 className="text-lg font-semibold">Health</h1>
            {isLive && <LiveBadge active />}
          </div>
          <p className="text-xs text-muted-foreground">Synced from Apple Health</p>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          <ShortcutSetup />
          <AppleHealthImport onImported={reloadAll} />
        </div>
      </div>

      {!hasAH && (
        <div className="text-center py-10 text-muted-foreground mb-4">
          <Apple className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">No Apple Health data yet</p>
          <p className="text-xs mt-1">Import your export.zip to populate this page automatically</p>
        </div>
      )}

      {hasAH && (
        <div className="grid grid-cols-2 gap-3 mb-5">
          {[
            { label: "Weight",      value: latestWeight?.value, unit: latestWeight?.unit ?? "kg",  color: "text-emerald-400" },
            { label: "Body Fat",    value: latestBF?.value,     unit: "%",                         color: "text-amber-400" },
            { label: "Resting HR",  value: latestRHR?.value ? Math.round(latestRHR.value) : null, unit: "bpm", color: "text-rose-400" },
            { label: "Avg Sleep",   value: avgSleep,            unit: "hrs",                       color: "text-indigo-400" },
          ].map(({ label, value, unit, color }) => (
            <Card key={label}>
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-muted-foreground mb-1">{label}</p>
                <div className="flex items-baseline gap-1">
                  <span className={`text-xl font-semibold ${color}`}>{value ?? "—"}</span>
                  {value !== null && value !== undefined && <span className="text-xs text-muted-foreground">{unit}</span>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Tabs defaultValue="body">
        <TabsList className="w-full mb-4">
          <TabsTrigger value="body"      className="flex-1">Body</TabsTrigger>
          <TabsTrigger value="vitals"    className="flex-1">Vitals</TabsTrigger>
          <TabsTrigger value="sleep"     className="flex-1">Sleep</TabsTrigger>
          <TabsTrigger value="nutrition" className="flex-1">Nutrition</TabsTrigger>
        </TabsList>

        {/* Body tab */}
        <TabsContent value="body" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-sm flex items-center gap-1.5"><Scale className="h-4 w-4" /> Weight (last 30 entries)</CardTitle></CardHeader>
            <CardContent>
              {weightChart.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={weightChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} domain={["auto", "auto"]} />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: 12 }} />
                    <Line type="monotone" dataKey="value" stroke="#34d399" strokeWidth={2} dot={false} name={`Weight (${latestWeight?.unit ?? "kg"})`} />
                  </LineChart>
                </ResponsiveContainer>
              ) : <p className="text-sm text-muted-foreground text-center py-6">Import Apple Health data to see your weight trend</p>}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Vitals tab */}
        <TabsContent value="vitals" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-sm flex items-center gap-1.5"><Heart className="h-4 w-4 text-rose-400" /> Heart Rate (last 7 days)</CardTitle></CardHeader>
            <CardContent>
              {hrChart.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={hrChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} domain={["auto", "auto"]} />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: 12 }} />
                    <Area type="monotone" dataKey="bpm" stroke="#f43f5e" fill="#f43f5e" fillOpacity={0.1} strokeWidth={1.5} dot={false} name="BPM" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : <p className="text-sm text-muted-foreground text-center py-6">Import Apple Health data to see heart rate</p>}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sleep tab */}
        <TabsContent value="sleep" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-sm flex items-center gap-1.5"><Moon className="h-4 w-4 text-indigo-400" /> Sleep Duration (last 14 nights)</CardTitle></CardHeader>
            <CardContent>
              {sleepChart.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={sleepChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis domain={[0, 12]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: 12 }} formatter={(v) => [`${v}h`]} />
                    <Area type="monotone" dataKey="hrs" stroke="#818cf8" fill="#818cf8" fillOpacity={0.15} strokeWidth={2} name="Hours" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : <p className="text-sm text-muted-foreground text-center py-6">Import Apple Health data to see sleep patterns</p>}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Nutrition tab */}
        <TabsContent value="nutrition" className="space-y-4">
          {/* Apple Health nutrition summary */}
          {ahCalories.data.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-sm flex items-center gap-1.5"><Apple className="h-4 w-4" /> Calories from Apple Health (7 days)</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={160}>
                  <AreaChart data={ahCalories.data.map((r) => ({ date: (r as { date?: string }).date ?? r.start_date?.slice(5, 10), cal: (r as { sum?: number }).sum ?? r.value }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: 12 }} />
                    <Area type="monotone" dataKey="cal" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.1} strokeWidth={2} name="kcal" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Manual log */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium flex items-center gap-1.5"><Utensils className="h-4 w-4" /> Manual Meal Log</h3>
            <Dialog open={nutOpen} onOpenChange={setNutOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline"><Plus className="h-3.5 w-3.5 mr-1" /> Log Meal</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Log Meal</DialogTitle></DialogHeader>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="col-span-2 space-y-1.5"><Label>Date</Label><Input type="date" value={nutForm.date} onChange={(e) => setNutForm({ ...nutForm, date: e.target.value })} /></div>
                  <div className="col-span-2 space-y-1.5"><Label>Meal Name</Label><Input placeholder="Breakfast…" value={nutForm.meal_name} onChange={(e) => setNutForm({ ...nutForm, meal_name: e.target.value })} /></div>
                  <div className="space-y-1.5"><Label>Calories</Label><Input placeholder="500" value={nutForm.calories} onChange={(e) => setNutForm({ ...nutForm, calories: e.target.value })} /></div>
                  <div className="space-y-1.5"><Label>Protein (g)</Label><Input placeholder="40" value={nutForm.protein_g} onChange={(e) => setNutForm({ ...nutForm, protein_g: e.target.value })} /></div>
                  <div className="space-y-1.5"><Label>Carbs (g)</Label><Input placeholder="60" value={nutForm.carbs_g} onChange={(e) => setNutForm({ ...nutForm, carbs_g: e.target.value })} /></div>
                  <div className="space-y-1.5"><Label>Fats (g)</Label><Input placeholder="15" value={nutForm.fats_g} onChange={(e) => setNutForm({ ...nutForm, fats_g: e.target.value })} /></div>
                </div>
                <Button onClick={addNutrition} disabled={nutLoading} className="mt-2">{nutLoading ? "Saving…" : "Save Meal"}</Button>
              </DialogContent>
            </Dialog>
          </div>
          <Card>
            <CardContent className="pt-4">
              {nutLogs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {ahCalories.data.length > 0 ? "Apple Health nutrition data shown above. Add manual entries below." : "No meals logged. Apple Health dietary data will also appear here when imported."}
                </p>
              ) : (
                <div className="space-y-2">
                  {nutLogs.map((l) => (
                    <div key={l.id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 text-sm">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-muted-foreground text-xs">{format(new Date(l.date), "MMM d")}</span>
                        <span className="font-medium">{l.meal_name || "Meal"}</span>
                        {l.calories && <span>{l.calories} kcal</span>}
                        {l.protein_g && <span className="text-blue-400">{l.protein_g}g P</span>}
                      </div>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => deleteNutrition(l.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI */}
          <Card>
            <CardContent className="pt-5 h-72 flex flex-col">
              <AIChat section="nutrition" placeholder="Ask about your macros, nutrition goals…" contextData={aiContext} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* AI Card shown outside tabs for body/vitals/sleep */}
      <Card className="mt-4">
        <CardContent className="pt-5 h-72 flex flex-col">
          <AIChat section="health" placeholder="Ask about your weight trend, heart rate, sleep quality…" contextData={aiContext} />
        </CardContent>
      </Card>
    </div>
  );
}
