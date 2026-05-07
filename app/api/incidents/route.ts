import { NextResponse } from "next/server";
import { getStats, getIncidents } from "@/lib/incidents";

export async function GET() {
  return NextResponse.json({ stats: getStats(), incidents: getIncidents() });
}
