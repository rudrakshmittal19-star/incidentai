"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import type { Incident } from "@/lib/incidents";
import ReactMarkdown from "react-markdown";

// ─── Types ───────────────────────────────────────────────────────────────────
type Message = {
  id: string;
  role: "user" | "assistant";
  text: string;
  incidents?: Incident[];
  timestamp: string;
};
type Conversation = {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
};
type Stats = { total: number; open: number; p1: number; resolved: number; apps: number; p2?: number; p3?: number; p4?: number };

// ─── Themes ──────────────────────────────────────────────────────────────────
const THEMES = {
  midnight: {
    name: "🌙 Midnight", bg: "#080a0f", sidebar: "#0c0e14", surface: "#111318",
    overlay: "#181b22", border: "#1e2129", borderSub: "#2a2e38",
    t1: "#eef0f6", t2: "#8b91a0", t3: "#484e5c",
    accent: "#3b82f6", accentDim: "rgba(59,130,246,0.12)", accentBorder: "rgba(59,130,246,0.25)",
  },
  ocean: {
    name: "🌊 Ocean", bg: "#020c18", sidebar: "#041020", surface: "#071628",
    overlay: "#0a1e35", border: "#0f2a48", borderSub: "#163760",
    t1: "#e0f0ff", t2: "#6b9fcc", t3: "#2e5070",
    accent: "#0ea5e9", accentDim: "rgba(14,165,233,0.12)", accentBorder: "rgba(14,165,233,0.25)",
  },
  aurora: {
    name: "🌌 Aurora", bg: "#0a050f", sidebar: "#0f0818", surface: "#160d22",
    overlay: "#1d1230", border: "#27183f", borderSub: "#352150",
    t1: "#f0e8ff", t2: "#9b7fc7", t3: "#4a3570",
    accent: "#a855f7", accentDim: "rgba(168,85,247,0.12)", accentBorder: "rgba(168,85,247,0.25)",
  },
  sunset: {
    name: "🌅 Sunset", bg: "#0f0800", sidebar: "#180d00", surface: "#201200",
    overlay: "#2a1800", border: "#3d2200", borderSub: "#542f00",
    t1: "#fff0e0", t2: "#c8956b", t3: "#6b4020",
    accent: "#f97316", accentDim: "rgba(249,115,22,0.12)", accentBorder: "rgba(249,115,22,0.25)",
  },
  light: {
    name: "☀️ Light", bg: "#ffffff", sidebar: "#f8f9fb", surface: "#f0f2f5",
    overlay: "#e8eaed", border: "#dde1e7", borderSub: "#c8cdd6",
    t1: "#0d1117", t2: "#5a6270", t3: "#9ba3af",
    accent: "#2563eb", accentDim: "rgba(37,99,235,0.08)", accentBorder: "rgba(37,99,235,0.2)",
  },
};
type ThemeKey = keyof typeof THEMES;

// ─── Utils ───────────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 10);
const nowStr = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const P_COLOR: Record<string, string> = { P1: "#ef4444", P2: "#f97316", P3: "#eab308", P4: "#22c55e" };
const S_COLOR: Record<string, string> = { "Open": "#3b82f6", "In Progress": "#a855f7", "Resolved": "#22c55e", "Closed": "#6b7280" };

const SUGGESTIONS: Record<string, string[]> = {
  p1: ["Who is handling P1s?", "SLA at risk?", "P1 details"],
  open: ["Which app has most open?", "SLA at risk", "Show P1 open only"],
  sap: ["SAP P1 incidents", "Who handles SAP?", "SAP resolved"],
  summary: ["Show P1 critical", "SLA at risk", "Latest incident"],
  default: ["Show P1 incidents", "Open tickets", "SLA at risk"],
};
function getSuggestions(q: string) {
  const ql = q.toLowerCase();
  if (ql.includes("p1")) return SUGGESTIONS.p1;
  if (ql.includes("open")) return SUGGESTIONS.open;
  if (ql.includes("sap")) return SUGGESTIONS.sap;
  if (ql.includes("summary")) return SUGGESTIONS.summary;
  return SUGGESTIONS.default;
}

// ─── useIsMobile ─────────────────────────────────────────────────────────────
function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const check = () => setMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return mobile;
}

