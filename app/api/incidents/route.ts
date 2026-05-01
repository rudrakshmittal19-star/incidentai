import { NextResponse } from "next/server";
import { getStats, INCIDENTS } from "@/lib/incidents";

export async function GET() {
  return NextResponse.json({ stats: getStats(), incidents: INCIDENTS });
}
