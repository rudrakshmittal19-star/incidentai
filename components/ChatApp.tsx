"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import type { Incident } from "@/lib/incidents";
import ReactMarkdown from "react-markdown";

// ─── Types ──────────────────────────────────────────────────────────────────

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

type Stats = { total: number; open: number; p1: number; resolved: number; apps: number };

// ─── Utils ───────────────────────────────────────────────────────────────────

const uid = () => Math.random().toString(36).slice(2, 10);
const now = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const P_COLOR: Record<string, string> = {
  P1: "#ef4444", P2: "#f97316", P3: "#eab308", P4: "#22c55e",
};
const S_COLOR: Record<string, string> = {
  "Open": "#3b82f6", "In Progress": "#a855f7", "Resolved": "#22c55e", "Closed": "#6b7280",
};

// ─── Components ──────────────────────────────────────────────────────────────

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", padding: "2px 8px",
      borderRadius: 99, fontSize: 11, fontWeight: 600, letterSpacing: "0.04em",
      background: color + "18", color, border: `1px solid ${color}30`,
      fontFamily: "var(--mono)",
    }}>
      {label}
    </span>
  );
}

function IncidentTable({ incidents }: { incidents: Incident[] }) {
  const shown = incidents.slice(0, 8);
  return (
    <div style={{
      marginTop: 14, borderRadius: 10, overflow: "hidden",
      border: "1px solid var(--border-sub)", fontSize: 13,
    }}>
      <div style={{
        display: "grid", gridTemplateColumns: "1.2fr 3fr 1fr 1fr 1.5fr",
        background: "var(--overlay)", padding: "8px 14px",
        borderBottom: "1px solid var(--border-sub)",
      }}>
        {["Incident", "Description", "Priority", "State", "Assigned To"].map(h => (
          <span key={h} style={{ fontSize: 10.5, fontWeight: 700, color: "var(--t3)", textTransform: "uppercase", letterSpacing: "0.07em" }}>{h}</span>
        ))}
      </div>
      {shown.map((inc, i) => (
        <div key={inc.id} style={{
          display: "grid", gridTemplateColumns: "1.2fr 3fr 1fr 1fr 1.5fr",
          padding: "9px 14px", alignItems: "center",
          borderBottom: i < shown.length - 1 ? "1px solid var(--border)" : "none",
          background: i % 2 === 1 ? "var(--surface)55" : "transparent",
          transition: "background 0.15s",
        }}>
          <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--accent)" }}>{inc.incidentNo}</span>
          <span style={{ color: "var(--t1)", lineHeight: 1.4, paddingRight: 8 }}>{inc.shortDescription}</span>
          <Badge label={inc.priority} color={P_COLOR[inc.priority] ?? "#6b7280"} />
          <Badge label={inc.state} color={S_COLOR[inc.state] ?? "#6b7280"} />
          <span style={{ color: "var(--t2)", fontSize: 12.5 }}>{inc.assignedTo}</span>
        </div>
      ))}
      {incidents.length > 8 && (
        <div style={{ padding: "8px 14px", color: "var(--t3)", fontSize: 12, background: "var(--surface)" }}>
          +{incidents.length - 8} more incidents
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, sub, color }: { label: string; value: number; sub?: string; color?: string }) {
  return (
    <div style={{
      background: "var(--surface)", border: "1px solid var(--border)",
      borderRadius: 12, padding: "16px 18px", flex: 1, minWidth: 0,
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: "var(--t3)", textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: 6 }}>{label}</div>
      <div style={{ fontFamily: "var(--mono)", fontSize: 28, fontWeight: 700, color: color ?? "var(--t1)", lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "var(--t3)", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function ChatMessage({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  return (
    <div style={{
      width: "100%", padding: "0",
      background: isUser ? "var(--surface)88" : "transparent",
      borderBottom: "1px solid var(--border)",
    }}>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "18px 28px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 10 }}>
          <div style={{
            width: 26, height: 26, borderRadius: 7, display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: 13, flexShrink: 0,
            background: isUser ? "var(--overlay)" : "var(--accent-dim)",
            border: `1px solid ${isUser ? "var(--border-sub)" : "var(--accent-border)"}`,
          }}>
            {isUser ? "👤" : "🛡️"}
          </div>
          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--t2)" }}>
            {isUser ? "You" : "IncidentAI"}
          </span>
          <span style={{ fontSize: 10.5, color: "var(--t3)", marginLeft: "auto", fontFamily: "var(--mono)" }}>
            {msg.timestamp}
          </span>
        </div>
        <div style={{ paddingLeft: 35 }}>
          <div className="prose">
            <ReactMarkdown>{msg.text}</ReactMarkdown>
          </div>
          {msg.incidents && msg.incidents.length > 0 && (
            <IncidentTable incidents={msg.incidents} />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main App ────────────────────────────────────────────────────────────────

export default function ChatApp() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<Stats>({ total: 0, open: 0, p1: 0, resolved: 0, apps: 0 });
  const [showDash, setShowDash] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const activeConv = conversations.find(c => c.id === activeId) ?? null;

  // Load stats on mount
  useEffect(() => {
    fetch("/api/incidents")
      .then(r => r.json())
      .then(d => setStats(d.stats))
      .catch(console.error);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConv?.messages]);

  const newConversation = useCallback(() => {
    const id = uid();
    const conv: Conversation = {
      id, title: "New conversation", messages: [],
      createdAt: new Date().toLocaleString(),
    };
    setConversations(prev => [conv, ...prev]);
    setActiveId(id);
    return id;
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loading) return;
    let convId = activeId;
    if (!convId) convId = newConversation();

    const userMsg: Message = { id: uid(), role: "user", text: text.trim(), timestamp: now() };

    // Build history for multi-turn memory — get current messages before state update
    const currentConv = conversations.find(c => c.id === convId);
    const history = (currentConv?.messages ?? []).map(m => ({
      role: m.role,
      content: m.text,
    }));

    setConversations(prev => prev.map(c => c.id === convId ? {
      ...c,
      title: c.title === "New conversation" ? text.slice(0, 36) + (text.length > 36 ? "…" : "") : c.title,
      messages: [...c.messages, userMsg],
    } : c));
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text.trim(), history }),
      });
      const data = await res.json();
      const botMsg: Message = {
        id: uid(), role: "assistant",
        text: data.text ?? "Sorry, something went wrong.",
        incidents: data.incidents ?? [],
        timestamp: now(),
      };
      setConversations(prev => prev.map(c => c.id === convId ? {
        ...c, messages: [...c.messages, botMsg],
      } : c));
      // Refresh stats after potential create/update
      fetch("/api/incidents").then(r => r.json()).then(d => setStats(d.stats)).catch(() => {});
    } catch {
      const errMsg: Message = { id: uid(), role: "assistant", text: "⚠️ Network error. Please try again.", timestamp: now() };
      setConversations(prev => prev.map(c => c.id === convId ? { ...c, messages: [...c.messages, errMsg] } : c));
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }, [activeId, loading, newConversation, conversations]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  const QUICK = [
    { label: "🔴 P1 Critical", q: "Show P1 incidents" },
    { label: "📂 Open tickets", q: "Any open tickets?" },
    { label: "⚠️ SLA at risk", q: "SLA at risk" },
    { label: "📊 Summary", q: "Summary" },
    { label: "🕐 Latest", q: "Latest incident" },
    { label: "💻 SAP", q: "SAP issues" },
    { label: "🌐 Network", q: "Network issues" },
    { label: "🔒 VPN", q: "VPN issues" },
    { label: "🗄️ Database", q: "Database issues" },
    { label: "✅ Resolved", q: "Show resolved incidents" },
  ];

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "var(--bg)" }}>

      {/* ── Sidebar ── */}
      <aside style={{
        width: sidebarOpen ? 252 : 0, minWidth: sidebarOpen ? 252 : 0,
        background: "var(--sidebar)", borderRight: "1px solid var(--border)",
        display: "flex", flexDirection: "column", overflow: "hidden",
        transition: "width 0.25s, min-width 0.25s", flexShrink: 0,
      }}>
        {/* Brand */}
        <div style={{ padding: "16px 16px 14px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 34, height: 34, background: "var(--accent)", borderRadius: 9,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0,
              boxShadow: "0 4px 16px rgba(59,130,246,0.35)",
            }}>🛡️</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--t1)", lineHeight: 1.2 }}>IncidentAI</div>
              <div style={{ fontSize: 10.5, color: "var(--t3)", marginTop: 1 }}>Service Manager</div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ padding: "10px 10px 6px", display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
          <SbButton primary onClick={newConversation} icon="＋">New conversation</SbButton>
          <SbButton accent onClick={() => setShowDash(p => !p)} icon="📊">
            {showDash ? "Hide dashboard" : "Show dashboard"}
          </SbButton>
        </div>

        {/* Conversations */}
        {conversations.length > 0 && (
          <div style={{ flexShrink: 0 }}>
            <SbLabel>Conversations</SbLabel>
            <div style={{ padding: "0 8px 4px" }}>
              {conversations.slice(0, 12).map(c => (
                <SbButton key={c.id} active={c.id === activeId} onClick={() => setActiveId(c.id)} icon={c.id === activeId ? "▸" : "💬"}>
                  {c.title}
                </SbButton>
              ))}
            </div>
          </div>
        )}

        {/* Quick actions */}
        <div style={{ flexShrink: 0 }}>
          <SbLabel>Quick actions</SbLabel>
          <div style={{ padding: "0 8px 4px" }}>
            {QUICK.map(({ label, q }) => (
              <SbButton key={q} onClick={() => {
                if (!activeId) newConversation();
                sendMessage(q);
              }}>{label}</SbButton>
            ))}
          </div>
        </div>

        {/* Live metrics */}
        <div style={{ flexShrink: 0 }}>
          <SbLabel>Live metrics</SbLabel>
          <div style={{ padding: "0 12px 8px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            {[
              { l: "Total", v: stats.total },
              { l: "Open", v: stats.open },
              { l: "P1", v: stats.p1 },
              { l: "Done", v: stats.resolved },
            ].map(({ l, v }) => (
              <div key={l} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 10px" }}>
                <div style={{ fontSize: 9.5, fontWeight: 700, color: "var(--t3)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{l}</div>
                <div style={{ fontFamily: "var(--mono)", fontSize: 20, fontWeight: 700, color: "var(--t1)", marginTop: 2 }}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: "auto", borderTop: "1px solid var(--border)", padding: "8px 10px 12px", flexShrink: 0 }}>
          <div style={{ padding: "0 2px" }}>
            <SbButton danger onClick={() => {
              if (activeId) {
                setConversations(prev => prev.map(c => c.id === activeId ? { ...c, messages: [], title: "New conversation" } : c));
              }
            }} icon="🗑️">Clear this chat</SbButton>
            <div style={{ fontSize: 10.5, color: "var(--t3)", marginTop: 6, paddingLeft: 4, lineHeight: 1.8 }}>
              {stats.total} incidents · {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Topbar */}
        <header style={{
          height: 52, display: "flex", alignItems: "center", gap: 12,
          padding: "0 20px", borderBottom: "1px solid var(--border)",
          background: "var(--sidebar)", flexShrink: 0,
        }}>
          <button onClick={() => setSidebarOpen(p => !p)} style={{
            background: "none", border: "none", cursor: "pointer", color: "var(--t3)",
            fontSize: 18, lineHeight: 1, padding: "4px 6px", borderRadius: 6,
            transition: "color 0.15s, background 0.15s",
          }}>☰</button>
          <div style={{ width: 1, height: 20, background: "var(--border)" }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--t2)" }}>
            {activeConv ? activeConv.title : "IncidentAI"}
          </span>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--green)", display: "inline-block" }} />
            <span style={{ fontSize: 11, color: "var(--t3)" }}>Live</span>
          </div>
        </header>

        {/* Dashboard */}
        {showDash && (
          <div style={{ background: "var(--bg)", borderBottom: "1px solid var(--border)", padding: "14px 28px", flexShrink: 0 }}>
            <div style={{ fontSize: 10.5, fontWeight: 600, color: "var(--t3)", textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: 12 }}>
              Live Dashboard · {new Date().toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <StatCard label="Total Incidents" value={stats.total} />
              <StatCard label="Open / Active" value={stats.open} color="#3b82f6" />
              <StatCard label="P1 Critical" value={stats.p1} color="#ef4444" />
              <StatCard label="Resolved" value={stats.resolved} color="#22c55e" />
              <StatCard label="Apps Impacted" value={stats.apps} />
            </div>
          </div>
        )}

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {!activeConv || activeConv.messages.length === 0 ? (
            <EmptyState onQuick={sendMessage} />
          ) : (
            <>
              {activeConv.messages.map(m => <ChatMessage key={m.id} msg={m} />)}
              {loading && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input */}
        <div style={{
          borderTop: "1px solid var(--border)", background: "var(--bg)",
          padding: "14px 0 18px", flexShrink: 0,
        }}>
          <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 28px" }}>
            <div style={{
              display: "flex", alignItems: "flex-end", gap: 10,
              background: "var(--surface)", border: "1.5px solid var(--border-sub)",
              borderRadius: 14, padding: "6px 6px 6px 16px",
              transition: "border-color 0.2s, box-shadow 0.2s",
            }}
              onFocus={() => {}}
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message IncidentAI… (e.g. 'Show P1 incidents')"
                rows={1}
                style={{
                  flex: 1, background: "transparent", border: "none", outline: "none",
                  color: "var(--t1)", fontFamily: "var(--font)", fontSize: 14,
                  resize: "none", lineHeight: 1.6, padding: "6px 0",
                  caretColor: "var(--accent)", maxHeight: 120, overflowY: "auto",
                }}
                onInput={e => {
                  const t = e.target as HTMLTextAreaElement;
                  t.style.height = "auto";
                  t.style.height = t.scrollHeight + "px";
                }}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || loading}
                style={{
                  width: 36, height: 36, borderRadius: 9, border: "none",
                  background: input.trim() && !loading ? "var(--accent)" : "var(--overlay)",
                  color: input.trim() && !loading ? "#fff" : "var(--t3)",
                  cursor: input.trim() && !loading ? "pointer" : "not-allowed",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 16, flexShrink: 0, transition: "all 0.15s",
                }}
              >↑</button>
            </div>
            <div style={{ fontSize: 11, color: "var(--t3)", marginTop: 7, textAlign: "center" }}>
              Enter to send · Shift+Enter for newline
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Small sub-components ────────────────────────────────────────────────────

function SbLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 10.5, fontWeight: 700, color: "var(--t3)", textTransform: "uppercase", letterSpacing: "0.09em", padding: "14px 14px 4px" }}>
      {children}
    </div>
  );
}

function SbButton({ children, onClick, icon, primary, accent, active, danger }: {
  children: React.ReactNode; onClick?: () => void; icon?: string;
  primary?: boolean; accent?: boolean; active?: boolean; danger?: boolean;
}) {
  const [hov, setHov] = useState(false);
  const base: React.CSSProperties = {
    all: "unset", display: "flex", alignItems: "center", gap: 7,
    width: "100%", padding: "7px 10px", borderRadius: 7,
    fontSize: 13, fontWeight: active ? 500 : 400,
    color: danger ? (hov ? "#ef4444" : "var(--t3)") : active ? "var(--t1)" : "var(--t2)",
    cursor: "pointer", lineHeight: 1.45, boxSizing: "border-box",
    background: primary ? "var(--overlay)" : accent ? "var(--accent-dim)" : active ? "var(--overlay)" : hov ? "var(--overlay)88" : "transparent",
    border: primary ? "1px solid var(--border-sub)" : accent ? "1px solid var(--accent-border)" : "1px solid transparent",
    justifyContent: primary || accent ? "center" : "flex-start",
    fontFamily: "var(--font)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
    transition: "all 0.1s",
  };
  if (primary) base.color = "var(--t1)";
  if (accent) base.color = "var(--accent)";
  if (hov && danger) base.background = "#ef444415";
  return (
    <button style={base} onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      {icon && <span>{icon}</span>}
      <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{children}</span>
    </button>
  );
}

function EmptyState({ onQuick }: { onQuick: (q: string) => void }) {
  const chips = [
    "🔴 Show all P1 incidents", "👤 Who has most open tickets?",
    "📊 Full summary", "⚠️ SLA at risk", "➕ Create a P1 SAP incident", "🏆 Which app has most issues?",
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 24px 40px", textAlign: "center", height: "100%" }}>
      <div style={{
        width: 58, height: 58, background: "var(--accent)", borderRadius: 16,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 26, marginBottom: 22, boxShadow: "0 10px 32px rgba(59,130,246,0.3)",
      }}>🛡️</div>
      <div style={{ fontSize: 24, fontWeight: 700, color: "var(--t1)", marginBottom: 8, letterSpacing: "-0.02em" }}>
        How can I help today?
      </div>
      <div style={{ fontSize: 14.5, color: "var(--t2)", maxWidth: 440, lineHeight: 1.7, marginBottom: 32 }}>
        Ask me anything about your incidents in plain English. I can analyse data, spot trends, and even create or update incidents by chat.
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", maxWidth: 520 }}>
        {chips.map(c => (
          <button key={c} onClick={() => onQuick(c.replace(/^[^\w]+/, "").trim())} style={{
            background: "var(--surface)", border: "1px solid var(--border-sub)",
            color: "var(--t2)", padding: "8px 16px", borderRadius: 99, fontSize: 13,
            cursor: "pointer", fontFamily: "var(--font)", transition: "all 0.15s",
          }}
            onMouseEnter={e => { (e.target as HTMLElement).style.background = "var(--overlay)"; (e.target as HTMLElement).style.color = "var(--t1)"; }}
            onMouseLeave={e => { (e.target as HTMLElement).style.background = "var(--surface)"; (e.target as HTMLElement).style.color = "var(--t2)"; }}
          >{c}</button>
        ))}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div style={{ width: "100%", borderBottom: "1px solid var(--border)" }}>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "18px 28px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 10 }}>
          <div style={{ width: 26, height: 26, borderRadius: 7, background: "var(--accent-dim)", border: "1px solid var(--accent-border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>🛡️</div>
          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--t2)" }}>IncidentAI</span>
        </div>
        <div style={{ paddingLeft: 35, display: "flex", gap: 5, alignItems: "center" }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: 7, height: 7, borderRadius: "50%", background: "var(--accent)",
              animation: `bounce 1.2s ${i * 0.2}s infinite`,
            }} />
          ))}
          <style>{`@keyframes bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-6px)} }`}</style>
        </div>
      </div>
    </div>
  );
}
