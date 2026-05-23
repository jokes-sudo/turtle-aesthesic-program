"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Dumbbell, Trophy } from "lucide-react";
import { format } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AIChat } from "@/components/shared/ai-chat";

interface WorkoutLog {
  id: string;
  date: string;
  exercise_name: string;
  sets: number | null;
  reps: number | null;
  weight_kg: number | null;
  duration_min: number | null;
  notes: string | null;
}

const emptyForm = {
  date: format(new Date(), "yyyy-MM-dd"),
  exercise_name: "",
  sets: "",
  reps: "",
  weight_kg: "",
  duration_min: "",
  notes: "",
};

export default function GymPage() {
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function loadLogs() {
    const res = await fetch("/api/gym");
    const data = await res.json();
    setLogs(data ?? []);
  }

  useEffect(() => { loadLogs(); }, []);

  async function handleAdd() {
    if (!form.exercise_name.trim()) return;
    setLoading(true);
    await fetch("/api/gym", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: form.date,
        exercise_name: form.exercise_name,
        sets: form.sets ? parseInt(form.sets) : null,
        reps: form.reps ? parseInt(form.reps) : null,
        weight_kg: form.weight_kg ? parseFloat(form.weight_kg) : null,
        duration_min: form.duration_min ? parseInt(form.duration_min) : null,
        notes: form.notes || null,
      }),
    });
    setForm(emptyForm);
    setOpen(false);
    setLoading(false);
    loadLogs();
  }

  async function handleDelete(id: string) {
    await fetch(`/api/gym?id=${id}`, { method: "DELETE" });
    loadLogs();
  }

  const exercisePRs = logs.reduce((acc, log) => {
    if (!log.weight_kg) return acc;
    const key = log.exercise_name;
    if (!acc[key] || log.weight_kg > acc[key]) acc[key] = log.weight_kg;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(exercisePRs)
    .slice(0, 8)
    .map(([name, pr]) => ({ name: name.slice(0, 12), pr }));

  const contextData = `Total workout logs: ${logs.length}. PRs: ${Object.entries(exercisePRs).map(([e, w]) => `${e}: ${w}kg`).join(", ") || "None yet"}. Recent exercises: ${logs.slice(0, 5).map((l) => l.exercise_name).join(", ")}.`;

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Dumbbell className="h-5 w-5 text-orange-400" />
            <h1 className="text-xl font-semibold">Gym Progress</h1>
          </div>
          <p className="text-sm text-muted-foreground">Log workouts and track your personal records</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Log Workout</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Log Workout</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="col-span-2 space-y-1.5">
                <Label>Date</Label>
                <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Exercise Name</Label>
                <Input placeholder="Bench Press" value={form.exercise_name} onChange={(e) => setForm({ ...form, exercise_name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Sets</Label>
                <Input placeholder="4" value={form.sets} onChange={(e) => setForm({ ...form, sets: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Reps</Label>
                <Input placeholder="8" value={form.reps} onChange={(e) => setForm({ ...form, reps: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Weight (kg)</Label>
                <Input placeholder="80" value={form.weight_kg} onChange={(e) => setForm({ ...form, weight_kg: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Duration (min)</Label>
                <Input placeholder="60" value={form.duration_min} onChange={(e) => setForm({ ...form, duration_min: e.target.value })} />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Notes</Label>
                <Input placeholder="Felt strong today..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
            </div>
            <Button onClick={handleAdd} disabled={loading || !form.exercise_name.trim()} className="mt-2">
              {loading ? "Saving..." : "Save Workout"}
            </Button>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground mb-1">Total Workouts</p>
            <p className="text-2xl font-semibold">{logs.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground mb-1">Exercises Tracked</p>
            <p className="text-2xl font-semibold">{Object.keys(exercisePRs).length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground mb-1">PRs Set</p>
            <div className="flex items-center gap-1.5">
              <p className="text-2xl font-semibold">{Object.keys(exercisePRs).length}</p>
              <Trophy className="h-4 w-4 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="log">
        <TabsList>
          <TabsTrigger value="log">Workout Log</TabsTrigger>
          <TabsTrigger value="prs">Personal Records</TabsTrigger>
          <TabsTrigger value="ai">AI Coach</TabsTrigger>
        </TabsList>

        <TabsContent value="log">
          <Card>
            <CardContent className="pt-6">
              {logs.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-8">No workouts logged yet. Hit &quot;Log Workout&quot; to start!</p>
              ) : (
                <div className="space-y-2">
                  {logs.map((l) => (
                    <div key={l.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/40 text-sm">
                      <div className="flex items-center gap-4 flex-wrap">
                        <span className="text-muted-foreground w-24 shrink-0">{format(new Date(l.date), "MMM d, yyyy")}</span>
                        <span className="font-medium">{l.exercise_name}</span>
                        {l.sets && l.reps && <span className="text-muted-foreground">{l.sets}×{l.reps}</span>}
                        {l.weight_kg && <span className="text-orange-400 font-medium">{l.weight_kg}kg</span>}
                        {l.duration_min && <span className="text-muted-foreground">{l.duration_min}min</span>}
                      </div>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0" onClick={() => handleDelete(l.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prs">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Personal Records</CardTitle>
              <CardDescription>Best weight lifted per exercise</CardDescription>
            </CardHeader>
            <CardContent>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "6px", fontSize: 12 }} />
                    <Bar dataKey="pr" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="PR (kg)" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground text-sm py-8">Log workouts with weights to see your PRs</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai">
          <Card>
            <CardContent className="pt-6 h-[420px] flex flex-col">
              <AIChat
                section="gym"
                placeholder="Ask about progressive overload, program design, recovery..."
                contextData={contextData}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
