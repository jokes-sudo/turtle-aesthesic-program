"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, CheckSquare, Circle, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AIChat } from "@/components/shared/ai-chat";
import { cn } from "@/lib/utils";

interface Todo {
  id: string;
  created_at: string;
  title: string;
  description: string | null;
  completed: boolean;
  priority: "low" | "medium" | "high";
  due_date: string | null;
  category: string | null;
}

const emptyForm = {
  title: "",
  description: "",
  priority: "medium" as "low" | "medium" | "high",
  due_date: "",
  category: "",
};

const priorityColor: Record<string, string> = {
  high: "bg-rose-500/15 text-rose-400 border-rose-500/20",
  medium: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  low: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
};

export default function TodosPage() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | "active" | "done">("active");

  async function loadTodos() {
    const res = await fetch("/api/todos");
    const data = await res.json();
    setTodos(data ?? []);
  }

  useEffect(() => { loadTodos(); }, []);

  async function handleAdd() {
    if (!form.title.trim()) return;
    setLoading(true);
    await fetch("/api/todos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        description: form.description || null,
        completed: false,
        priority: form.priority,
        due_date: form.due_date || null,
        category: form.category || null,
      }),
    });
    setForm(emptyForm);
    setOpen(false);
    setLoading(false);
    loadTodos();
  }

  async function toggleDone(todo: Todo) {
    await fetch("/api/todos", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: todo.id, completed: !todo.completed }),
    });
    loadTodos();
  }

  async function handleDelete(id: string) {
    await fetch(`/api/todos?id=${id}`, { method: "DELETE" });
    loadTodos();
  }

  const filtered = todos.filter((t) =>
    filter === "all" ? true : filter === "active" ? !t.completed : t.completed
  );

  const active = todos.filter((t) => !t.completed);
  const done = todos.filter((t) => t.completed);
  const highPriority = active.filter((t) => t.priority === "high");

  const contextData = `Total tasks: ${todos.length}. Active: ${active.length}. Completed: ${done.length}. High priority pending: ${highPriority.map((t) => t.title).join(", ") || "None"}. Categories: ${[...new Set(todos.map((t) => t.category).filter(Boolean))].join(", ") || "None"}.`;

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <CheckSquare className="h-5 w-5 text-sky-400" />
            <h1 className="text-xl font-semibold">To-Do List</h1>
          </div>
          <p className="text-sm text-muted-foreground">Manage tasks and stay on top of your goals</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Task</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Task</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label>Title</Label>
                <Input placeholder="What needs to be done?" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Description (optional)</Label>
                <Input placeholder="More details..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Priority</Label>
                  <Select value={form.priority} onValueChange={(v: "low" | "medium" | "high") => setForm({ ...form, priority: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Due Date</Label>
                  <Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Input placeholder="Work, Health, Personal..." value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
              </div>
            </div>
            <Button onClick={handleAdd} disabled={loading || !form.title.trim()} className="mt-2">
              {loading ? "Saving..." : "Add Task"}
            </Button>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Active", value: active.length, color: "text-sky-400" },
          { label: "Completed", value: done.length, color: "text-emerald-400" },
          { label: "High Priority", value: highPriority.length, color: "text-rose-400" },
        ].map(({ label, value, color }) => (
          <Card key={label}>
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground mb-1">{label}</p>
              <span className={`text-2xl font-semibold ${color}`}>{value}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="tasks">
        <TabsList>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="ai">AI Coach</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks">
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-2 mb-4">
                {(["active", "all", "done"] as const).map((f) => (
                  <Button key={f} variant={filter === f ? "default" : "ghost"} size="sm" onClick={() => setFilter(f)} className="capitalize text-xs h-7">
                    {f === "active" ? "Active" : f === "done" ? "Completed" : "All"}
                  </Button>
                ))}
              </div>
              {filtered.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-8">
                  {filter === "active" ? "All done! Add a new task." : "No tasks here."}
                </p>
              ) : (
                <div className="space-y-2">
                  {filtered
                    .sort((a, b) => {
                      const pOrder = { high: 0, medium: 1, low: 2 };
                      return pOrder[a.priority] - pOrder[b.priority];
                    })
                    .map((todo) => (
                      <div
                        key={todo.id}
                        className={cn("flex items-start gap-3 p-3 rounded-lg transition-colors", todo.completed ? "bg-muted/20 opacity-60" : "bg-muted/40")}
                      >
                        <button onClick={() => toggleDone(todo)} className="mt-0.5 shrink-0">
                          {todo.completed ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                          ) : (
                            <Circle className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={cn("text-sm font-medium", todo.completed && "line-through text-muted-foreground")}>{todo.title}</span>
                            <span className={cn("text-xs px-1.5 py-0.5 rounded-full border font-medium", priorityColor[todo.priority])}>
                              {todo.priority}
                            </span>
                            {todo.category && (
                              <Badge variant="outline" className="text-xs h-5 px-1.5">{todo.category}</Badge>
                            )}
                          </div>
                          {todo.description && <p className="text-xs text-muted-foreground mt-0.5">{todo.description}</p>}
                          {todo.due_date && (
                            <p className="text-xs text-muted-foreground mt-0.5">Due: {format(new Date(todo.due_date), "MMM d, yyyy")}</p>
                          )}
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0" onClick={() => handleDelete(todo.id)}>
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
                section="todos"
                placeholder="Ask about prioritization, time management, productivity tips..."
                contextData={contextData}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