// ─── Badge ───────────────────────────────────────────────────────────────────
function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", padding: "2px 7px",
      borderRadius: 99, fontSize: 11, fontWeight: 600, letterSpacing: "0.04em",
      background: color + "18", color, border: `1px solid ${color}30`,
      fontFamily: "var(--mono)", whiteSpace: "nowrap",
    }}>{label}</span>
  );
}

// ─── Incident Table (mobile-aware) ────────────────────────────────────────────
function IncidentTable({ incidents, onSelect, isMobile }: { incidents: Incident[]; onSelect: (i: Incident) => void; isMobile: boolean }) {
  const shown = incidents.slice(0, isMobile ? 5 : 8);

  if (isMobile) {
    // Card layout on mobile
    return (
      <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
        {shown.map(inc => (
          <div key={inc.id} onClick={() => onSelect(inc)} style={{
            background: "var(--surface)", border: "1px solid var(--border-sub)",
            borderRadius: 10, padding: "10px 12px", cursor: "pointer",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
              <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--accent)", fontWeight: 600 }}>{inc.incidentNo}</span>
              <div style={{ display: "flex", gap: 5 }}>
                <Badge label={inc.priority} color={P_COLOR[inc.priority] ?? "#6b7280"} />
                <Badge label={inc.state} color={S_COLOR[inc.state] ?? "#6b7280"} />
              </div>
            </div>
            <div style={{ fontSize: 13, color: "var(--t1)", marginBottom: 4, lineHeight: 1.4 }}>{inc.shortDescription}</div>
            <div style={{ fontSize: 11.5, color: "var(--t3)" }}>👤 {inc.assignedTo} · {inc.application}</div>
          </div>
        ))}
        {incidents.length > 5 && (
          <div style={{ fontSize: 12, color: "var(--t3)", textAlign: "center", padding: "4px 0" }}>+{incidents.length - 5} more — tap an incident for details</div>
        )}
      </div>
    );
  }

  return (
    <div style={{ marginTop: 14, borderRadius: 10, overflow: "hidden", border: "1px solid var(--border-sub)", fontSize: 13 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 3fr 1fr 1fr 1.5fr", background: "var(--overlay)", padding: "8px 14px", borderBottom: "1px solid var(--border-sub)" }}>
        {["Incident", "Description", "Priority", "State", "Assigned To"].map(h => (
          <span key={h} style={{ fontSize: 10.5, fontWeight: 700, color: "var(--t3)", textTransform: "uppercase", letterSpacing: "0.07em" }}>{h}</span>
        ))}
      </div>
      {shown.map((inc, i) => (
        <div key={inc.id} onClick={() => onSelect(inc)} style={{
          display: "grid", gridTemplateColumns: "1.2fr 3fr 1fr 1fr 1.5fr",
          padding: "9px 14px", alignItems: "center",
          borderBottom: i < shown.length - 1 ? "1px solid var(--border)" : "none",
          background: i % 2 === 1 ? "var(--surface)55" : "transparent",
          cursor: "pointer", transition: "background 0.15s",
        }}
          onMouseEnter={e => (e.currentTarget.style.background = "var(--overlay)")}
          onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 1 ? "var(--surface)55" : "transparent")}
        >
          <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--accent)" }}>{inc.incidentNo}</span>
          <span style={{ color: "var(--t1)", lineHeight: 1.4, paddingRight: 8 }}>{inc.shortDescription}</span>
          <Badge label={inc.priority} color={P_COLOR[inc.priority] ?? "#6b7280"} />
          <Badge label={inc.state} color={S_COLOR[inc.state] ?? "#6b7280"} />
          <span style={{ color: "var(--t2)", fontSize: 12.5 }}>{inc.assignedTo}</span>
        </div>
      ))}
      {incidents.length > 8 && (
        <div style={{ padding: "8px 14px", color: "var(--t3)", fontSize: 12, background: "var(--surface)" }}>+{incidents.length - 8} more incidents</div>
      )}
    </div>
  );
}

