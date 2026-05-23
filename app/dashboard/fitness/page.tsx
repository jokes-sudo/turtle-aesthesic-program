"use client";

import { useCallback, useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { Zap, Footprints, Flame, Plus, Trash2, Trophy, Apple } from "lucide-react";
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { AIChat } from "@/components/shared/ai-chat";
import { AppleHealthImport } from "@/components/shared/apple-health-import";
import { ShortcutSetup } from "@/components/shared/shortcut-setup";
import { LiveBadge } from "@/components/shared/live-badge";
import { useRealtimeAH } from "@/hooks/use-realtime-ah";
import { AH, WORKOUT_PREFIX, workoutLabel } from "@/lib/apple-health";

type AHRow = { value: number | null; unit: string | null; start_date: string; end_date?: string | null };
type DayRow = { date: string; value: number; sum?: number };

function useAHData(type: string, days = 30, aggregate?: "day") {
  const [data, setData] = useState<(AHRow & { date?: string; sum?: number })[]>([]);
  const load = useCallback(async () => {
    try {
      const params = new URLSearchParams({ type, days: String(days) });
      if (aggregate) params.set("aggregate", aggregate);
      const res = await fetch(`/api/apple-health/data?${params}`);
      if (res.ok) setData(await res.json());
    } catch { /* no-op */ }
  }, [type, days, aggregate]);
  useEffect(() => { load(); }, [load]);
  return { data: data as (AHRow & DayRow)[], reload: load };
}

// Fetch Apple Health workouts (all HKWorkoutActivityType* records)
function useAHWorkouts(days = 30) {
  const [data, setData] = useState<(AHRow & { record_type: string })[]>([]);
  const load = useCallback(async () => {
    try {
      // We need to fetch all workout records — use a general query
      const res = await fetch(`/api/apple-health/data?type=${WORKOUT_PREFIX}Running&days=${days}&limit=200`);
      // We'll fetch a broad set by querying for common workout types individually
      // and merge them. A simpler approach: query with type prefix via multiple calls
      const types = [
        "HKWorkoutActivityTypeRunning", "HKWorkoutActivityTypeCycling",
        "HKWorkoutActivityTypeWalking", "HKWorkoutActivityTypeSwimming",
        "HKWorkoutActivityTypeStrengthTraining", "HKWorkoutActivityTypeFunctionalStrengthTraining",
        "HKWorkoutActivityTypeYoga", "HKWorkoutActivityTypeHighIntensityIntervalTraining",
        "HKWorkoutActivityTypePilates", "HKWorkoutActivityTypeElliptical",
        "HKWorkoutActivityTypeRowing", "HKWorkoutActivityTypeMixedCardio",
        "HKWorkoutActivityTypeCoreTraining", "HKWorkoutActivityTypeCrossTraining",
        "HKWorkoutActivityTypeOther",
      ];
      const since = new Date(); since.setDate(since.getDate() - days);
      const postRes = await fetch("/api/apple-health/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ types, days }),
      });
      if (postRes.ok) {
        const rows = await postRes.json();
        setData(rows);
      }
    } catch { /* no-op */ }
  }, [days]);
  useEffect(() => { load(); }, [load]);
  return { data, reload: load };
}

interface GymLog { id: string; date: string; exercise_name: string; sets: number | null; reps: number | null; weight_kg: number | null; duration_min: number | null; notes: string | null }
const emptyForm = { date: format(new Date(), "yyyy-MM-dd"), exercise_name: "", sets: "", reps: "", weight_kg: "", duration_min: "", notes: "" };

function chartDate(iso: string) {
  try { return format(parseISO(iso), "MMM d"); } catch { return iso.slice(5, 10); }
}

