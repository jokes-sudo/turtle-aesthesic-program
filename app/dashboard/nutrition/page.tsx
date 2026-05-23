"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Apple } from "lucide-react";
import { format, startOfDay } from "date-fns";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AIChat } from "@/components/shared/ai-chat";

interface NutritionLog {
  id: string;
  date: string;
  meal_name: string | null;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fats_g: number | null;
  notes: string | null;
}

const emptyForm = {
  date: format(new Date(), "yyyy-MM-dd"),
  meal_name: "",
  calories: "",
  protein_g: "",
  carbs_g: "",
  fats_g: "",
  notes: "",
};

const MACRO_COLORS = ["#60a5fa", "#34d399", "#f97316"];

export default function NutritionPage() {
  const [logs, setLogs] = useState<NutritionLog[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function loadLogs() {
    const res = await fetch("/api/nutrition");
    const data = await res.json();
    setLogs(data ?? []);
  }

  useEffect(() => { loadLogs(); }, []);

  async function handleAdd() {
    setLoading(true);
    await fetch("/api/nutrition", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: form.date,
        meal_name: form.meal_name || null,
        calories: form.calories ? parseFloat(form.calories) : null,
        protein_g: form.protein_g ? parseFloat(form.protein_g) : null,
        carbs_g: form.carbs_g ? parseFloat(form.carbs_g) : null,
        fats_g: form.fats_g ? parseFloat(form.fats_g) : null,
        notes: form.notes || null,
      }),
    });
    setForm(emptyForm);
    setOpen(false);
    setLoading(false);
    loadLogs();
  }

  async function handleDelete(id: string) {
    await fetch(`/api/nutrition?id=${id}`, { method: "DELETE" });
    loadLogs();
  }

  const today = format(startOfDay(new Date()), "yyyy-MM-dd");
  const todayLogs = logs.filter((l) => l.date === today);
  const todayCalories = todayLogs.reduce((s, l) => s + (l.calories ?? 0), 0);
  const todayProtein = todayLogs.reduce((s, l) => s + (l.protein_g ?? 0), 0);
  const todayCarbs = todayLogs.reduce((s, l) => s + (l.carbs_g ?? 0), 0);
  const todayFats = todayLogs.reduce((s, l) => s + (l.fats_g ?? 0), 0);

  const macroData = [
    { name: "Protein", value: todayProtein },
    { name: "Carbs", value: todayCarbs },
    { name: "Fats", value: todayFats },
  ].filter((d) => d.value > 0);

  const dailyCalories = logs.reduce((acc, l) => {
    const d = l.date;
    if (!acc[d]) acc[d] = 0;
    acc[d] += l.calories ?? 0;
    return acc;
  }, {} as Record<string, number>);

  const calorieChart = Object.entries(dailyCalories)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-14)
    .map(([date, calories]) => ({ date: format(new Date(date), "MMM d"), calories }));

  const contextData = `Today's intake: ${todayCalories} kcal, ${todayProtein}g protein, ${todayCarbs}g carbs, ${todayFats}g fats. Total meal entries: ${logs.length}.`;

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Apple className="h-5 w-5 text-rose-400" />
            <h1 className="text-xl font-semibold">Nutrition</h1>
          </div>
          <p className="text-sm text-muted-foreground">Track meals, calories, and macros</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Log Meal</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Log Meal</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="col-span-2 space-y-1.5">
                <Label>Date</Label>
                <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Meal Name</Label>
                <Input placeholder="Breakfast, Lunch, Chicken + Rice..." value={form.meal_name} onChange={(e) => setForm({ ...form, meal_name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Calories</Label>
                <Input placeholder="500" value={form.calories} onChange={(e) => setForm({ ...form, calories: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Protein (g)</Label>
                <Input placeholder="40" value={form.protein_g} onChange={(e) => setForm({ ...form, protein_g: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Carbs (g)</Label>
                <Input placeholder="60" value={form.carbs_g} onChange={(e) => setForm({ ...form, carbs_g: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Fats (g)</Label>
                <Input placeholder="15" value={form.fats_g} onChange={(e) => setForm({ ...form, fats_g: e.target.value })} />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Notes</Label>
                <Input placeholder="Optional notes..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
            </div>
            <Button onClick={handleAdd} disabled={loading} className="mt-2">
              {loading ? "Saving..." : "Save Meal"}
            </Button>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Calories Today", value: todayCalories, unit: "kcal", color: "text-foreground" },
          { label: "Protein", value: todayProtein, unit: "g", color: "text-blue-400" },
          { label: "Carbs", value: todayCarbs, unit: "g", color: "text-emerald-400" },
          { label: "Fats", value: todayFats, unit: "g", color: "text-orange-400" },
        ].map(({ label, value, unit, color }) => (
          <Card key={label}>
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground mb-1">{label}</p>
              <div className="flex items-baseline gap-1.5">
                <span className={`text-2xl font-semibold ${color}`}>{value}</span>
                <span className="text-xs text-muted-foreground">{unit}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="log">
        <TabsList>
          <TabsTrigger value="log">Meal Log</TabsTrigger>
          <TabsTrigger value="charts">Charts</TabsTrigger>
          <TabsTrigger value="ai">AI Nutritionist</TabsTrigger>
        </TabsList>

        <TabsContent value="log">
          <Card>
            <CardContent className="pt-6">
              {logs.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-8">No meals logged yet.</p>
              ) : (
                <div className="space-y-2">
                  {logs.map((l) => (
                    <div key={l.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/40 text-sm">
                      <div className="flex items-center gap-4 flex-wrap">
                        <span className="text-muted-foreground w-24 shrink-0">{format(new Date(l.date), "MMM d, yyyy")}</span>
                        <span className="font-medium">{l.meal_name || "Meal"}</span>
                        {l.calories && <span>{l.calories} kcal</span>}
                        {l.protein_g && <span className="text-blue-400">{l.protein_g}g P</span>}
                        {l.carbs_g && <span className="text-emerald-400">{l.carbs_g}g C</span>}
                        {l.fats_g && <span className="text-orange-400">{l.fats_g}g F</span>}
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

        <TabsContent value="charts">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Today&apos;s Macros</CardTitle></CardHeader>
              <CardContent>
                {macroData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={macroData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                        {macroData.map((_, i) => <Cell key={i} fill={MACRO_COLORS[i % MACRO_COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "6px", fontSize: 12 }} formatter={(v) => [`${v}g`]} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">Log meals today to see macros</div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Calorie History</CardTitle></CardHeader>
              <CardContent>
                {calorieChart.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={calorieChart}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                      <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "6px", fontSize: 12 }} />
                      <Area type="monotone" dataKey="calories" stroke="hsl(var(--primary))" fill="hsl(var(--primary)/0.1)" strokeWidth={2} name="Calories" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">Log meals to see history</div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="ai">
          <Card>
            <CardContent className="pt-6 h-[420px] flex flex-col">
              <AIChat
                section="nutrition"
                placeholder="Ask about your macros, meal planning, calorie goals..."
                contextData={contextData}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