// ─── Incident Modal ───────────────────────────────────────────────────────────
function IncidentModal({ incident, onClose }: { incident: Incident; onClose: () => void }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const rows = [
    ["Incident No", incident.incidentNo], ["Description", incident.shortDescription],
    ["Category", incident.category], ["Application", incident.application],
    ["Priority", incident.priority], ["State", incident.state],
    ["Assigned To", incident.assignedTo], ["Created", incident.createdDate],
  ];
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)", zIndex: 999, display: "flex", alignItems: "flex-end", justifyContent: "center", padding: "0" }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "var(--sidebar)", border: "1px solid var(--border-sub)",
        borderRadius: "16px 16px 0 0", width: "100%", maxWidth: 520,
        maxHeight: "85vh", overflowY: "auto",
        boxShadow: "0 -8px 40px rgba(0,0,0,0.4)",
      }}>
        {/* Handle bar */}
        <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 0" }}>
          <div style={{ width: 36, height: 4, borderRadius: 99, background: "var(--border-sub)" }} />
        </div>
        <div style={{ padding: "12px 20px 10px", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontFamily: "var(--mono)", fontSize: 13, color: "var(--accent)", fontWeight: 600 }}>{incident.incidentNo}</div>
            <div style={{ fontSize: 13, color: "var(--t2)", marginTop: 3, lineHeight: 1.4 }}>{incident.shortDescription}</div>
          </div>
          <button onClick={onClose} style={{ all: "unset", cursor: "pointer", color: "var(--t3)", fontSize: 20, padding: 4 }}>✕</button>
        </div>
        <div style={{ padding: "4px 20px 24px" }}>
          {rows.map(([k, v]) => (
            <div key={k} style={{ display: "flex", gap: 12, padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
              <div style={{ width: 100, fontSize: 11, fontWeight: 700, color: "var(--t3)", textTransform: "uppercase", letterSpacing: "0.07em", flexShrink: 0, paddingTop: 2 }}>{k}</div>
              <div style={{ fontSize: 13.5, color: "var(--t1)", flex: 1 }}>
                {k === "Priority" ? <Badge label={v} color={P_COLOR[v] ?? "#6b7280"} /> :
                 k === "State" ? <Badge label={v} color={S_COLOR[v] ?? "#6b7280"} /> : v}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, color, compact }: { label: string; value: number; color?: string; compact?: boolean }) {
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: compact ? 10 : 12, padding: compact ? "10px 12px" : "16px 18px", flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: compact ? 9 : 10, fontWeight: 700, color: "var(--t3)", textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: compact ? 4 : 6 }}>{label}</div>
      <div style={{ fontFamily: "var(--mono)", fontSize: compact ? 22 : 28, fontWeight: 700, color: color ?? "var(--t1)", lineHeight: 1 }}>{value}</div>
    </div>
  );
}

// ─── Chat Message ─────────────────────────────────────────────────────────────
function ChatMessage({ msg, onIncidentSelect, isMobile }: { msg: Message; onIncidentSelect: (i: Incident) => void; isMobile: boolean }) {
  const isUser = msg.role === "user";
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(msg.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div style={{ width: "100%", background: isUser ? "var(--surface)88" : "transparent", borderBottom: "1px solid var(--border)" }}>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: isMobile ? "14px 16px" : "18px 28px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <div style={{
            width: isMobile ? 24 : 26, height: isMobile ? 24 : 26, borderRadius: 7,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: isMobile ? 12 : 13, flexShrink: 0,
            background: isUser ? "var(--overlay)" : "var(--accent-dim)",
            border: `1px solid ${isUser ? "var(--border-sub)" : "var(--accent-border)"}`,
          }}>{isUser ? "👤" : "🛡️"}</div>
          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--t2)" }}>{isUser ? "You" : "IncidentAI"}</span>
          <span style={{ fontSize: 10, color: "var(--t3)", marginLeft: "auto", fontFamily: "var(--mono)" }}>{msg.timestamp}</span>
          {!isUser && (
            <button onClick={copy} style={{
              all: "unset", cursor: "pointer", fontSize: 11, color: copied ? "var(--accent)" : "var(--t3)",
              padding: "2px 6px", borderRadius: 5, background: "var(--overlay)", border: "1px solid var(--border)",
            }}>{copied ? "✓" : "⎘"}</button>
          )}
        </div>
        <div style={{ paddingLeft: isMobile ? 0 : 34 }}>
          <div className="prose" style={{ fontSize: isMobile ? 14 : 14.5 }}>
            <ReactMarkdown>{msg.text}</ReactMarkdown>
          </div>
          {msg.incidents && msg.incidents.length > 0 && (
            <IncidentTable incidents={msg.incidents} onSelect={onIncidentSelect} isMobile={isMobile} />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Typing Indicator ─────────────────────────────────────────────────────────
function TypingIndicator({ isMobile }: { isMobile: boolean }) {
  return (
    <div style={{ width: "100%", borderBottom: "1px solid var(--border)" }}>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: isMobile ? "14px 16px" : "18px 28px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <div style={{ width: 24, height: 24, borderRadius: 7, background: "var(--accent-dim)", border: "1px solid var(--accent-border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>🛡️</div>
          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--t2)" }}>IncidentAI</span>
        </div>
        <div style={{ paddingLeft: isMobile ? 0 : 34, display: "flex", gap: 5, alignItems: "center" }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--accent)", animation: `bounce 1.2s ${i * 0.2}s infinite` }} />
          ))}
          <style>{`@keyframes bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-6px)}}`}</style>
        </div>
      </div>
    </div>
  );
}

