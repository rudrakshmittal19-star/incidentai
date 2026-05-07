import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { getIncidents, getStats, createIncident, updateIncident } from "@/lib/incidents";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
  const { message, history = [] } = await req.json();

  if (!message || typeof message !== "string") {
    return NextResponse.json({ error: "Missing message" }, { status: 400 });
  }

  const incidents = getIncidents();
  const stats = getStats();

  const systemPrompt = `You are IncidentAI, an expert IT incident management assistant. You have full access to the incident database and can both READ data and MAKE CHANGES.

## Current Stats
- Total: ${stats.total} | Open/In Progress: ${stats.open} | P1 Critical: ${stats.p1} | Resolved/Closed: ${stats.resolved} | Apps: ${stats.apps}

## Full Incident Database (live)
${JSON.stringify(incidents, null, 2)}

## Your Capabilities
You can answer ANY question about the incident data naturally, including:
- "Who has the most open tickets?" → count per assignee
- "Which app has the most issues?" → group by application
- "What's the trend?" → analyze by date
- "Summarize all P1s" → filter and summarize
- "Is Rahul overloaded?" → analyze workload

You can also CREATE new incidents when asked. When user says things like:
- "Create a P1 incident for SAP login failure assigned to Rahul"
- "Log a new incident: network is down, assign to Priya, P2"
- "Add incident: [description]"

When creating, respond with a JSON action block EXACTLY like this (on its own line):
ACTION:{"type":"create","data":{"shortDescription":"...","state":"Open","priority":"P1","assignedTo":"...","application":"...","category":"..."}}

You can also UPDATE incidents when asked:
- "Mark INC0012301 as resolved"
- "Reassign INC0012302 to Arjun"
- "Update INC0012305 priority to P1"

When updating, respond with:
ACTION:{"type":"update","incidentNo":"INC0012301","updates":{"state":"Resolved"}}

## Rules
- Always be conversational and helpful
- Use markdown for formatting (bold, bullets)
- Use emojis for priority: 🔴 P1, 🟠 P2, 🟡 P3, 🟢 P4
- If creating/updating, FIRST confirm what you did in plain English, THEN put the ACTION line
- Never make up incidents that aren't in the database
- Keep responses concise unless asked for details`;

  // Build message history for multi-turn memory
  const messages: Array<{ role: "user" | "assistant" | "system"; content: string }> = [
    { role: "system", content: systemPrompt },
    ...history.slice(-10), // keep last 10 messages for context
    { role: "user", content: message },
  ];

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages,
      max_tokens: 1024,
      temperature: 0.3,
    });

    let text = completion.choices[0]?.message?.content ?? "Sorry, I could not generate a response.";

    // Parse and execute any ACTION blocks
    let actionResult: ReturnType<typeof createIncident> | ReturnType<typeof updateIncident> | null = null;
    const actionMatch = text.match(/ACTION:(\{.*?\})/s);

    if (actionMatch) {
      try {
        const action = JSON.parse(actionMatch[1]);

        if (action.type === "create" && action.data) {
          actionResult = createIncident(action.data);
        } else if (action.type === "update" && action.incidentNo && action.updates) {
          actionResult = updateIncident(action.incidentNo, action.updates);
        }

        // Remove the raw ACTION line from the response text
        text = text.replace(/ACTION:\{.*?\}/s, "").trim();
      } catch {
        // If JSON parsing fails, just remove the action line
        text = text.replace(/ACTION:.*$/m, "").trim();
      }
    }

    // Figure out which incidents to show in table based on context
    const q = message.toLowerCase();
    let shownIncidents = getIncidents(); // get fresh list after any mutations

    if (actionResult) {
      shownIncidents = [actionResult].filter(Boolean) as typeof shownIncidents;
    } else if (/p1/i.test(q) && !/p2|p3|p4/.test(q)) {
      shownIncidents = shownIncidents.filter(i => i.priority === "P1");
    } else if (/p2/i.test(q) && !/p1|p3|p4/.test(q)) {
      shownIncidents = shownIncidents.filter(i => i.priority === "P2");
    } else if (/open|active|in progress/i.test(q)) {
      shownIncidents = shownIncidents.filter(i => i.state === "Open" || i.state === "In Progress");
    } else if (/resolved|closed|fixed/i.test(q)) {
      shownIncidents = shownIncidents.filter(i => i.state === "Resolved" || i.state === "Closed");
    } else if (/sap/i.test(q)) {
      shownIncidents = shownIncidents.filter(i => i.application === "SAP");
    } else if (/vpn/i.test(q)) {
      shownIncidents = shownIncidents.filter(i => i.application === "VPN");
    } else if (/network/i.test(q)) {
      shownIncidents = shownIncidents.filter(i => i.application === "Network");
    } else if (/database|db/i.test(q)) {
      shownIncidents = shownIncidents.filter(i => i.application === "Database");
    } else if (/crm/i.test(q)) {
      shownIncidents = shownIncidents.filter(i => i.application === "CRM");
    } else if (/outlook|email/i.test(q)) {
      shownIncidents = shownIncidents.filter(i => i.application === "Outlook");
    } else if (/sla|breach|overdue/i.test(q)) {
      shownIncidents = shownIncidents.filter(i => (i.priority === "P1" || i.priority === "P2") && (i.state === "Open" || i.state === "In Progress"));
    } else if (/summary|overview|all|dashboard/i.test(q)) {
      shownIncidents = shownIncidents;
    } else {
      shownIncidents = []; // No table for general questions
    }

    return NextResponse.json({
      text,
      incidents: shownIncidents,
      // Return the new assistant message so frontend can append to history
      assistantMessage: { role: "assistant", content: text },
    });

  } catch (error: unknown) {
    console.error("Groq error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { text: `⚠️ AI error: ${msg}. Check GROQ_API_KEY.`, incidents: [] },
      { status: 500 }
    );
  }
}