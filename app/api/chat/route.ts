import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { INCIDENTS, getStats } from "@/lib/incidents";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
  const { message } = await req.json();

  if (!message || typeof message !== "string") {
    return NextResponse.json({ error: "Missing message" }, { status: 400 });
  }

  const stats = getStats();

  const systemPrompt = `You are IncidentAI, an expert IT incident management assistant for an enterprise IT team.

You have access to the following live incident data. Answer questions naturally and helpfully based on this data.

## Current Stats
- Total Incidents: ${stats.total}
- Open / In Progress: ${stats.open}
- P1 Critical: ${stats.p1}
- Resolved / Closed: ${stats.resolved}
- Applications Impacted: ${stats.apps}

## All Incidents (JSON)
${JSON.stringify(INCIDENTS, null, 2)}

## Instructions
- Answer naturally in plain English — no need to dump raw JSON at the user
- Use bullet points and bold text (markdown) to make responses clear and readable
- For lists of incidents, format them nicely: show the incident number, description, state, priority, and who it's assigned to
- If asked about a specific person, app, or priority — filter and summarize only those
- If asked something not related to incidents, politely say you are focused on incident management
- Always be concise and helpful
- Use emojis sparingly to highlight priority levels: 🔴 P1, 🟠 P2, 🟡 P3, 🟢 P4`;

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
      max_tokens: 1024,
      temperature: 0.3,
    });

    const text = completion.choices[0]?.message?.content ?? "Sorry, I could not generate a response.";

    // Return matching incidents for the table
    const q = message.toLowerCase();
    let incidents = [];

    if (/p1|critical/i.test(q)) {
      incidents = INCIDENTS.filter(i => i.priority === "P1");
    } else if (/p2/i.test(q)) {
      incidents = INCIDENTS.filter(i => i.priority === "P2");
    } else if (/open|active|progress/i.test(q)) {
      incidents = INCIDENTS.filter(i => i.state === "Open" || i.state === "In Progress");
    } else if (/resolved|closed|fixed/i.test(q)) {
      incidents = INCIDENTS.filter(i => i.state === "Resolved" || i.state === "Closed");
    } else if (/sap/i.test(q)) {
      incidents = INCIDENTS.filter(i => i.application === "SAP");
    } else if (/vpn/i.test(q)) {
      incidents = INCIDENTS.filter(i => i.application === "VPN");
    } else if (/network/i.test(q)) {
      incidents = INCIDENTS.filter(i => i.application === "Network");
    } else if (/database|db/i.test(q)) {
      incidents = INCIDENTS.filter(i => i.application === "Database");
    } else if (/crm/i.test(q)) {
      incidents = INCIDENTS.filter(i => i.application === "CRM");
    } else if (/outlook|email/i.test(q)) {
      incidents = INCIDENTS.filter(i => i.application === "Outlook");
    } else if (/summary|overview|all|dashboard/i.test(q)) {
      incidents = INCIDENTS;
    }

    return NextResponse.json({ text, incidents });
  } catch (error: unknown) {
    console.error("Groq error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { text: `⚠️ AI error: ${msg}. Please check your GROQ_API_KEY.`, incidents: [] },
      { status: 500 }
    );
  }
}