// ─── Suggestions Strip ────────────────────────────────────────────────────────
function SuggestionsStrip({ query, onSend, isMobile }: { query: string; onSend: (q: string) => void; isMobile: boolean }) {
  const chips = getSuggestions(query);
  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: isMobile ? "8px 16px 0" : "8px 28px 0", display: "flex", gap: 6, flexWrap: "wrap" }}>
      {chips.map(c => (
        <button key={c} onClick={() => onSend(c)} style={{
          all: "unset", cursor: "pointer", fontSize: 12, color: "var(--t2)",
          padding: "6px 12px", borderRadius: 99, border: "1px solid var(--border-sub)",
          background: "var(--surface)", fontFamily: "var(--font)",
          WebkitTapHighlightColor: "transparent",
        }}>{c}</button>
      ))}
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState({ onQuick, isMobile }: { onQuick: (q: string) => void; isMobile: boolean }) {
  const chips = ["🔴 Show P1 incidents", "📂 Open tickets", "📊 Summary", "⚠️ SLA at risk", "💻 SAP issues", "🕐 Latest incident"];
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: isMobile ? "48px 20px 32px" : "80px 24px 40px", textAlign: "center", height: "100%" }}>
      <div style={{ width: isMobile ? 50 : 58, height: isMobile ? 50 : 58, background: "var(--accent)", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", fontSize: isMobile ? 22 : 26, marginBottom: 18, boxShadow: "0 10px 32px var(--accent-dim)" }}>🛡️</div>
      <div style={{ fontSize: isMobile ? 20 : 24, fontWeight: 700, color: "var(--t1)", marginBottom: 8, letterSpacing: "-0.02em" }}>How can I help today?</div>
      <div style={{ fontSize: isMobile ? 13.5 : 14.5, color: "var(--t2)", maxWidth: 380, lineHeight: 1.7, marginBottom: 28 }}>
        Ask me anything about your incidents in plain English.
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", maxWidth: isMobile ? "100%" : 520 }}>
        {chips.map(c => (
          <button key={c} onClick={() => onQuick(c.replace(/^[^\w]+/, "").trim())} style={{
            background: "var(--surface)", border: "1px solid var(--border-sub)", color: "var(--t2)",
            padding: isMobile ? "9px 14px" : "8px 16px", borderRadius: 99,
            fontSize: isMobile ? 13 : 13, cursor: "pointer", fontFamily: "var(--font)",
            WebkitTapHighlightColor: "transparent",
          }}>{c}</button>
        ))}
      </div>
    </div>
  );
}

