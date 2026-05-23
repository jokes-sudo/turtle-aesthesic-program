import { NextRequest, NextResponse } from "next/server";
import AdmZip from "adm-zip";
import { XMLParser } from "fast-xml-parser";
import { supabase } from "@/lib/supabase";
import { IMPORTED_TYPES, WORKOUT_PREFIX, SLEEP_ASLEEP_VALUES } from "@/lib/apple-health";

export const dynamic = "force-dynamic";

// Parse Apple Health date string → ISO string
function parseDate(s: string): string {
  // Format: "2024-01-15 08:30:00 +0000"
  return new Date(s.replace(" ", "T").replace(/(\+\d{2})(\d{2})$/, "$1:$2")).toISOString();
}

// Convert duration in minutes to fractional hours for sleep
function durationHours(start: string, end: string): number {
  const ms = new Date(parseDate(end)).getTime() - new Date(parseDate(start)).getTime();
  return Math.round((ms / 3600000) * 100) / 100;
}

interface RawRecord {
  "@_type": string;
  "@_value"?: string;
  "@_unit"?: string;
  "@_startDate": string;
  "@_endDate"?: string;
  "@_sourceName"?: string;
}

interface RawWorkout {
  "@_workoutActivityType": string;
  "@_duration"?: string;
  "@_durationUnit"?: string;
  "@_totalEnergyBurned"?: string;
  "@_totalDistance"?: string;
  "@_startDate": string;
  "@_endDate"?: string;
  "@_sourceName"?: string;
}

export async function POST(req: NextRequest) {
  let xmlContent: string;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());

    if (file.name.toLowerCase().endsWith(".zip")) {
      const zip = new AdmZip(buffer);
      // Find export.xml anywhere inside the ZIP
      const entry = zip.getEntries().find((e) => e.entryName.endsWith("export.xml"));
      if (!entry) return NextResponse.json({ error: "Could not find export.xml inside the ZIP file" }, { status: 400 });
      xmlContent = entry.getData().toString("utf-8");
    } else {
      xmlContent = buffer.toString("utf-8");
    }
  } catch {
    return NextResponse.json({ error: "Failed to read uploaded file" }, { status: 400 });
  }

  // Parse XML
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    isArray: (name) => name === "Record" || name === "Workout",
    parseAttributeValue: false, // keep as strings; we'll parse manually
  });

  let parsed: { HealthData?: { Record?: RawRecord[]; Workout?: RawWorkout[] } };
  try {
    parsed = parser.parse(xmlContent);
  } catch {
    return NextResponse.json({ error: "Failed to parse XML — make sure you uploaded the Apple Health export" }, { status: 400 });
  }

  const records: RawRecord[] = parsed.HealthData?.Record ?? [];
  const workouts: RawWorkout[] = parsed.HealthData?.Workout ?? [];

  // Limit to last 365 days so we don't exceed Supabase limits
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - 1);

  type InsertRow = {
    record_type: string;
    value: number | null;
    unit: string | null;
    start_date: string;
    end_date: string | null;
    source_name: string | null;
  };

  const toInsert: InsertRow[] = [];

  for (const r of records) {
    const type = r["@_type"];
    if (!IMPORTED_TYPES.has(type as never)) continue;

    const startDate = r["@_startDate"];
    if (!startDate) continue;

    try {
      const iso = parseDate(startDate);
      if (new Date(iso) < cutoff) continue;

      // For sleep records only keep "asleep" variants (not InBed)
      if (type === "HKCategoryTypeIdentifierSleepAnalysis") {
        const val = r["@_value"] ?? "";
        if (!SLEEP_ASLEEP_VALUES.has(val)) continue;
        // Store duration in hours as the value
        const endDate = r["@_endDate"] ?? "";
        toInsert.push({
          record_type: type,
          value: endDate ? durationHours(startDate, endDate) : null,
          unit: "hr",
          start_date: iso,
          end_date: endDate ? parseDate(endDate) : null,
          source_name: r["@_sourceName"] ?? null,
        });
        continue;
      }

      toInsert.push({
        record_type: type,
        value: r["@_value"] != null ? parseFloat(r["@_value"]) : null,
        unit: r["@_unit"] ?? null,
        start_date: iso,
        end_date: r["@_endDate"] ? parseDate(r["@_endDate"]) : null,
        source_name: r["@_sourceName"] ?? null,
      });
    } catch {
      // Skip malformed records
    }
  }

  for (const w of workouts) {
    const type = w["@_workoutActivityType"];
    if (!type?.startsWith(WORKOUT_PREFIX)) continue;
    const startDate = w["@_startDate"];
    if (!startDate) continue;
    try {
      const iso = parseDate(startDate);
      if (new Date(iso) < cutoff) continue;
      // Duration stored in minutes
      const durationMin = w["@_duration"] ? parseFloat(w["@_duration"]) : null;
      const unit = w["@_durationUnit"] === "s" ? "s" : "min";
      toInsert.push({
        record_type: type,
        value: unit === "s" && durationMin != null ? durationMin / 60 : durationMin,
        unit: "min",
        start_date: iso,
        end_date: w["@_endDate"] ? parseDate(w["@_endDate"]) : null,
        source_name: w["@_sourceName"] ?? null,
      });
    } catch {
      // Skip
    }
  }

  // Wipe existing Apple Health data then bulk insert
  const { error: delErr } = await supabase
    .from("apple_health_records")
    .delete()
    .not("id", "is", null);
  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });

  // Batch insert in chunks of 500
  let inserted = 0;
  for (let i = 0; i < toInsert.length; i += 500) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from("apple_health_records") as any).insert(toInsert.slice(i, i + 500));
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    inserted += Math.min(500, toInsert.length - i);
  }

  return NextResponse.json({ imported: inserted, total_parsed: records.length + workouts.length });
}
