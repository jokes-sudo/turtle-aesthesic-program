"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Activity, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { format } from "date-fns";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AIChat } from "@/components/shared/ai-chat";

interface BodyMetric {
  id: string;
  date: string;
  weight_kg: number | null;
  body_fat_pct: number | null;
  bmi: number | null;
  waist_cm: number | null;
  chest_cm: number | null;
  notes: string | null;
}

const emptyForm = {
  date: format(new Date(), "yyyy-MM-dd"),
  weight_kg: "",
  body_fat_pct: "",
  bmi: "",
  waist_cm: "",
  chest_cm: "",
  notes: "",
};

function Trend({ current, previous }: { current: number | null; previous: number | null }) {
  if (!current || !previous) return null;
  const diff = current - previous;
  if (Math.abs(diff) < 0.01) return <Minus className="h-3 w-3 text-muted-foreground" />;
  if (diff < 0) return <TrendingDown className="h-3 w-3 text-emerald-400" />;
  return <TrendingUp className="h-3 w-3 text-rose-400" />;
}

export default function HealthPage() {
  const [metrics, setMetrics] = useState<BodyMetric[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function loadMetrics() {
    const res = await fetch("/api/health");
    const data = await res.json();
    setMetrics(data ?? []);
  }

  useEffect(() => { loadMetrics(); }, []);

  async function handleAdd() {
    setLoading(true);
    await fetch("/api/health", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: form.date,
        weight_kg: form.weight_kg ? parseFloat(form.weight_kg) : null,
        body_fat_pct: form.body_fat_pct ? parseFloat(form.body_fat_pct) : null,
        bmi: form.bmi ? parseFloat(form.bmi) : null,
        waist_cm: form.waist_cm ? parseFloat(form.waist_cm) : null,
        chest_cm: form.chest_cm ? parseFloat(form.chest_cm) : null,
        notes: form.notes || null,
      }),
    });
    setForm(emptyForm);
    setOpen(false);
    setLoading(false);
    loadMetrics();
  }

  async function handleDelete(id: string) {
    await fetch(`/api/health?id=${id}`, { method: "DELETE" });
    loadMetrics();
  }

  const latest = metrics[0];
  const previous = metrics[1];
  const chartData = [...metrics].reverse().map((m) => ({
    date: format(new Date(m.date), "MMM d"),
    weight: m.weight_kg,
    bodyFat: m.body_fat_pct,
    bmi: m.bmi,
  }));

  const contextData = latest
    ? `Latest metrics (${latest.date}): Weight: ${latest.weight_kg}kg, BMI: ${latest.bmi}, Body fat: ${latest.body_fat_pct}%, Waist: ${latest.waist_cm}cm. Total entries: ${metrics.length}.`
    : "No health data logged yet.";

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Activity className="h-5 w-5 text-emerald-400" />
            <h1 className="text-xl font-semibold">Health Metrics</h1>
          </div>
          <p className="text-sm text-muted-foreground">Track your body composition over time</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Log Entry</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Log Body Metrics</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="col-span-2 space-y-1.5">
                <Label>Date</Label>
                <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Weight (kg)</Label>
                <Input placeholder="75.5" value={form.weight_kg} onChange={(e) => setForm({ ...form, weight_kg: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Body Fat (%)</Label>
                <Input placeholder="18.5" value={form.body_fat_pct} onChange={(e) => setForm({ ...form, body_fat_pct: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>BMI</Label>
                <Input placeholder="22.4" value={form.bmi} onChange={(e) => setForm({ ...form, bmi: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Waist (cm)</Label>
                <Input placeholder="82" value={form.waist_cm} onChange={(e) => setForm({ ...form, waist_cm: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Chest (cm)</Label>
                <Input placeholder="96" value={form.chest_cm} onChange={(e) => setForm({ ...form, chest_cm: e.target.value })} />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Notes</Label>
                <Input placeholder="Optional notes..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
            </div>
            <Button onClick={handleAdd} disabled={loading} className="mt-2">
              {loading ? "Saving..." : "Save Entry"}
            </Button>
          </DialogContent>
        </Dialog>
      </div>

      {latest && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Weight", value: latest.weight_kg, unit: "kg", prev: previous?.weight_kg },
            { label: "Body Fat", value: latest.body_fat_pct, unit: "%", prev: previous?.body_fat_pct },
            { label: "BMI", value: latest.bmi, unit: "", prev: previous?.bmi },
            { label: "Waist", value: latest.waist_cm, unit: "cm", prev: previous?.waist_cm },
          ].map(({ label, value, unit, prev }) => (
            <Card key={label}>
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-muted-foreground mb-1">{label}</p>
                <div className="flex items-center gap-1.5">
                  <span className="text-2xl font-semibold">{value ?? "—"}</span>
                  {value && <span className="text-sm text-muted-foreground">{unit}</span>}
                  <Trend current={value} previous={prev ?? null} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Tabs defaultValue="chart">
        <TabsList>
          <TabsTrigger value="chart">Charts</TabsTrigger>
          <TabsTrigger value="log">Log</TabsTrigger>
          <TabsTrigger value="ai">AI Assistant</TabsTrigger>
        </TabsList>

        <TabsContent value="chart">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Weight Over Time</CardTitle>
              <CardDescription>Last 30 entries</CardDescription>
            </CardHeader>
            <CardContent>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "6px", fontSize: 12 }} />
                    <Line type="monotone" dataKey="weight" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="Weight (kg)" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">
                  Log some entries to see your progress chart
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="log">
          <Card>
            <CardContent className="pt-6">
              {metrics.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-8">No entries yet. Click &quot;Log Entry&quot; to start tracking.</p>
              ) : (
                <div className="space-y-2">
                  {metrics.map((m) => (
                    <div key={m.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/40 text-sm">
                      <div className="flex items-center gap-4">
                        <span className="text-muted-foreground w-24">{format(new Date(m.date), "MMM d, yyyy")}</span>
                        {m.weight_kg && <span>{m.weight_kg}kg</span>}
                        {m.body_fat_pct && <span className="text-muted-foreground">{m.body_fat_pct}% bf</span>}
                        {m.bmi && <span className="text-muted-foreground">BMI {m.bmi}</span>}
                        {m.notes && <span className="text-muted-foreground italic">{m.notes}</span>}
                      </div>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(m.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai">
          <Card>
            <CardContent className="pt-6 h-[420px] flex flex-col">
              <AIChat
                section="health"
                placeholder="Ask about your weight trend, BMI, body fat goals..."
                contextData={contextData}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
