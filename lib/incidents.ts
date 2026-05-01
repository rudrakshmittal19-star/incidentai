export type Incident = {
  id: string;
  incidentNo: string;
  shortDescription: string;
  state: "Open" | "In Progress" | "Resolved" | "Closed";
  priority: "P1" | "P2" | "P3" | "P4";
  assignedTo: string;
  application: string;
  createdDate: string;
  category: string;
};

export const INCIDENTS: Incident[] = [
  { id: "1",  incidentNo: "INC0012301", shortDescription: "SAP ERP login failure for Finance team", state: "Open",        priority: "P1", assignedTo: "Rahul Sharma",    application: "SAP",      createdDate: "2025-04-29", category: "Access" },
  { id: "2",  incidentNo: "INC0012302", shortDescription: "VPN disconnecting intermittently across Delhi office", state: "In Progress", priority: "P1", assignedTo: "Priya Nair",     application: "VPN",      createdDate: "2025-04-29", category: "Network" },
  { id: "3",  incidentNo: "INC0012303", shortDescription: "Outlook emails delayed by 30+ minutes",   state: "In Progress", priority: "P2", assignedTo: "Arjun Mehta",    application: "Outlook",  createdDate: "2025-04-28", category: "Email" },
  { id: "4",  incidentNo: "INC0012304", shortDescription: "Database backup job failed — prod DB",     state: "Open",        priority: "P1", assignedTo: "Sneha Kapoor",   application: "Database", createdDate: "2025-04-28", category: "Database" },
  { id: "5",  incidentNo: "INC0012305", shortDescription: "CRM portal returning 502 bad gateway",     state: "Open",        priority: "P2", assignedTo: "Vikram Singh",   application: "CRM",      createdDate: "2025-04-27", category: "Web" },
  { id: "6",  incidentNo: "INC0012306", shortDescription: "Network switch down in Block B",           state: "Resolved",    priority: "P1", assignedTo: "Rahul Sharma",   application: "Network",  createdDate: "2025-04-27", category: "Network" },
  { id: "7",  incidentNo: "INC0012307", shortDescription: "Printer offline — 3rd floor HP LaserJet",  state: "Open",        priority: "P4", assignedTo: "Meena Joshi",    application: "Printer",  createdDate: "2025-04-26", category: "Hardware" },
  { id: "8",  incidentNo: "INC0012308", shortDescription: "SAP payroll module hanging on submit",      state: "In Progress", priority: "P2", assignedTo: "Arjun Mehta",   application: "SAP",      createdDate: "2025-04-26", category: "Performance" },
  { id: "9",  incidentNo: "INC0012309", shortDescription: "Database connection pool exhausted",        state: "Resolved",    priority: "P2", assignedTo: "Sneha Kapoor",  application: "Database", createdDate: "2025-04-25", category: "Database" },
  { id: "10", incidentNo: "INC0012310", shortDescription: "VPN certificate expired — remote users blocked", state: "Resolved", priority: "P1", assignedTo: "Priya Nair", application: "VPN",      createdDate: "2025-04-24", category: "Security" },
  { id: "11", incidentNo: "INC0012311", shortDescription: "CRM bulk export causing timeout",           state: "Open",        priority: "P3", assignedTo: "Vikram Singh",  application: "CRM",      createdDate: "2025-04-24", category: "Performance" },
  { id: "12", incidentNo: "INC0012312", shortDescription: "Outlook shared calendar not syncing",       state: "Resolved",    priority: "P3", assignedTo: "Meena Joshi",   application: "Outlook",  createdDate: "2025-04-23", category: "Sync" },
  { id: "13", incidentNo: "INC0012313", shortDescription: "SAP HR module — missing leave records",     state: "Closed",      priority: "P3", assignedTo: "Rahul Sharma",  application: "SAP",      createdDate: "2025-04-22", category: "Data" },
  { id: "14", incidentNo: "INC0012314", shortDescription: "Network latency spike — 500ms+ ping",       state: "In Progress", priority: "P2", assignedTo: "Priya Nair",    application: "Network",  createdDate: "2025-04-22", category: "Network" },
  { id: "15", incidentNo: "INC0012315", shortDescription: "Database index corruption on orders table", state: "Closed",      priority: "P1", assignedTo: "Sneha Kapoor",  application: "Database", createdDate: "2025-04-21", category: "Database" },
];

export function getStats() {
  const total = INCIDENTS.length;
  const open = INCIDENTS.filter(i => i.state === "Open" || i.state === "In Progress").length;
  const p1 = INCIDENTS.filter(i => i.priority === "P1").length;
  const resolved = INCIDENTS.filter(i => i.state === "Resolved" || i.state === "Closed").length;
  const apps = new Set(INCIDENTS.map(i => i.application)).size;
  return { total, open, p1, resolved, apps };
}

const P_EMOJI: Record<string, string> = { P1: "🔴", P2: "🟠", P3: "🟡", P4: "🟢" };
const S_EMOJI: Record<string, string> = { "Open": "📂", "In Progress": "⚙️", "Resolved": "✅", "Closed": "🔒" };

function bullets(list: Incident[], max = 6): string {
  const shown = list.slice(0, max);
  const lines = shown.map(i =>
    `• ${P_EMOJI[i.priority] ?? "⚪"} **${i.incidentNo}** — ${i.shortDescription}\n  ${S_EMOJI[i.state] ?? "📋"} ${i.state} · 👤 ${i.assignedTo} · 📱 ${i.application}`
  );
  if (list.length > max) lines.push(`_...and ${list.length - max} more_`);
  return lines.join("\n\n");
}

