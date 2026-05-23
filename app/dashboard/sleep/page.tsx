"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Moon, Star } from "lucide-react";
import { format } from "date-fns";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AIChat } from "@/components/shared/ai-chat";

interface SleepLog {
  id: string;
  date: string;
  duration_hours: number | null;
  quality: number | null;
  bed_time: string | null;
  wake_time: string | null;
  notes: string | null;
}

const emptyForm = {
  date: format(new Date(), "yyyy-MM-dd"),
  duration_hours: "",
  quality: "",
  bed_time: "",
  wake_time: "",
  notes: "",
};

function QualityStars({ quality }: { quality: number | null }) {
  if (!quality) return null;
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`h-3 w-3 ${i < quality ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground"}`} />
      ))}
    </div>
  );
}

export default function SleepPage() {
  const [logs, setLogs] = useState<SleepLog[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function loadLogs() {
    const res = await fetch("/api/sleep");
    const data = await res.json();
    setLogs(data ?? []);
  }

  useEffect(() => { loadLogs(); }, []);

  async function handleAdd() {
    setLoading(true);
    await fetch("/api/sleep", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: form.date,
        duration_hours: form.duration_hours ? parseFloat(form.duration_hours) : null,
        quality: form.quality ? parseInt(form.quality) : null,
        bed_time: form.bed_time || null,
        wake_time: form.wake_time || null,
        notes: form.notes || null,
      }),
    });
    setForm(emptyForm);
    setOpen(false);
    setLoading(false);
    loadLogs();
  }

  async function handleDelete(id: string) {
    await fetch(`/api/sleep?id=${id}`, { method: "DELETE" });
    loadLogs();
  }

  const avgDuration = logs.length
    ? (logs.reduce((s, l) => s + (l.duration_hours ?? 0), 0) / logs.filter((l) => l.duration_hours).length).toFixed(1)
    : null;

  const avgQuality = logs.filter((l) => l.quality).length
    ? (logs.reduce((s, l) => s + (l.quality ?? 0), 0) / logs.filter((l) => l.quality).length).toFixed(1)
    : null;

  const chartData = [...logs].reverse().slice(-14).map((l) => ({
    date: format(new Date(l.date), "MMM d"),
    hours: l.duration_hours,
    quality: l.quality,
  }));

  const contextData = `Total sleep entries: ${logs.length}. Average sleep: ${avgDuration ?? "N/A"}h. Average quality: ${avgQuality ?? "N/A"}/5. Recent: ${logs.slice(0, 3).map((l) => `${l.duration_hours}h (quality ${l.quality}/5)`).join(", ")}.`;

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Moon className="h-5 w-5 text-indigo-400" />
            <h1 className="text-xl font-semibold">Sleep & Recovery</h1>
          </div>
          <p className="text-sm text-muted-foreground">Track sleep duration and quality for optimal recovery</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Log Sleep</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Log Sleep</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="col-span-2 space-y-1.5">
                <Label>Date</Label>
                <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Bed Time</Label>
                <Input type="time" value={form.bed_time} onChange={(e) => setForm({ ...form, bed_time: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Wake Time</Label>
                <Input type="time" value={form.wake_time} onChange={(e) => setForm({ ...form, wake_time: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Duration (hours)</Label>
                <Input placeholder="7.5" value={form.duration_hours} onChange={(e) => setForm({ ...form, duration_hours: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Quality (1–5)</Label>
                <Select value={form.quality} onValueChange={(v) => setForm({ ...form, quality: v })}>
                  <SelectTrigger><SelectValue placeholder="Rate..." /></SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <SelectItem key={n} value={String(n)}>{n} {n === 5 ? "★ Excellent" : n === 4 ? "★ Good" : n === 3 ? "★ OK" : n === 2 ? "★ Poor" : "★ Bad"}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Notes</Label>
                <Input placeholder="Woke up once, vivid dreams..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
            </div>
            <Button onClick={handleAdd} disabled={loading} className="mt-2">
              {loading ? "Saving..." : "Save Sleep"}
            </Button>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground mb-1">Avg Duration</p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-semibold">{avgDuration ?? "—"}</span>
              {avgDuration && <span className="text-sm text-muted-foreground">hrs</span>}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground mb-1">Avg Quality</p>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-semibold">{avgQuality ?? "—"}</span>
              {avgQuality && <span className="text-sm text-muted-foreground">/5</span>}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground mb-1">Nights Logged</p>
            <span className="text-2xl font-semibold">{logs.length}</span>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="charts">
        <TabsList>
          <TabsTrigger value="charts">Charts</TabsTrigger>
          <TabsTrigger value="log">Sleep Log</TabsTrigger>
          <TabsTrigger value="ai">AI Sleep Coach</TabsTrigger>
        </TabsList>

        <TabsContent value="charts">
          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Sleep Duration</CardTitle></CardHeader>
              <CardContent>
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis domain={[0, 12]} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                      <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "6px", fontSize: 12 }} />
                      <Area type="monotone" dataKey="hours" stroke="#818cf8" fill="#818cf8/0.1" strokeWidth={2} fillOpacity={0.15} name="Hours" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">Log sleep to see your patterns</div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Sleep Quality</CardTitle></CardHeader>
              <CardContent>
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                      <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "6px", fontSize: 12 }} />
                      <Bar dataKey="quality" fill="#fbbf24" radius={[4, 4, 0, 0]} name="Quality (1-5)" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-32 flex items-center justify-center text-muted-foreground text-sm">No data yet</div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="log">
          <Card>
            <CardContent className="pt-6">
              {logs.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-8">No sleep entries yet.</p>
              ) : (
                <div className="space-y-2">
                  {logs.map((l) => (
                    <div key={l.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/40 text-sm">
                      <div className="flex items-center gap-4 flex-wrap">
                        <span className="text-muted-foreground w-24 shrink-0">{format(new Date(l.date), "MMM d, yyyy")}</span>
                        {l.duration_hours && <span className="font-medium">{l.duration_hours}h</span>}
                        <QualityStars quality={l.quality} />
                        {l.bed_time && l.wake_time && <span className="text-muted-foreground">{l.bed_time} → {l.wake_time}</span>}
                        {l.notes && <span className="text-muted-foreground italic truncate max-w-32">{l.notes}</span>}
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

        <TabsContent value="ai">
          <Card>
            <CardContent className="pt-6 h-[420px] flex flex-col">
              <AIChat
                section="sleep"
                placeholder="Ask about sleep hygiene, improving sleep quality, recovery..."
                contextData={contextData}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