// ─── Sidebar Button ───────────────────────────────────────────────────────────
function SbButton({ children, onClick, icon, primary, accent, active, danger }: {
  children: React.ReactNode; onClick?: () => void; icon?: string;
  primary?: boolean; accent?: boolean; active?: boolean; danger?: boolean;
}) {
  const [hov, setHov] = useState(false);
  const base: React.CSSProperties = {
    all: "unset", display: "flex", alignItems: "center", gap: 7,
    width: "100%", padding: "8px 10px", borderRadius: 7,
    fontSize: 13, fontWeight: active ? 500 : 400,
    color: danger ? (hov ? "#ef4444" : "var(--t3)") : active ? "var(--t1)" : "var(--t2)",
    cursor: "pointer", lineHeight: 1.45, boxSizing: "border-box",
    background: primary ? "var(--overlay)" : accent ? "var(--accent-dim)" : active ? "var(--overlay)" : hov ? "var(--overlay)88" : "transparent",
    border: primary ? "1px solid var(--border-sub)" : accent ? "1px solid var(--accent-border)" : "1px solid transparent",
    justifyContent: primary || accent ? "center" : "flex-start",
    fontFamily: "var(--font)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
    transition: "all 0.1s", WebkitTapHighlightColor: "transparent",
  };
  if (primary) base.color = "var(--t1)";
  if (accent) base.color = "var(--accent)";
  if (hov && danger) base.background = "#ef444415";
  return (
    <button style={base} onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      {icon && <span style={{ flexShrink: 0 }}>{icon}</span>}
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", flex: 1 }}>{children}</span>
    </button>
  );
}

function SbLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 10.5, fontWeight: 700, color: "var(--t3)", textTransform: "uppercase", letterSpacing: "0.09em", padding: "14px 14px 4px" }}>{children}</div>;
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function ChatApp() {
  const isMobile = useIsMobile();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<Stats>({ total: 0, open: 0, p1: 0, resolved: 0, apps: 0 });
  const [showDash, setShowDash] = useState(!isMobile); // hidden by default on mobile
  const [sidebarOpen, setSidebarOpen] = useState(false); // closed by default on mobile
  const [theme, setTheme] = useState<ThemeKey>("midnight");
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [search, setSearch] = useState("");
  const [lastQuery, setLastQuery] = useState("");
  const [showThemes, setShowThemes] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const T = THEMES[theme];
  const activeConv = conversations.find(c => c.id === activeId) ?? null;
  const filteredConvs = conversations.filter(c => c.title.toLowerCase().includes(search.toLowerCase()));

  // On desktop, open sidebar by default
  useEffect(() => {
    if (!isMobile) setSidebarOpen(true);
    else setSidebarOpen(false);
  }, [isMobile]);

  // Apply theme CSS vars
  useEffect(() => {
    const r = document.documentElement.style;
    r.setProperty("--bg", T.bg); r.setProperty("--sidebar", T.sidebar);
    r.setProperty("--surface", T.surface); r.setProperty("--overlay", T.overlay);
    r.setProperty("--border", T.border); r.setProperty("--border-sub", T.borderSub);
    r.setProperty("--t1", T.t1); r.setProperty("--t2", T.t2); r.setProperty("--t3", T.t3);
    r.setProperty("--accent", T.accent); r.setProperty("--accent-dim", T.accentDim);
    r.setProperty("--accent-border", T.accentBorder);
  }, [theme, T]);

  useEffect(() => {
    fetch("/api/incidents").then(r => r.json()).then(d => setStats(d.stats)).catch(console.error);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConv?.messages]);

  // Close sidebar on mobile when selecting a chat
  const selectConv = (id: string) => {
    setActiveId(id);
    if (isMobile) setSidebarOpen(false);
  };

  const newConversation = useCallback(() => {
    const id = uid();
    setConversations(prev => [{ id, title: "New conversation", messages: [], createdAt: new Date().toLocaleString() }, ...prev]);
    setActiveId(id);
    if (isMobile) setSidebarOpen(false);
    return id;
  }, [isMobile]);

  const deleteConversation = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConversations(prev => prev.filter(c => c.id !== id));
    if (activeId === id) setActiveId(null);
  };

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loading) return;
    let convId = activeId;
    if (!convId) convId = newConversation();
    const userMsg: Message = { id: uid(), role: "user", text: text.trim(), timestamp: nowStr() };
    const currentConv = conversations.find(c => c.id === convId);
    const history = (currentConv?.messages ?? []).map(m => ({ role: m.role, content: m.text }));
    setConversations(prev => prev.map(c => c.id === convId ? {
      ...c,
      title: c.title === "New conversation" ? text.slice(0, 34) + (text.length > 34 ? "…" : "") : c.title,
      messages: [...c.messages, userMsg],
    } : c));
    setInput(""); setLastQuery(text); setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text.trim(), history }),
      });
      const data = await res.json();
      const botMsg: Message = { id: uid(), role: "assistant", text: data.text ?? "Sorry, something went wrong.", incidents: data.incidents ?? [], timestamp: nowStr() };
      setConversations(prev => prev.map(c => c.id === convId ? { ...c, messages: [...c.messages, botMsg] } : c));
      fetch("/api/incidents").then(r => r.json()).then(d => setStats(d.stats)).catch(() => {});
    } catch {
      setConversations(prev => prev.map(c => c.id === convId ? { ...c, messages: [...c.messages, { id: uid(), role: "assistant", text: "⚠️ Network error.", timestamp: nowStr() }] } : c));
    } finally {
      setLoading(false);
      if (!isMobile) inputRef.current?.focus();
    }
  }, [activeId, loading, newConversation, conversations, isMobile]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  const QUICK = [
    { label: "🔴 P1 Critical", badge: stats.p1, q: "Show P1 incidents" },
    { label: "📂 Open tickets", badge: stats.open, q: "Any open tickets?" },
    { label: "⚠️ SLA at risk", q: "SLA at risk" },
    { label: "📊 Summary", q: "Summary" },
    { label: "🕐 Latest", q: "Latest incident" },
    { label: "💻 SAP", q: "SAP issues" },
    { label: "🌐 Network", q: "Network issues" },
    { label: "🔒 VPN", q: "VPN issues" },
    { label: "🗄️ Database", q: "Database issues" },
    { label: "✅ Resolved", q: "Show resolved incidents" },
  ];

  const lastMsg = activeConv?.messages.findLast(m => m.role === "assistant");

  return (
    <>
      {selectedIncident && <IncidentModal incident={selectedIncident} onClose={() => setSelectedIncident(null)} />}

      {/* Mobile sidebar overlay */}
      {isMobile && sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 40, backdropFilter: "blur(2px)" }} />
      )}

      <div style={{ display: "flex", height: "100dvh", overflow: "hidden", background: "var(--bg)" }}>

        {/* ── Sidebar ── */}
        <aside style={{
          width: 252, minWidth: 252, flexShrink: 0,
          background: "var(--sidebar)", borderRight: "1px solid var(--border)",
          display: "flex", flexDirection: "column", overflow: "hidden",
          // Mobile: slide in as overlay
          ...(isMobile ? {
            position: "fixed", left: 0, top: 0, bottom: 0, zIndex: 50,
            transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)",
            transition: "transform 0.28s cubic-bezier(0.4,0,0.2,1)",
            boxShadow: sidebarOpen ? "4px 0 24px rgba(0,0,0,0.4)" : "none",
          } : {
            transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)",
            marginLeft: sidebarOpen ? 0 : -252,
            transition: "transform 0.25s, margin-left 0.25s",
          }),
        }}>
          {/* Brand */}
          <div style={{ padding: "16px 16px 14px", borderBottom: "1px solid var(--border)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 34, height: 34, background: "var(--accent)", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0 }}>🛡️</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--t1)" }}>IncidentAI</div>
                <div style={{ fontSize: 10.5, color: "var(--t3)" }}>Service Manager</div>
              </div>
            </div>
            {isMobile && (
              <button onClick={() => setSidebarOpen(false)} style={{ all: "unset", cursor: "pointer", color: "var(--t3)", fontSize: 20, padding: 4 }}>✕</button>
            )}
          </div>

          {/* Scrollable body */}
          <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
            <div style={{ padding: "10px 10px 4px" }}>
              <SbButton primary onClick={newConversation} icon="＋">New conversation</SbButton>
            </div>

            {conversations.length > 2 && (
              <div style={{ padding: "4px 10px" }}>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search chats…"
                  style={{ width: "100%", background: "var(--overlay)", border: "1px solid var(--border)", borderRadius: 7, padding: "7px 10px", fontSize: 12.5, color: "var(--t1)", outline: "none", fontFamily: "var(--font)", boxSizing: "border-box" }} />
              </div>
            )}

            {filteredConvs.length > 0 && (
              <div>
                <SbLabel>Conversations</SbLabel>
                <div style={{ padding: "0 8px 4px" }}>
                  {filteredConvs.slice(0, 12).map(c => (
                    <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <SbButton active={c.id === activeId} onClick={() => selectConv(c.id)} icon={c.id === activeId ? "▸" : "💬"}>{c.title}</SbButton>
                      </div>
                      <button onClick={e => deleteConversation(c.id, e)} style={{ all: "unset", cursor: "pointer", color: "var(--t3)", fontSize: 12, padding: "4px 6px", borderRadius: 5, flexShrink: 0 }}
                        onMouseEnter={e => (e.currentTarget.style.color = "#ef4444")}
                        onMouseLeave={e => (e.currentTarget.style.color = "var(--t3)")}
                      >✕</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <SbLabel>Quick actions</SbLabel>
              <div style={{ padding: "0 8px 4px" }}>
                {QUICK.map(({ label, badge, q }) => (
                  <div key={q} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <SbButton onClick={() => { if (!activeId) newConversation(); sendMessage(q); if (isMobile) setSidebarOpen(false); }}>{label}</SbButton>
                    </div>
                    {badge !== undefined && badge > 0 && (
                      <span style={{ background: "var(--accent)", color: "#fff", fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 99, flexShrink: 0, fontFamily: "var(--mono)" }}>{badge}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <SbLabel>Live metrics</SbLabel>
              <div style={{ padding: "0 12px 8px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                  {[{ l: "Total", v: stats.total }, { l: "Open", v: stats.open }, { l: "P1", v: stats.p1 }, { l: "Done", v: stats.resolved }].map(({ l, v }) => (
                    <div key={l} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 10px" }}>
                      <div style={{ fontSize: 9.5, fontWeight: 700, color: "var(--t3)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{l}</div>
                      <div style={{ fontFamily: "var(--mono)", fontSize: 20, fontWeight: 700, color: "var(--t1)", marginTop: 2 }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <SbLabel>Theme</SbLabel>
              <div style={{ padding: "0 10px 8px" }}>
                <button onClick={() => setShowThemes(p => !p)} style={{ all: "unset", cursor: "pointer", fontSize: 12, color: "var(--t2)", display: "flex", alignItems: "center", gap: 6, padding: "7px 10px", width: "100%", boxSizing: "border-box", borderRadius: 7, border: "1px solid var(--border)", background: "var(--overlay)" }}>
                  <span>{THEMES[theme].name}</span>
                  <span style={{ marginLeft: "auto", color: "var(--t3)" }}>{showThemes ? "▴" : "▾"}</span>
                </button>
                {showThemes && (
                  <div style={{ marginTop: 4, display: "flex", flexDirection: "column", gap: 2 }}>
                    {(Object.keys(THEMES) as ThemeKey[]).map(k => (
                      <button key={k} onClick={() => { setTheme(k); setShowThemes(false); }} style={{
                        all: "unset", cursor: "pointer", fontSize: 13, color: k === theme ? "var(--accent)" : "var(--t2)",
                        padding: "8px 10px", borderRadius: 7, fontFamily: "var(--font)",
                        background: k === theme ? "var(--accent-dim)" : "transparent",
                        border: k === theme ? "1px solid var(--accent-border)" : "1px solid transparent",
                        fontWeight: k === theme ? 600 : 400,
                      }}>{THEMES[k].name}</button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{ borderTop: "1px solid var(--border)", padding: "8px 10px 12px", flexShrink: 0 }}>
            <SbButton onClick={() => setShowDash(p => !p)} icon="📊" accent>{showDash ? "Hide dashboard" : "Show dashboard"}</SbButton>
            <div style={{ marginTop: 4 }}>
              <SbButton danger onClick={() => { if (activeId) setConversations(prev => prev.map(c => c.id === activeId ? { ...c, messages: [], title: "New conversation" } : c)); }} icon="🗑️">Clear this chat</SbButton>
            </div>
            <div style={{ fontSize: 10.5, color: "var(--t3)", marginTop: 6, paddingLeft: 4, lineHeight: 1.8 }}>
              {stats.total} incidents · {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </div>
          </div>
        </aside>

        {/* ── Main ── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>

          {/* Topbar */}
          <header style={{ height: isMobile ? 50 : 52, display: "flex", alignItems: "center", gap: 10, padding: isMobile ? "0 14px" : "0 20px", borderBottom: "1px solid var(--border)", background: "var(--sidebar)", flexShrink: 0 }}>
            <button onClick={() => setSidebarOpen(p => !p)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--t3)", fontSize: 20, lineHeight: 1, padding: "4px 6px", borderRadius: 6, WebkitTapHighlightColor: "transparent", flexShrink: 0 }}>☰</button>
            <div style={{ width: 1, height: 18, background: "var(--border)", flexShrink: 0 }} />
            <span style={{ fontSize: isMobile ? 13 : 13, fontWeight: 600, color: "var(--t2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
              {activeConv ? activeConv.title : "IncidentAI"}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
              {!isMobile && <span style={{ fontSize: 11, color: "var(--t3)" }}>Live</span>}
            </div>
          </header>

          {/* Dashboard — 2-column grid on mobile */}
          {showDash && (
            <div style={{ background: "var(--bg)", borderBottom: "1px solid var(--border)", padding: isMobile ? "12px 14px" : "14px 28px", flexShrink: 0 }}>
              {!isMobile && (
                <div style={{ fontSize: 10.5, fontWeight: 600, color: "var(--t3)", textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: 10 }}>
                  Live Dashboard · {new Date().toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </div>
              )}
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(5,1fr)", gap: isMobile ? 8 : 10 }}>
                <StatCard label="Total" value={stats.total} compact={isMobile} />
                <StatCard label="Open" value={stats.open} color="#3b82f6" compact={isMobile} />
                <StatCard label="P1 Critical" value={stats.p1} color="#ef4444" compact={isMobile} />
                <StatCard label="Resolved" value={stats.resolved} color="#22c55e" compact={isMobile} />
                {!isMobile && <StatCard label="Apps" value={stats.apps} />}
              </div>
            </div>
          )}

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch" }}>
            {!activeConv || activeConv.messages.length === 0 ? (
              <EmptyState onQuick={sendMessage} isMobile={isMobile} />
            ) : (
              <>
                {activeConv.messages.map(m => (
                  <ChatMessage key={m.id} msg={m} onIncidentSelect={setSelectedIncident} isMobile={isMobile} />
                ))}
                {loading && <TypingIndicator isMobile={isMobile} />}
                {!loading && lastMsg && (
                  <SuggestionsStrip query={lastQuery} onSend={sendMessage} isMobile={isMobile} />
                )}
                <div ref={messagesEndRef} style={{ height: 12 }} />
              </>
            )}
          </div>

          {/* Input */}
          <div style={{ borderTop: "1px solid var(--border)", background: "var(--bg)", padding: isMobile ? "10px 0 14px" : "14px 0 18px", flexShrink: 0 }}>
            <div style={{ maxWidth: 760, margin: "0 auto", padding: isMobile ? "0 14px" : "0 28px" }}>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 8, background: "var(--surface)", border: "1.5px solid var(--border-sub)", borderRadius: 14, padding: "6px 6px 6px 14px" }}>
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Message IncidentAI…"
                  rows={1}
                  style={{
                    flex: 1, background: "transparent", border: "none", outline: "none",
                    color: "var(--t1)", fontFamily: "var(--font)", fontSize: isMobile ? 15 : 14,
                    resize: "none", lineHeight: 1.6, padding: "6px 0",
                    caretColor: "var(--accent)", maxHeight: 100, overflowY: "auto",
                    WebkitAppearance: "none",
                  }}
                  onInput={e => { const t = e.target as HTMLTextAreaElement; t.style.height = "auto"; t.style.height = Math.min(t.scrollHeight, 100) + "px"; }}
                />
                <button onClick={() => sendMessage(input)} disabled={!input.trim() || loading} style={{
                  width: isMobile ? 38 : 36, height: isMobile ? 38 : 36, borderRadius: 9, border: "none",
                  background: input.trim() && !loading ? "var(--accent)" : "var(--overlay)",
                  color: input.trim() && !loading ? "#fff" : "var(--t3)",
                  cursor: input.trim() && !loading ? "pointer" : "not-allowed",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 16, flexShrink: 0, transition: "all 0.15s",
                  WebkitTapHighlightColor: "transparent",
                }}>↑</button>
              </div>
              {!isMobile && <div style={{ fontSize: 11, color: "var(--t3)", marginTop: 7, textAlign: "center" }}>Enter to send · Shift+Enter for newline</div>}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
