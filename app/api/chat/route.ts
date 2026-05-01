import { NextRequest, NextResponse } from "next/server";
import { getResponse } from "@/lib/incidents";

export async function POST(req: NextRequest) {
  const { message } = await req.json();
  if (!message || typeof message !== "string") {
    return NextResponse.json({ error: "Missing message" }, { status: 400 });
  }
  const result = getResponse(message);
  return NextResponse.json(result);
}