export type ChatResponse = { text: string; incidents: Incident[] };

export function getResponse(query: string): ChatResponse {
  const q = query.toLowerCase().trim();
  const all = INCIDENTS;

  // Summary
  if (/summary|overview|dashboard|how many|status/.test(q)) {
    const s = getStats();
    return {
      text: `📊 **Incident Summary**\n\n• 🗂️ **Total:** ${s.total}\n• 📂 **Open / In Progress:** ${s.open}\n• 🔴 **P1 Critical:** ${s.p1}\n• ✅ **Resolved / Closed:** ${s.resolved}\n• 📱 **Apps Impacted:** ${s.apps}\n\nWant me to drill into a specific priority, app, or team?`,
      incidents: all,
    };
  }

  // Assigned to person
  const assignMatch = q.match(/assigned to\s+([a-z .'-]+)/);
  if (assignMatch) {
    const name = assignMatch[1].trim();
    const filtered = all.filter(i => i.assignedTo.toLowerCase().includes(name));
    if (!filtered.length) return { text: `👤 No incidents assigned to **${name}** right now.`, incidents: [] };
    return { text: `👤 **${filtered.length} incident(s) for ${name}:**\n\n${bullets(filtered)}`, incidents: filtered };
  }

  // Priority
  for (const pri of ["p1", "p2", "p3", "p4"] as const) {
    const label = { p1: "Critical", p2: "High", p3: "Medium", p4: "Low" }[pri];
    if (new RegExp(`\\b${pri}\\b`).test(q) || (pri === "p1" && /critical|urgent/.test(q))) {
      const filtered = all.filter(i => i.priority === pri.toUpperCase());
      if (!filtered.length) return { text: `${P_EMOJI[pri.toUpperCase()]} No **${pri.toUpperCase()} (${label})** incidents right now!`, incidents: [] };
      const open = filtered.filter(i => i.state === "Open" || i.state === "In Progress").length;
      return { text: `${P_EMOJI[pri.toUpperCase()]} **${filtered.length} ${pri.toUpperCase()} (${label}) incident(s)** — ${open} still active:\n\n${bullets(filtered)}`, incidents: filtered };
    }
  }

  // App keywords
  const appMap: Record<string, string> = { sap: "SAP", vpn: "VPN", network: "Network", database: "Database", db: "Database", crm: "CRM", outlook: "Outlook", email: "Outlook", printer: "Printer" };
  for (const [kw, app] of Object.entries(appMap)) {
    if (q.includes(kw)) {
      const filtered = all.filter(i => i.application.toLowerCase() === app.toLowerCase());
      if (!filtered.length) return { text: `✅ No incidents for **${app}** right now.`, incidents: [] };
      const open = filtered.filter(i => i.state === "Open" || i.state === "In Progress").length;
      return { text: `📱 **${filtered.length} incident(s) for ${app}** — ${open} active:\n\n${bullets(filtered)}`, incidents: filtered };
    }
  }

  // Open
  if (/open|active|ongoing|pending|in progress|unresolved/.test(q)) {
    const filtered = all.filter(i => i.state === "Open" || i.state === "In Progress");
    if (!filtered.length) return { text: "✅ All clear! No open incidents right now.", incidents: [] };
    return { text: `📂 **${filtered.length} open/active incident(s):**\n\n${bullets(filtered)}\n\n💡 Ask *'Show P1 incidents'* to see the most critical first.`, incidents: filtered };
  }

  // Resolved
  if (/resolved|closed|fixed|done|completed/.test(q)) {
    const filtered = all.filter(i => i.state === "Resolved" || i.state === "Closed");
    return { text: `✅ **${filtered.length} resolved incident(s):**\n\n${bullets(filtered)}`, incidents: filtered };
  }

  // Latest
  if (/latest|recent|newest|last/.test(q)) {
    const sorted = [...all].sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime());
    const i = sorted[0];
    return { text: `🕐 **Most Recent Incident:**\n\n${P_EMOJI[i.priority]} **${i.incidentNo}** — ${i.shortDescription}\n📱 ${i.application} · 👤 ${i.assignedTo}\n${S_EMOJI[i.state]} ${i.state} · 📅 ${i.createdDate}`, incidents: [i] };
  }

  // SLA
  if (/sla|breach|overdue|late|delayed/.test(q)) {
    const filtered = all.filter(i => (i.priority === "P1" || i.priority === "P2") && (i.state === "Open" || i.state === "In Progress"));
    if (!filtered.length) return { text: "✅ No P1/P2 incidents at SLA risk right now.", incidents: [] };
    return { text: `⚠️ **${filtered.length} incident(s) at SLA risk** (P1/P2 still open):\n\n${bullets(filtered)}\n\n🚨 These need immediate attention!`, incidents: filtered };
  }

  // Loose search
  const loose = all.filter(i =>
    Object.values(i).some(v => String(v).toLowerCase().includes(q))
  );
  if (loose.length) return { text: `🔍 **${loose.length} incident(s) matching "${query}":**\n\n${bullets(loose)}`, incidents: loose };

  return {
    text: `🤔 Couldn't find incidents matching that. Try:\n\n• *"Show P1 incidents"*\n• *"SAP issues"*\n• *"Any open tickets?"*\n• *"SLA at risk"*\n• *"Summary"*`,
    incidents: [],
  };
}
