/// <reference path="./common.ts" />
/* Dashboard Admin (index.html): guard admin, CRUD jenis, tiket manual. */

document.addEventListener("DOMContentLoaded", function () {
  const s = requireAdmin();
  if (!s) return;
  paintNav(s);
  renderTypes();
  renderTickets();
  renderTypeOptions();

  const logoutBtn = el<HTMLButtonElement>("logoutBtn");
  if (logoutBtn) logoutBtn.addEventListener("click", logout);

  const typeForm = el<HTMLFormElement>("typeForm");
  if (typeForm) {
    typeForm.addEventListener("submit", function (e) {
      e.preventDefault();
      addType();
    });
  }

  const ticketForm = el<HTMLFormElement>("ticketForm");
  if (ticketForm) {
    ticketForm.addEventListener("submit", function (e) {
      e.preventDefault();
      addManualTicket();
    });
  }

  const resetBtn = el<HTMLButtonElement>("resetBtn");
  if (resetBtn) {
    resetBtn.addEventListener("click", function () {
      if (confirm("Reset antrian? Semua tiket dihapus dan nomor kembali ke awal.")) {
        resetQueue();
        renderTickets();
      }
    });
  }

  window.addEventListener("storage", function (e) {
    if (e.key === LS_TICKETS || e.key === LS_TYPES || e.key === "rs_tiket_antrian" || e.key === "rs_jenis_antrian" || e.key === null) {
      renderTypes();
      renderTickets();
      renderTypeOptions();
    }
  });
});

function paintNav(s: Session): void {
  const n = el<HTMLElement>("navUser");
  const r = el<HTMLElement>("navRole");
  if (n) n.textContent = s.firstName + " (" + s.username + ")";
  if (r) r.textContent = s.role;
}

function showTypeMsg(text: string, ok: boolean): void {
  const m = el<HTMLElement>("typeMsg");
  if (!m) return;
  m.textContent = text;
  m.className = ok ? "alert ok" : "alert err";
  m.style.display = "block";
  setTimeout(function () { m.style.display = "none"; }, 3000);
}

function addType(): void {
  const codeInput = el<HTMLInputElement>("typeCode");
  const nameInput = el<HTMLInputElement>("typeName");
  if (!codeInput || !nameInput) return;
  const code = codeInput.value.trim().toUpperCase();
  const name = nameInput.value.trim();

  if (!/^[A-Z]$/.test(code)) {
    showTypeMsg("Kode harus 1 huruf kapital (mis. C).", false);
    return;
  }
  if (name.length < 3) {
    showTypeMsg("Nama layanan minimal 3 karakter.", false);
    return;
  }
  const types = getTypes();
  const dupCode = types.some(function (t) { return t.code.toLowerCase() === code.toLowerCase(); });
  const dupName = types.some(function (t) { return t.name.toLowerCase() === name.toLowerCase(); });
  if (dupCode) { showTypeMsg("Kode " + code + " sudah dipakai.", false); return; }
  if (dupName) { showTypeMsg("Nama layanan sudah ada (case-insensitive).", false); return; }

  types.push({ code: code, name: name, active: true });
  saveTypes(types);
  codeInput.value = "";
  nameInput.value = "";
  showTypeMsg("Jenis " + code + " - " + name + " ditambahkan.", true);
  renderTypes();
  renderTypeOptions();
}

function renderTypes(): void {
  const body = el<HTMLElement>("typeBody");
  if (!body) return;
  const types = getTypes();
  body.innerHTML = "";
  if (!types.length) {
    body.innerHTML = '<tr><td colspan="4" class="empty">Belum ada jenis antrian.</td></tr>';
    return;
  }
  types.forEach(function (t) {
    const tr = document.createElement("tr");
    const status = t.active
      ? '<span class="badge on">Aktif</span>'
      : '<span class="badge off">Nonaktif</span>';
    tr.innerHTML =
      "<td><strong>" + esc(t.code) + "</strong></td>" +
      "<td>" + esc(t.name) + "</td>" +
      "<td>" + status + "</td>" +
      "<td class='row-actions'></td>";
    const actions = tr.querySelector(".row-actions") as HTMLElement;

    const toggle = document.createElement("button");
    toggle.textContent = t.active ? "Nonaktifkan" : "Aktifkan";
    toggle.className = "btn small";
    toggle.addEventListener("click", function () {
      const all = getTypes();
      const f = all.filter(function (x) { return x.code === t.code; })[0];
      if (f) { f.active = !f.active; saveTypes(all); renderTypes(); renderTypeOptions(); }
    });

    const del = document.createElement("button");
    del.textContent = "Hapus";
    del.className = "btn small danger";
    del.addEventListener("click", function () {
      if (!confirm("Hapus jenis " + t.code + "?")) return;
      saveTypes(getTypes().filter(function (x) { return x.code !== t.code; }));
      renderTypes();
      renderTypeOptions();
    });

    actions.appendChild(toggle);
    actions.appendChild(del);
    body.appendChild(tr);
  });
}

function renderTypeOptions(): void {
  const sel = el<HTMLSelectElement>("ticketType");
  if (!sel) return;
  const types = getTypes().filter(function (t) { return t.active; });
  const prev = sel.value;
  sel.innerHTML = "";
  if (!types.length) {
    const o = document.createElement("option");
    o.value = "";
    o.textContent = "Tidak ada jenis aktif";
    sel.appendChild(o);
    return;
  }
  types.forEach(function (t) {
    const o = document.createElement("option");
    o.value = t.code;
    o.textContent = t.code + " - " + t.name;
    sel.appendChild(o);
  });
  if (prev) sel.value = prev;
}

function addManualTicket(): void {
  const sel = el<HTMLSelectElement>("ticketType");
  const pri = el<HTMLSelectElement>("ticketPriority");
  const m = el<HTMLElement>("ticketMsg");
  if (!sel || !pri) return;
  if (!sel.value) {
    if (m) { m.textContent = "Tidak ada jenis aktif."; m.className = "alert err"; m.style.display = "block"; }
    return;
  }
  const t = createTicket(sel.value, pri.value as Priority);
  if (m) {
    m.textContent = "Tiket " + t.number + " (" + t.priority + ") diterbitkan.";
    m.className = "alert ok";
    m.style.display = "block";
  }
  renderTickets();
}

function renderTickets(): void {
  const body = el<HTMLElement>("ticketBody");
  const info = el<HTMLElement>("ticketInfo");
  if (!body) return;
  const all = getTickets();
  const waiting = waitingSorted(all);
  if (info) info.textContent = all.length + " tiket • " + waiting.length + " menunggu";
  body.innerHTML = "";
  const last = all.slice(-15).reverse();
  if (!last.length) {
    body.innerHTML = '<tr><td colspan="4" class="empty">Belum ada tiket.</td></tr>';
    return;
  }
  last.forEach(function (t) {
    const tr = document.createElement("tr");
    tr.innerHTML =
      "<td><strong>" + esc(t.number) + "</strong></td>" +
      "<td>" + esc(t.typeCode) + " • " + esc(t.priority) + "</td>" +
      "<td><span class='badge st-" + t.status + "'>" + t.status + "</span></td>" +
      "<td>" + new Date(t.createdAt).toLocaleTimeString("id-ID") + "</td>";
    body.appendChild(tr);
  });
}
