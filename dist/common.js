"use strict";
/* Shared types + LocalStorage store untuk Antrian RS (native, tanpa framework). */
const LS_SESSION = "rs_session";
const LS_TYPES = "rs_queue_types";
const LS_TICKETS = "rs_tickets";
const LS_COUNTERS = "rs_counters";
const LS_SEQ = "rs_seq";
const PRIORITIES = ["Normal", "Lansia", "Disabilitas", "VIP"];
function priorityValue(p) {
    if (p === "VIP")
        return 4;
    if (p === "Disabilitas")
        return 3;
    if (p === "Lansia")
        return 2;
    return 1;
}
/* ---------- session ---------- */
function getSession() {
    try {
        const raw = localStorage.getItem(LS_SESSION);
        if (!raw)
            return null;
        return JSON.parse(raw);
    }
    catch (_a) {
        return null;
    }
}
function setSession(s) {
    localStorage.setItem(LS_SESSION, JSON.stringify(s));
}
function clearSession() {
    localStorage.removeItem(LS_SESSION);
}
function isAdminRole(role) {
    return role === "admin" || role === "moderator";
}
function requireLogin() {
    const s = getSession();
    if (!s || !s.token) {
        window.location.href = "login.html";
        return null;
    }
    return s;
}
function requireAdmin() {
    const s = requireLogin();
    if (!s)
        return null;
    if (!isAdminRole(s.role)) {
        window.location.href = "login.html";
        return null;
    }
    return s;
}
function logout() {
    clearSession();
    window.location.href = "login.html";
}
/* ---------- queue types ---------- */
function defaultTypes() {
    return [
        { code: "A", name: "Poli Umum", active: true },
        { code: "B", name: "Poli Gigi", active: true },
    ];
}
function getTypes() {
    try {
        const raw = localStorage.getItem(LS_TYPES);
        if (!raw) {
            const d = defaultTypes();
            localStorage.setItem(LS_TYPES, JSON.stringify(d));
            return d;
        }
        const arr = JSON.parse(raw);
        return Array.isArray(arr) ? arr : defaultTypes();
    }
    catch (_a) {
        return defaultTypes();
    }
}
function saveTypes(t) {
    localStorage.setItem(LS_TYPES, JSON.stringify(t));
}
/* ---------- tickets ---------- */
function getTickets() {
    try {
        const raw = localStorage.getItem(LS_TICKETS);
        if (!raw)
            return [];
        const arr = JSON.parse(raw);
        return Array.isArray(arr) ? arr : [];
    }
    catch (_a) {
        return [];
    }
}
function saveTickets(t) {
    localStorage.setItem(LS_TICKETS, JSON.stringify(t));
}
function getCounters() {
    try {
        return JSON.parse(localStorage.getItem(LS_COUNTERS) || "{}");
    }
    catch (_a) {
        return {};
    }
}
function saveCounters(c) {
    localStorage.setItem(LS_COUNTERS, JSON.stringify(c));
}
function nextSeq() {
    const n = parseInt(localStorage.getItem(LS_SEQ) || "0", 10) || 0;
    const v = n + 1;
    localStorage.setItem(LS_SEQ, String(v));
    return v;
}
function pad3(n) {
    return String(n).padStart(3, "0");
}
function createTicket(typeCode, priority) {
    const code = typeCode.toUpperCase();
    const counters = getCounters();
    const n = (counters[code] || 0) + 1;
    counters[code] = n;
    saveCounters(counters);
    const seq = nextSeq();
    const t = {
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
function waitingSorted(all) {
    return all
        .filter(function (t) { return t.status === "waiting"; })
        .sort(function (a, b) {
        const d = priorityValue(b.priority) - priorityValue(a.priority);
        if (d !== 0)
            return d;
        return a.seq - b.seq;
    });
}
function currentCalled(all) {
    const called = all
        .filter(function (t) { return t.status === "called"; })
        .sort(function (a, b) { return b.createdAt - a.createdAt; });
    return called.length ? called[0] : null;
}
function resetQueue() {
    localStorage.removeItem(LS_TICKETS);
    localStorage.removeItem(LS_COUNTERS);
    localStorage.removeItem(LS_SEQ);
}
/* ---------- small dom helper ---------- */
function el(id) {
    return document.getElementById(id);
}
function esc(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
