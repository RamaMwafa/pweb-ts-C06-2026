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
/* ---------- queue types ---------- */
function defaultTypes(): QueueType[] {
  return [
    { code: "A", name: "UMUM-1", active: true },
    { code: "B", name: "UMUM-2", active: true },
    { code: "C", name: "UMUM-3", active: true },
    { code: "G", name: "GIGI", active: true },
    { code: "F", name: "FARMASI", active: true },
    { code: "P", name: "PSIKOLOG", active: true },
  ];
}

function getTypes(): QueueType[] {
  try {
    const raw = localStorage.getItem(LS_TYPES);
    if (!raw) {
      // Periksa apakah rs_jenis_antrian ada
      const rawJenis = localStorage.getItem("rs_jenis_antrian");
      if (rawJenis) {
        const arrJenis = JSON.parse(rawJenis);
        if (Array.isArray(arrJenis) && arrJenis.length > 0) {
          const mapped = arrJenis.map((j: any) => ({
            code: j.kode,
            name: j.nama,
            active: j.aktif !== false
          }));
          localStorage.setItem(LS_TYPES, JSON.stringify(mapped));
          return mapped;
        }
      }
      const d = defaultTypes();
      saveTypes(d);
      return d;
    }
    const arr = JSON.parse(raw) as QueueType[];
    return Array.isArray(arr) && arr.length > 0 ? arr : defaultTypes();
  } catch {
    return defaultTypes();
  }
}

function saveTypes(t: QueueType[]): void {
  localStorage.setItem(LS_TYPES, JSON.stringify(t));
  // Sinkronisasi otomatis ke rs_jenis_antrian
  const jenisFormat = t.map(q => ({
    id: q.name.toLowerCase().replace(/\s+/g, "-"),
    kode: q.code,
    nama: q.name,
    aktif: q.active
  }));
  localStorage.setItem("rs_jenis_antrian", JSON.stringify(jenisFormat));
}

/* ---------- tickets ---------- */
function getTickets(): Ticket[] {
  try {
    let tickets: Ticket[] = [];
    const raw = localStorage.getItem(LS_TICKETS);
    if (raw) {
      tickets = JSON.parse(raw) as Ticket[];
      if (!Array.isArray(tickets)) tickets = [];
    }

    // Periksa apakah ada tiket baru dari rs_tiket_antrian (mis. dibuat di ambil-antrian.html)
    const rawTiketAntrian = localStorage.getItem("rs_tiket_antrian");
    if (rawTiketAntrian) {
      const arr = JSON.parse(rawTiketAntrian);
      if (Array.isArray(arr)) {
        arr.forEach((ta: any) => {
          const exists = tickets.find(t => t.number === ta.nomor || t.id === ta.id);
          if (!exists) {
            let st: TicketStatus = "waiting";
            if (ta.status === "Dipanggil") st = "called";
            else if (ta.status === "Selesai") st = "done";
            else if (ta.status === "Dilewati") st = "skipped";

            tickets.push({
              id: ta.id,
              number: ta.nomor,
              typeCode: ta.nomor ? ta.nomor.split("-")[0] : "A",
              priority: (ta.prioritas === "VIP" || ta.prioritas === "Disabilitas" || ta.prioritas === "Lansia") ? ta.prioritas : "Normal",
              status: st,
              seq: tickets.length + 1,
              createdAt: ta.dibuatPada ? new Date(ta.dibuatPada).getTime() : Date.now()
            });
          }
        });
      }
    }
    return tickets;
  } catch {
    return [];
  }
}

function saveTickets(t: Ticket[]): void {
  localStorage.setItem(LS_TICKETS, JSON.stringify(t));

  // Sinkronisasi otomatis ke format rs_tiket_antrian (untuk layar.html & ambil-antrian.html)
  const tiketFormat = t.map(tik => {
    let statusIndo = "Menunggu";
    if (tik.status === "called") statusIndo = "Dipanggil";
    else if (tik.status === "done") statusIndo = "Selesai";
    else if (tik.status === "skipped") statusIndo = "Dilewati";

    return {
      id: tik.id,
      jenisId: tik.typeCode.toLowerCase(),
      nomor: tik.number,
      prioritas: tik.priority,
      status: statusIndo,
      dibuatPada: new Date(tik.createdAt || Date.now()).toISOString(),
      dipanggilPada: tik.status === "called" ? new Date().toISOString() : undefined
    };
  });
  localStorage.setItem("rs_tiket_antrian", JSON.stringify(tiketFormat));
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
  localStorage.removeItem("rs_tiket_antrian");
}

/* ---------- small dom helper ---------- */
function el<T extends HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
