"use client";

import { useEffect, useState } from "react";
import { Smartphone, Copy, Check, RefreshCw, Wifi, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button onClick={copy} className="ml-2 text-muted-foreground hover:text-foreground transition-colors">
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

function CodeBlock({ value, label }: { value: string; label?: string }) {
  return (
    <div className="bg-muted rounded-md px-3 py-2 text-xs font-mono flex items-center justify-between gap-2 break-all">
      <div>
        {label && <span className="text-muted-foreground mr-2">{label}</span>}
        <span className="text-foreground">{value}</span>
      </div>
      <CopyButton text={value} />
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-semibold mt-0.5">
        {n}
      </div>
      <div className="space-y-1.5">
        <p className="text-sm font-medium">{title}</p>
        <div className="text-xs text-muted-foreground space-y-1">{children}</div>
      </div>
    </div>
  );
}

export function ShortcutSetup({ webhookBase }: { webhookBase?: string }) {
  const [open, setOpen] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  async function loadKey() {
    setLoading(true);
    try {
      const res = await fetch("/api/webhook/key");
      const data = await res.json();
      setApiKey(data.key ?? null);
    } catch { /* no-op */ }
    setLoading(false);
  }

  async function regenerate() {
    setLoading(true);
    try {
      const res = await fetch("/api/webhook/key", { method: "POST" });
      const data = await res.json();
      setApiKey(data.key ?? null);
    } catch { /* no-op */ }
    setLoading(false);
  }

  useEffect(() => { if (open) loadKey(); }, [open]);

  const base = webhookBase ?? (typeof window !== "undefined" ? window.location.origin : "https://yourdomain.com");
  const webhookUrl = `${base}/api/webhook/sync`;

  // The exact JSON payload for the Shortcut
  const samplePayload = JSON.stringify({
    key: apiKey ?? "YOUR_API_KEY",
    heart_rate: "«Heart Rate value»",
    steps: "«Step Count value»",
    active_calories: "«Active Energy value»",
    weight: "«Body Mass value»",
    weight_unit: "kg",
  }, null, 2);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 border-dashed">
          <Wifi className="h-3.5 w-3.5 text-emerald-400" />
          Live Sync Setup
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-4 w-4" /> Live Apple Watch Sync
          </DialogTitle>
        </DialogHeader>

        <p className="text-xs text-muted-foreground">
          Set up an iOS Shortcut that runs automatically and pushes your Apple Watch readings to this dashboard in real time — no manual exports needed.
        </p>

        {/* Webhook URL + Key */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-foreground">Your webhook</p>
          <CodeBlock value={webhookUrl} label="URL" />
          <div className="flex items-center gap-2">
            <div className="flex-1">
              {apiKey
                ? <CodeBlock value={apiKey} label="Key" />
                : <div className="bg-muted rounded-md px-3 py-2 text-xs text-muted-foreground">
                    {loading ? "Loading…" : "Supabase not configured — set up DB first"}
                  </div>
              }
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={regenerate} disabled={loading}>
              <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            </Button>
          </div>
        </div>

        {/* Step-by-step instructions */}
        <div className="space-y-4 pt-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Build the iOS Shortcut</p>

          <Step n={1} title='Open Shortcuts → tap "+" → name it "Health Sync"'>
            <p>On your iPhone, open the <strong className="text-foreground">Shortcuts</strong> app.</p>
          </Step>

          <Step n={2} title="Add health reading actions">
            <p>For each metric, tap <strong className="text-foreground">+</strong> → search <strong className="text-foreground">&quot;Health&quot;</strong> → choose <strong className="text-foreground">Get Health Samples</strong>.</p>
            <p className="mt-1">Add one action per metric:</p>
            <ul className="mt-1 space-y-0.5 pl-2">
              {[
                ["Heart Rate",         "latest, last 2 min"],
                ["Step Count",         "sum, start of today → now"],
                ["Active Energy Burned","sum, start of today → now"],
                ["Body Mass",          "latest"],
              ].map(([m, hint]) => (
                <li key={m} className="flex justify-between gap-4">
                  <span className="text-foreground">{m}</span>
                  <span className="text-muted-foreground">{hint}</span>
                </li>
              ))}
            </ul>
          </Step>

          <Step n={3} title='Add "Get Contents of URL"'>
            <p>Search for <strong className="text-foreground">Get Contents of URL</strong>. Configure it:</p>
            <div className="mt-1.5 space-y-1.5">
              <CodeBlock value={webhookUrl} label="URL" />
              <CodeBlock value="POST" label="Method" />
              <CodeBlock value="application/json" label="Content-Type" />
            </div>
            <p className="mt-1.5">Request body (JSON) — paste each variable from the actions above:</p>
            <pre className="mt-1 bg-muted rounded-md p-2 text-[10px] overflow-x-auto whitespace-pre-wrap">{samplePayload}</pre>
          </Step>

          <Step n={4} title="Set up the automation (runs every minute)">
            <p>Go to the <strong className="text-foreground">Automation</strong> tab → <strong className="text-foreground">New Automation</strong>.</p>
            <p>Choose <strong className="text-foreground">Time of Day</strong> → set to repeat every <strong className="text-foreground">1 minute</strong>.</p>
            <p>Add action: <strong className="text-foreground">Run Shortcut</strong> → select <strong className="text-foreground">Health Sync</strong>.</p>
            <p>Turn off <strong className="text-foreground">&quot;Ask Before Running&quot;</strong> so it runs silently.</p>
          </Step>

          <Step n={5} title="(Optional) Also trigger after workouts">
            <p>Add another Automation → <strong className="text-foreground">Workout</strong> → <strong className="text-foreground">Ends</strong>.</p>
            <p>This pushes your workout summary to the dashboard the moment you finish.</p>
          </Step>
        </div>

        {/* Advanced / raw records */}
        <button
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors pt-1"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          {showAdvanced ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          Advanced: send raw records array
        </button>
        {showAdvanced && (
          <pre className="text-[10px] bg-muted rounded-md p-2 overflow-x-auto whitespace-pre-wrap">{JSON.stringify({
            key: apiKey ?? "YOUR_KEY",
            records: [
              { type: "HKQuantityTypeIdentifierHeartRate", value: 72, unit: "bpm", timestamp: "2024-01-15T10:30:00Z" },
              { type: "HKQuantityTypeIdentifierStepCount", value: 5432, unit: "count" },
            ],
          }, null, 2)}</pre>
        )}

        <p className="text-[10px] text-muted-foreground pt-1">
          Once the Shortcut is running, your dashboard stats update automatically — no refresh needed (powered by Supabase Realtime).
        </p>
      </DialogContent>
    </Dialog>
  );
}
