/* Shared types + LocalStorage store untuk Antrian RS (native, tanpa framework). */

type Role = "admin" | "moderator" | "user";
type Priority = "Normal" | "Lansia" | "Disabilitas" | "VIP";
type TicketStatus = "waiting" | "called" | "done" | "skipped";

interface Session {
  token: string;
  role: Role;
  username: string;
  firstName: string;
}

interface QueueType {
  code: string; // 1 huruf kapital, mis. "A"
  name: string; // nama layanan
  active: boolean;
}

interface Ticket {
  id: string;
  number: string; // format "A-001"
  typeCode: string;
  priority: Priority;
  status: TicketStatus;
  seq: number; // urutan global untuk FIFO
  createdAt: number;
}

const LS_SESSION = "rs_session";
const LS_TYPES = "rs_queue_types";
const LS_TICKETS = "rs_tickets";
const LS_COUNTERS = "rs_counters";
const LS_SEQ = "rs_seq";

const PRIORITIES: Priority[] = ["Normal", "Lansia", "Disabilitas", "VIP"];

function priorityValue(p: Priority): number {
  if (p === "VIP") return 4;
  if (p === "Disabilitas") return 3;
  if (p === "Lansia") return 2;
  return 1;
}

/* ---------- session ---------- */
function getSession(): Session | null {
  try {
    const raw = localStorage.getItem(LS_SESSION);
    if (!raw) return null;
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

function setSession(s: Session): void {
  localStorage.setItem(LS_SESSION, JSON.stringify(s));
}

function clearSession(): void {
  localStorage.removeItem(LS_SESSION);
}

function isAdminRole(role: string | undefined): boolean {
  return role === "admin" || role === "moderator";
}

function requireLogin(): Session | null {
  const s = getSession();
  if (!s || !s.token) {
    window.location.href = "login.html";
    return null;
  }
  return s;
}

function requireAdmin(): Session | null {
  const s = requireLogin();
  if (!s) return null;
  if (!isAdminRole(s.role)) {
    window.location.href = "login.html";
    return null;
  }
  return s;
}

function logout(): void {
  clearSession();
  window.location.href = "login.html";
}

/* ---------- queue types ---------- */
function defaultTypes(): QueueType[] {
  return [
    { code: "A", name: "Poli Umum", active: true },
    { code: "B", name: "Poli Gigi", active: true },
  ];
}

function getTypes(): QueueType[] {
  try {
    const raw = localStorage.getItem(LS_TYPES);
    if (!raw) {
      const d = defaultTypes();
      localStorage.setItem(LS_TYPES, JSON.stringify(d));
      return d;
    }
    const arr = JSON.parse(raw) as QueueType[];
    return Array.isArray(arr) ? arr : defaultTypes();
  } catch {
    return defaultTypes();
  }
}

function saveTypes(t: QueueType[]): void {
  localStorage.setItem(LS_TYPES, JSON.stringify(t));
}

/* ---------- tickets ---------- */
function getTickets(): Ticket[] {
  try {
    const raw = localStorage.getItem(LS_TICKETS);
    if (!raw) return [];
    const arr = JSON.parse(raw) as Ticket[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function saveTickets(t: Ticket[]): void {
  localStorage.setItem(LS_TICKETS, JSON.stringify(t));
}

function getCounters(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(LS_COUNTERS) || "{}") as Record<string, number>;
  } catch {
    return {};
  }
}

function saveCounters(c: Record<string, number>): void {
  localStorage.setItem(LS_COUNTERS, JSON.stringify(c));
}

function nextSeq(): number {
  const n = parseInt(localStorage.getItem(LS_SEQ) || "0", 10) || 0;
  const v = n + 1;
  localStorage.setItem(LS_SEQ, String(v));
  return v;
}

function pad3(n: number): string {
  return String(n).padStart(3, "0");
}

function createTicket(typeCode: string, priority: Priority): Ticket {
  const code = typeCode.toUpperCase();
  const counters = getCounters();
  const n = (counters[code] || 0) + 1;
  counters[code] = n;
  saveCounters(counters);
  const seq = nextSeq();
  const t: Ticket = {
    id: "t" + Date.now() + "-" + seq,
    number: code + "-" + pad3(n),
    typeCode: code,
    priority: priority,
    status: "waiting",
    seq: seq,
    createdAt: Date.now(),
  };
  const all = getTickets();
  all.push(t);
  saveTickets(all);
  return t;
}

function waitingSorted(all: Ticket[]): Ticket[] {
  return all
    .filter(function (t) { return t.status === "waiting"; })
    .sort(function (a, b) {
      const d = priorityValue(b.priority) - priorityValue(a.priority);
      if (d !== 0) return d;
      return a.seq - b.seq;
    });
}

function currentCalled(all: Ticket[]): Ticket | null {
  const called = all
    .filter(function (t) { return t.status === "called"; })
    .sort(function (a, b) { return b.createdAt - a.createdAt; });
  return called.length ? called[0] : null;
}

function resetQueue(): void {
  localStorage.removeItem(LS_TICKETS);
  localStorage.removeItem(LS_COUNTERS);
  localStorage.removeItem(LS_SEQ);
}

/* ---------- small dom helper ---------- */
function el<T extends HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