export default function FitnessPage() {
  const steps   = useAHData(AH.STEPS,      30, "day");
  const calories = useAHData(AH.ACTIVE_CAL, 30, "day");
  const distance = useAHData(AH.DISTANCE,  30, "day");
  const workouts = useAHWorkouts(30);

  const [gymLogs, setGymLogs] = useState<GymLog[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function loadGym() {
    try {
      const res = await fetch("/api/gym");
      if (res.ok) setGymLogs(await res.json());
    } catch { /* no-op */ }
  }
  useEffect(() => { loadGym(); }, []);

  async function addGym() {
    if (!form.exercise_name.trim()) return;
    setLoading(true);
    await fetch("/api/gym", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: form.date, exercise_name: form.exercise_name,
        sets: form.sets ? parseInt(form.sets) : null,
        reps: form.reps ? parseInt(form.reps) : null,
        weight_kg: form.weight_kg ? parseFloat(form.weight_kg) : null,
        duration_min: form.duration_min ? parseInt(form.duration_min) : null,
        notes: form.notes || null,
      }),
    });
    setForm(emptyForm); setOpen(false); setLoading(false);
    loadGym();
  }

  async function deleteGym(id: string) {
    await fetch(`/api/gym?id=${id}`, { method: "DELETE" });
    loadGym();
  }

  function reloadAll() {
    steps.reload(); calories.reload(); distance.reload(); workouts.reload();
  }

  const isLive = useRealtimeAH(reloadAll);

  // Derived
  const totalSteps7d = steps.data.slice(-7).reduce((s, r) => s + (r.sum ?? r.value ?? 0), 0);
  const totalCal7d   = calories.data.slice(-7).reduce((s, r) => s + (r.sum ?? r.value ?? 0), 0);
  const totalDist7d  = distance.data.slice(-7).reduce((s, r) => s + (r.sum ?? r.value ?? 0), 0);
  const workoutCount = workouts.data.length;

  const stepsChart    = steps.data.map((r)    => ({ date: r.date ?? chartDate(r.start_date), steps: Math.round(r.sum ?? r.value ?? 0) }));
  const calChart      = calories.data.map((r)  => ({ date: r.date ?? chartDate(r.start_date), cal: Math.round(r.sum ?? r.value ?? 0) }));

  const gymPRs = gymLogs.reduce((acc, l) => {
    if (!l.weight_kg) return acc;
    if (!acc[l.exercise_name] || l.weight_kg > acc[l.exercise_name]) acc[l.exercise_name] = l.weight_kg;
    return acc;
  }, {} as Record<string, number>);

  const hasAH = steps.data.length > 0 || workouts.data.length > 0;

  const aiContext = `Last 7 days — Steps: ${Math.round(totalSteps7d).toLocaleString()}, Active cal: ${Math.round(totalCal7d)} kcal, Distance: ${Math.round(totalDist7d * 10) / 10} km. Apple Health workouts (30d): ${workoutCount}. Manual gym logs: ${gymLogs.length}. PRs: ${Object.entries(gymPRs).map(([e, w]) => `${e}: ${w}kg`).join(", ") || "none"}.`;

  return (
    <div className="p-5 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <Zap className="h-4 w-4 text-amber-400" />
            <h1 className="text-lg font-semibold">Fitness</h1>
            {isLive && <LiveBadge active />}
          </div>
          <p className="text-xs text-muted-foreground">Activity &amp; workouts from Apple Health</p>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          <ShortcutSetup />
          <AppleHealthImport onImported={reloadAll} />
        </div>
      </div>

      {!hasAH && (
        <div className="text-center py-10 text-muted-foreground mb-4">
          <Apple className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">No Apple Health fitness data yet</p>
          <p className="text-xs mt-1">Import your export.zip to sync workouts, steps, and activity</p>
        </div>
      )}

      {hasAH && (
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { icon: Footprints, label: "Steps (7d)",    value: Math.round(totalSteps7d).toLocaleString(), color: "text-sky-400"    },
            { icon: Flame,      label: "Active Cal (7d)", value: Math.round(totalCal7d).toLocaleString(),  color: "text-orange-400" },
            { icon: Zap,        label: "Workouts (30d)", value: workoutCount,                              color: "text-amber-400"  },
          ].map(({ icon: Icon, label, value, color }) => (
            <Card key={label}>
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-muted-foreground mb-1">{label}</p>
                <span className={`text-xl font-semibold ${color}`}>{value}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Tabs defaultValue="activity">
        <TabsList className="w-full mb-4">
          <TabsTrigger value="activity"  className="flex-1">Activity</TabsTrigger>
          <TabsTrigger value="workouts"  className="flex-1">Workouts</TabsTrigger>
          <TabsTrigger value="gym"       className="flex-1">Gym Log</TabsTrigger>
          <TabsTrigger value="ai"        className="flex-1">AI Coach</TabsTrigger>
        </TabsList>

        {/* Activity charts */}
        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-sm flex items-center gap-1.5"><Footprints className="h-4 w-4 text-sky-400" /> Daily Steps (30 days)</CardTitle></CardHeader>
            <CardContent>
              {stepsChart.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={stepsChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} interval={4} />
                    <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: 12 }} />
                    <Bar dataKey="steps" fill="#38bdf8" radius={[3, 3, 0, 0]} name="Steps" />
                  </BarChart>
                </ResponsiveContainer>
              ) : <p className="text-sm text-muted-foreground text-center py-6">Import Apple Health to see daily steps</p>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm flex items-center gap-1.5"><Flame className="h-4 w-4 text-orange-400" /> Active Calories (30 days)</CardTitle></CardHeader>
            <CardContent>
              {calChart.length > 0 ? (
                <ResponsiveContainer width="100%" height={160}>
                  <AreaChart data={calChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} interval={4} />
                    <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: 12 }} />
                    <Area type="monotone" dataKey="cal" stroke="#fb923c" fill="#fb923c" fillOpacity={0.15} strokeWidth={2} name="kcal" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : <p className="text-sm text-muted-foreground text-center py-4">No data yet</p>}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Apple Health workouts */}
        <TabsContent value="workouts">
          <Card>
            <CardContent className="pt-4">
              {workouts.data.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Import Apple Health data to see your workout history
                </p>
              ) : (
                <div className="space-y-2">
                  {[...workouts.data].reverse().map((w, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/40 text-sm">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-xs text-muted-foreground w-20 shrink-0">
                          {chartDate(w.start_date)}
                        </span>
                        <span className="font-medium">{workoutLabel(w.record_type)}</span>
                        {w.value && (
                          <Badge variant="outline" className="text-xs">
                            {Math.round(w.value)} min
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">{(w as { source_name?: string | null }).source_name ?? ""}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Manual gym log */}
        <TabsContent value="gym" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Manual Gym Log</h3>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline"><Plus className="h-3.5 w-3.5 mr-1" /> Log Set</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Log Workout</DialogTitle></DialogHeader>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="col-span-2 space-y-1.5"><Label>Date</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
                  <div className="col-span-2 space-y-1.5"><Label>Exercise</Label><Input placeholder="Bench Press" value={form.exercise_name} onChange={(e) => setForm({ ...form, exercise_name: e.target.value })} /></div>
                  <div className="space-y-1.5"><Label>Sets</Label><Input placeholder="4" value={form.sets} onChange={(e) => setForm({ ...form, sets: e.target.value })} /></div>
                  <div className="space-y-1.5"><Label>Reps</Label><Input placeholder="8" value={form.reps} onChange={(e) => setForm({ ...form, reps: e.target.value })} /></div>
                  <div className="space-y-1.5"><Label>Weight (kg)</Label><Input placeholder="80" value={form.weight_kg} onChange={(e) => setForm({ ...form, weight_kg: e.target.value })} /></div>
                  <div className="space-y-1.5"><Label>Duration (min)</Label><Input placeholder="60" value={form.duration_min} onChange={(e) => setForm({ ...form, duration_min: e.target.value })} /></div>
                  <div className="col-span-2 space-y-1.5"><Label>Notes</Label><Input placeholder="Optional…" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
                </div>
                <Button onClick={addGym} disabled={loading || !form.exercise_name.trim()} className="mt-2">{loading ? "Saving…" : "Save"}</Button>
              </DialogContent>
            </Dialog>
          </div>
          {Object.keys(gymPRs).length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-sm flex items-center gap-1.5"><Trophy className="h-4 w-4 text-yellow-400" /> Personal Records</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(gymPRs).map(([ex, w]) => (
                    <Badge key={ex} variant="outline" className="text-xs gap-1">
                      <span className="text-muted-foreground">{ex}</span>
                      <span className="text-amber-400 font-semibold">{w}kg</span>
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          <Card>
            <CardContent className="pt-4">
              {gymLogs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No gym sets logged yet</p>
              ) : (
                <div className="space-y-2">
                  {gymLogs.map((l) => (
                    <div key={l.id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 text-sm">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-muted-foreground text-xs">{format(new Date(l.date), "MMM d")}</span>
                        <span className="font-medium">{l.exercise_name}</span>
                        {l.sets && l.reps && <span className="text-muted-foreground">{l.sets}×{l.reps}</span>}
                        {l.weight_kg && <span className="text-orange-400 font-medium">{l.weight_kg}kg</span>}
                      </div>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => deleteGym(l.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI */}
        <TabsContent value="ai">
          <Card>
            <CardContent className="pt-5 h-[420px] flex flex-col">
              <AIChat section="gym" placeholder="Ask about progressive overload, workout plans, recovery…" contextData={aiContext} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
