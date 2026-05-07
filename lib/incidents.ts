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

// Mutable in-memory store — AI can create/update incidents
let _incidents: Incident[] = [
  { id: "1",  incidentNo: "INC0012301", shortDescription: "SAP ERP login failure for Finance team",              state: "Open",        priority: "P1", assignedTo: "Rahul Sharma",  application: "SAP",      createdDate: "2025-04-29", category: "Access" },
  { id: "2",  incidentNo: "INC0012302", shortDescription: "VPN disconnecting intermittently across Delhi office", state: "In Progress", priority: "P1", assignedTo: "Priya Nair",    application: "VPN",      createdDate: "2025-04-29", category: "Network" },
  { id: "3",  incidentNo: "INC0012303", shortDescription: "Outlook emails delayed by 30+ minutes",               state: "In Progress", priority: "P2", assignedTo: "Arjun Mehta",   application: "Outlook",  createdDate: "2025-04-28", category: "Email" },
  { id: "4",  incidentNo: "INC0012304", shortDescription: "Database backup job failed — prod DB",                state: "Open",        priority: "P1", assignedTo: "Sneha Kapoor",  application: "Database", createdDate: "2025-04-28", category: "Database" },
  { id: "5",  incidentNo: "INC0012305", shortDescription: "CRM portal returning 502 bad gateway",                state: "Open",        priority: "P2", assignedTo: "Vikram Singh",  application: "CRM",      createdDate: "2025-04-27", category: "Web" },
  { id: "6",  incidentNo: "INC0012306", shortDescription: "Network switch down in Block B",                      state: "Resolved",    priority: "P1", assignedTo: "Rahul Sharma",  application: "Network",  createdDate: "2025-04-27", category: "Network" },
  { id: "7",  incidentNo: "INC0012307", shortDescription: "Printer offline — 3rd floor HP LaserJet",             state: "Open",        priority: "P4", assignedTo: "Meena Joshi",   application: "Printer",  createdDate: "2025-04-26", category: "Hardware" },
  { id: "8",  incidentNo: "INC0012308", shortDescription: "SAP payroll module hanging on submit",                state: "In Progress", priority: "P2", assignedTo: "Arjun Mehta",   application: "SAP",      createdDate: "2025-04-26", category: "Performance" },
  { id: "9",  incidentNo: "INC0012309", shortDescription: "Database connection pool exhausted",                  state: "Resolved",    priority: "P2", assignedTo: "Sneha Kapoor",  application: "Database", createdDate: "2025-04-25", category: "Database" },
  { id: "10", incidentNo: "INC0012310", shortDescription: "VPN certificate expired — remote users blocked",      state: "Resolved",    priority: "P1", assignedTo: "Priya Nair",    application: "VPN",      createdDate: "2025-04-24", category: "Security" },
  { id: "11", incidentNo: "INC0012311", shortDescription: "CRM bulk export causing timeout",                     state: "Open",        priority: "P3", assignedTo: "Vikram Singh",  application: "CRM",      createdDate: "2025-04-24", category: "Performance" },
  { id: "12", incidentNo: "INC0012312", shortDescription: "Outlook shared calendar not syncing",                 state: "Resolved",    priority: "P3", assignedTo: "Meena Joshi",   application: "Outlook",  createdDate: "2025-04-23", category: "Sync" },
  { id: "13", incidentNo: "INC0012313", shortDescription: "SAP HR module — missing leave records",               state: "Closed",      priority: "P3", assignedTo: "Rahul Sharma",  application: "SAP",      createdDate: "2025-04-22", category: "Data" },
  { id: "14", incidentNo: "INC0012314", shortDescription: "Network latency spike — 500ms+ ping",                 state: "In Progress", priority: "P2", assignedTo: "Priya Nair",    application: "Network",  createdDate: "2025-04-22", category: "Network" },
  { id: "15", incidentNo: "INC0012315", shortDescription: "Database index corruption on orders table",           state: "Closed",      priority: "P1", assignedTo: "Sneha Kapoor",  application: "Database", createdDate: "2025-04-21", category: "Database" },
];

export function getIncidents(): Incident[] {
  return _incidents;
}

export function getStats() {
  const total = _incidents.length;
  const open = _incidents.filter(i => i.state === "Open" || i.state === "In Progress").length;
  const p1 = _incidents.filter(i => i.priority === "P1").length;
  const resolved = _incidents.filter(i => i.state === "Resolved" || i.state === "Closed").length;
  const apps = new Set(_incidents.map(i => i.application)).size;
  return { total, open, p1, resolved, apps };
}

export function createIncident(data: Omit<Incident, "id" | "incidentNo" | "createdDate">): Incident {
  const nextNum = 12300 + _incidents.length + 1;
  const newIncident: Incident = {
    id: String(_incidents.length + 1),
    incidentNo: `INC${String(nextNum).padStart(7, "0")}`,
    createdDate: new Date().toISOString().split("T")[0],
    ...data,
  };
  _incidents.push(newIncident);
  return newIncident;
}

export function updateIncident(incidentNo: string, updates: Partial<Omit<Incident, "id" | "incidentNo">>): Incident | null {
  const idx = _incidents.findIndex(i => i.incidentNo.toLowerCase() === incidentNo.toLowerCase());
  if (idx === -1) return null;
  _incidents[idx] = { ..._incidents[idx], ...updates };
  return _incidents[idx];
}