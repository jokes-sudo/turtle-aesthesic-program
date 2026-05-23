"use client";

import { useState, useRef } from "react";
import { Upload, CheckCircle2, AlertCircle, Loader2, Apple, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface Props {
  onImported?: () => void;
}

export function AppleHealthImport({ onImported }: Props) {
  const [open, setOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [showSteps, setShowSteps] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    if (!file.name.match(/\.(zip|xml)$/i)) {
      setStatus("error");
      setMessage("Please upload the Apple Health export.zip or export.xml file.");
      return;
    }
    setStatus("uploading");
    setMessage("");
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await fetch("/api/apple-health/import", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      setStatus("success");
      setMessage(`Imported ${data.imported.toLocaleString()} records from Apple Health.`);
      onImported?.();
    } catch (e) {
      setStatus("error");
      setMessage(e instanceof Error ? e.message : "Something went wrong.");
    }
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) upload(file);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) upload(file);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setStatus("idle"); setMessage(""); } }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 border-dashed">
          <Apple className="h-3.5 w-3.5" />
          Import Apple Health
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Apple className="h-4 w-4" /> Import Apple Health Data
          </DialogTitle>
        </DialogHeader>

        {/* How-to steps */}
        <button
          onClick={() => setShowSteps(!showSteps)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {showSteps ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          How to export from iPhone
        </button>
        {showSteps && (
          <ol className="text-xs text-muted-foreground space-y-1.5 pl-1 border-l-2 border-border ml-1 pl-3">
            <li>1. Open the <strong className="text-foreground">Health</strong> app on your iPhone</li>
            <li>2. Tap your profile picture (top right)</li>
            <li>3. Scroll down → <strong className="text-foreground">Export All Health Data</strong></li>
            <li>4. Tap <strong className="text-foreground">Export</strong> → share or AirDrop the ZIP to your computer</li>
            <li>5. Upload the <strong className="text-foreground">export.zip</strong> file below (last 12 months will be imported)</li>
          </ol>
        )}

        {/* Drop zone */}
        <div
          className={cn(
            "relative border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
            dragging ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/50",
            status === "uploading" && "pointer-events-none opacity-60"
          )}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
        >
          <input ref={inputRef} type="file" accept=".zip,.xml" className="hidden" onChange={onFileChange} />
          {status === "uploading" ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">Parsing Apple Health data…</p>
              <p className="text-xs text-muted-foreground">Large exports may take 30–60 seconds</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium">Drop export.zip here</p>
              <p className="text-xs text-muted-foreground">or click to browse · .zip or .xml accepted</p>
            </div>
          )}
        </div>

        {status === "success" && (
          <div className="flex items-center gap-2 text-sm text-emerald-400 bg-emerald-400/10 rounded-lg p-3">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            {message}
          </div>
        )}
        {status === "error" && (
          <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-lg p-3">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {message}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
