/// <reference path="./common.ts" />

// ==========================================================================
// OPERATOR.TS - Halaman Panel Operator Antrian Rumah Sakit
// ==========================================================================

document.addEventListener("DOMContentLoaded", function () {
    // 1. Auth Guard (Proteksi Halaman)
    const session = requireLogin();
    if (!session) return;

    // Elemen DOM
    const panelContainer = el<HTMLDivElement>("panel");
    const usernameSpan = el<HTMLElement>("username");
    const roleBadge = el<HTMLElement>("role-badge");
    const logoutButton = el<HTMLButtonElement>("logout");
    const btnSoundToggle = el<HTMLButtonElement>("btn-sound-toggle");
    const btnResetData = el<HTMLButtonElement>("btn-reset-data");
    const toastElement = el<HTMLDivElement>("toast");

    // Modal Tambah Tiket
    const btnOpenModal = el<HTMLButtonElement>("btn-open-modal");
    const ticketModal = el<HTMLDivElement>("ticket-modal");
    const modalCloseBtn = el<HTMLButtonElement>("modal-close");
    const modalCancelBtn = el<HTMLButtonElement>("modal-cancel");
    const formNewTicket = el<HTMLFormElement>("form-new-ticket");
    const selectQueueType = el<HTMLSelectElement>("select-queue-type");
    const selectPriority = el<HTMLSelectElement>("select-priority");

    // Tampilkan Pengguna Aktif
    if (usernameSpan) {
        usernameSpan.textContent = session.firstName || session.username || "Operator";
    }
    if (roleBadge) {
        roleBadge.textContent = (session.role || "OPERATOR").toUpperCase();
    }

    // Tombol Logout
    if (logoutButton) {
        logoutButton.addEventListener("click", logout);
    }

    // Suara Panggilan (Web Speech API)
    let soundEnabled = localStorage.getItem("soundEnabled") !== "false";
    updateSoundButton();

    if (btnSoundToggle) {
        btnSoundToggle.addEventListener("click", () => {
            soundEnabled = !soundEnabled;
            localStorage.setItem("soundEnabled", soundEnabled ? "true" : "false");
            updateSoundButton();
            showToast(soundEnabled ? "Suara panggilan diaktifkan" : "Suara panggilan dinonaktifkan");
        });
    }

    function updateSoundButton(): void {
        if (!btnSoundToggle) return;
        if (soundEnabled) {
            btnSoundToggle.textContent = "🔊 Suara: Aktif";
            btnSoundToggle.classList.remove("sound-off");
        } else {
            btnSoundToggle.textContent = "🔇 Suara: Mati";
            btnSoundToggle.classList.add("sound-off");
        }
    }

    function speakCall(ticketNumber: string, queueName: string): void {
        if (!soundEnabled || !("speechSynthesis" in window)) return;
        try {
            window.speechSynthesis.cancel();
            const readable = ticketNumber.replace("-", " ");
            const text = "Nomor antrian " + readable + ", silakan menuju ke " + queueName;
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = "id-ID";
            utterance.rate = 0.95;

            const voices = window.speechSynthesis.getVoices();
            const idVoice = voices.find(v => v.lang.toLowerCase().includes("id"));
            if (idVoice) utterance.voice = idVoice;

            window.speechSynthesis.speak(utterance);
        } catch (e) {
            console.warn("Speech synthesis error:", e);
        }
    }

    function showToast(msg: string): void {
        if (!toastElement) return;
        toastElement.textContent = msg;
        toastElement.style.display = "block";
        setTimeout(() => {
            toastElement.style.display = "none";
        }, 2800);
    }

    // Pastikan jenis antrian lengkap sesuai standar Modul (UMUM-1 s/d PSIKOLOG)
    function ensureModuleTypes(): QueueType[] {
        let types = getTypes();
        if (types.length <= 2) {
            const defaults: QueueType[] = [
                { code: "A", name: "UMUM-1", active: true },
                { code: "B", name: "UMUM-2", active: true },
                { code: "C", name: "UMUM-3", active: true },
                { code: "G", name: "GIGI", active: true },
                { code: "F", name: "FARMASI", active: true },
                { code: "P", name: "PSIKOLOG", active: true },
            ];
            saveTypes(defaults);
            types = defaults;
        }
        return types;
    }

    // Dataset awal modul (Screenshot Halaman 5)
    function seedModuleDemoTickets(): void {
        resetQueue();
        const now = Date.now();
        const demo: Ticket[] = [
            // UMUM-1 (A): Sedang Dipanggil A-001, Berikutnya -, 0 menunggu
            { id: "t-a-1", number: "A-001", typeCode: "A", priority: "Normal", status: "called", seq: 1, createdAt: now - 500000 },

            // UMUM-2 (B): Sedang Dipanggil -, Berikutnya B-003 (Prioritas Disabilitas), 4 menunggu
            { id: "t-b-1", number: "B-001", typeCode: "B", priority: "Normal", status: "done", seq: 2, createdAt: now - 600000 },
            { id: "t-b-2", number: "B-002", typeCode: "B", priority: "Normal", status: "done", seq: 3, createdAt: now - 550000 },
            { id: "t-b-3", number: "B-003", typeCode: "B", priority: "Disabilitas", status: "waiting", seq: 4, createdAt: now - 400000 },
            { id: "t-b-4", number: "B-004", typeCode: "B", priority: "Disabilitas", status: "waiting", seq: 5, createdAt: now - 350000 },
            { id: "t-b-5", number: "B-002", typeCode: "B", priority: "Normal", status: "waiting", seq: 6, createdAt: now - 300000 },
            { id: "t-b-6", number: "B-001", typeCode: "B", priority: "Normal", status: "waiting", seq: 7, createdAt: now - 250000 },

            // UMUM-3 (C): Sedang Dipanggil -, Berikutnya C-001 (Prioritas Normal), 1 menunggu
            { id: "t-c-1", number: "C-001", typeCode: "C", priority: "Normal", status: "waiting", seq: 8, createdAt: now - 200000 },

            // GIGI (G): Sedang Dipanggil G-003 (Lansia), Berikutnya G-001 (Prioritas Normal), 2 menunggu
            { id: "t-g-3", number: "G-003", typeCode: "G", priority: "Lansia", status: "called", seq: 9, createdAt: now - 400000 },
            { id: "t-g-1", number: "G-001", typeCode: "G", priority: "Normal", status: "waiting", seq: 10, createdAt: now - 300000 },
            { id: "t-g-2", number: "G-002", typeCode: "G", priority: "Normal", status: "waiting", seq: 11, createdAt: now - 200000 },

            // FARMASI (F): Sedang Dipanggil F-001, Berikutnya -, 0 menunggu
            { id: "t-f-1", number: "F-001", typeCode: "F", priority: "Normal", status: "called", seq: 12, createdAt: now - 300000 },

            // PSIKOLOG (P): Sedang Dipanggil -, Berikutnya P-001 (Prioritas Normal), 3 menunggu
            { id: "t-p-1", number: "P-001", typeCode: "P", priority: "Normal", status: "waiting", seq: 13, createdAt: now - 300000 },
            { id: "t-p-2", number: "P-002", typeCode: "P", priority: "Normal", status: "waiting", seq: 14, createdAt: now - 200000 },
            { id: "t-p-3", number: "P-003", typeCode: "P", priority: "Normal", status: "waiting", seq: 15, createdAt: now - 100000 },
        ];
        saveTickets(demo);
    }

    // Inisialisasi awal tiket jika belum ada
    if (getTickets().length === 0) {
        seedModuleDemoTickets();
    }

    // Render Kartu Antrian
    function renderCards(): void {
        const types = ensureModuleTypes().filter(t => t.active);
        const allTickets = getTickets();

        if (!panelContainer) return;
        panelContainer.innerHTML = "";

        types.forEach(q => {
            const queueTickets = allTickets.filter(t => t.typeCode === q.code);
            const calledTicket = queueTickets.find(t => t.status === "called");
            const waitingTickets = waitingSorted(queueTickets.filter(t => t.status === "waiting"));
            const nextTicket = waitingTickets.length > 0 ? waitingTickets[0] : null;
            const waitingCount = waitingTickets.length;

            const card = document.createElement("div");
            card.className = "operator-card";

            const calledNum = calledTicket ? calledTicket.number : "-";
            const calledClass = calledTicket ? "ticket-number-called" : "ticket-number-called empty";
            const calledPrio = calledTicket ? "Prioritas " + calledTicket.priority : "";

            const nextNum = nextTicket ? nextTicket.number : "-";
            const nextClass = nextTicket ? "ticket-number-next" : "ticket-number-next empty";
            const nextPrio = nextTicket ? "Prioritas " + nextTicket.priority : "";
            const nextPrioClass = nextTicket ? "priority-tag priority-" + nextTicket.priority.toLowerCase() : "priority-tag";

            card.innerHTML = `
                <div class="card-header">
                    <div class="card-title-group">
                        <span class="queue-name">${esc(q.name)}</span>
                        <span class="queue-code-badge">${esc(q.code)}</span>
                    </div>
                    <span class="waiting-badge">${waitingCount} menunggu</span>
                </div>
                <div class="card-body">
                    <div class="info-column">
                        <div class="column-label">SEDANG DIPANGGIL</div>
                        <div class="${calledClass}">${esc(calledNum)}</div>
                        ${calledPrio ? `<div class="priority-tag">${esc(calledPrio)}</div>` : ""}
                    </div>
                    <div class="info-column">
                        <div class="column-label">BERIKUTNYA</div>
                        <div class="${nextClass}">${esc(nextNum)}</div>
                        ${nextPrio ? `<div class="${nextPrioClass}">${esc(nextPrio)}</div>` : ""}
                    </div>
                </div>
                <div class="card-actions">
                    <button class="btn-action btn-panggil" ${!nextTicket ? "disabled" : ""}>
                        Panggil Berikutnya
                    </button>
                    <button class="btn-action btn-lewati" ${(!calledTicket && !nextTicket) ? "disabled" : ""}>
                        Lewati
                    </button>
                    <button class="btn-action btn-selesai" ${!calledTicket ? "disabled" : ""}>
                        Selesai
                    </button>
                </div>
                <div class="empty-notice">
                    ${waitingCount === 0 ? "Tidak ada tiket menunggu untuk jenis antrian ini." : ""}
                </div>
            `;

            // Pasang Event Listeners
            const btnPanggil = card.querySelector(".btn-panggil") as HTMLButtonElement;
            btnPanggil.addEventListener("click", () => panggilBerikutnya(q.code, q.name));

            const btnLewati = card.querySelector(".btn-lewati") as HTMLButtonElement;
            btnLewati.addEventListener("click", () => lewatiTiket(q.code));

            const btnSelesai = card.querySelector(".btn-selesai") as HTMLButtonElement;
            btnSelesai.addEventListener("click", () => selesaikanTiket(q.code));

            panelContainer.appendChild(card);
        });
    }

    // 1. Tombol Panggil Berikutnya
    function panggilBerikutnya(code: string, name: string): void {
        const all = getTickets();

        // Ubah tiket aktif sebelumnya menjadi Selesai (done)
        all.forEach(t => {
            if (t.typeCode === code && t.status === "called") {
                t.status = "done";
            }
        });

        // Ambil tiket antrian berikutnya dengan prioritas tertinggi
        const waiting = waitingSorted(all.filter(t => t.typeCode === code && t.status === "waiting"));

        if (waiting.length > 0) {
            const next = waiting[0];
            const target = all.find(t => t.id === next.id);
            if (target) {
                target.status = "called";
                saveTickets(all);
                renderCards();
                speakCall(target.number, name);
                showToast("Memanggil " + target.number + " (" + target.priority + ") ke " + name);
            }
        } else {
            saveTickets(all);
            renderCards();
            showToast("Tidak ada tiket menunggu untuk " + name);
        }
    }

    // 2. Tombol Lewati
    function lewatiTiket(code: string): void {
        const all = getTickets();
        const called = all.find(t => t.typeCode === code && t.status === "called");

        if (called) {
            called.status = "skipped";
            saveTickets(all);
            renderCards();
            showToast("Tiket " + called.number + " dilewati.");
            return;
        }

        const waiting = waitingSorted(all.filter(t => t.typeCode === code && t.status === "waiting"));
        if (waiting.length > 0) {
            const next = waiting[0];
            const target = all.find(t => t.id === next.id);
            if (target) {
                target.status = "skipped";
                saveTickets(all);
                renderCards();
                showToast("Tiket " + target.number + " dilewati.");
            }
        }
    }

    // 3. Tombol Selesai
    function selesaikanTiket(code: string): void {
        const all = getTickets();
        const called = all.find(t => t.typeCode === code && t.status === "called");

        if (called) {
            called.status = "done";
            saveTickets(all);
            renderCards();
            showToast("Tiket " + called.number + " telah diselesaikan.");
        }
    }

    // Tombol Reset Data Contoh
    if (btnResetData) {
        btnResetData.addEventListener("click", () => {
            if (confirm("Reset antrian ke contoh modul praktikum?")) {
                seedModuleDemoTickets();
                renderCards();
                showToast("Data antrian berhasil direset.");
            }
        });
    }

    // Modal Terbitkan Tiket Baru
    function populateQueueSelect(): void {
        if (!selectQueueType) return;
        const types = ensureModuleTypes().filter(t => t.active);
        selectQueueType.innerHTML = "";
        types.forEach(t => {
            const opt = document.createElement("option");
            opt.value = t.code;
            opt.textContent = t.name + " (" + t.code + ")";
            selectQueueType.appendChild(opt);
        });
    }

    if (btnOpenModal && ticketModal) {
        btnOpenModal.addEventListener("click", () => {
            populateQueueSelect();
            ticketModal.style.display = "flex";
        });
    }

    function closeModal(): void {
        if (ticketModal) ticketModal.style.display = "none";
    }

    if (modalCloseBtn) modalCloseBtn.addEventListener("click", closeModal);
    if (modalCancelBtn) modalCancelBtn.addEventListener("click", closeModal);

    if (formNewTicket) {
        formNewTicket.addEventListener("submit", (e) => {
            e.preventDefault();
            const code = selectQueueType ? selectQueueType.value : "A";
            const prio = (selectPriority ? selectPriority.value : "Normal") as Priority;

            const t = createTicket(code, prio);
            closeModal();
            renderCards();
            showToast("Tiket " + t.number + " (" + prio + ") berhasil diterbitkan!");
        });
    }

    // Real-time Storage Listener & Polling
    window.addEventListener("storage", (e) => {
        if (e.key === LS_TICKETS || e.key === LS_TYPES || e.key === "tickets" || e.key === "rs_tiket_antrian") {
            renderCards();
        }
    });

    setInterval(renderCards, 2500);

    // Initial render
    renderCards();
});