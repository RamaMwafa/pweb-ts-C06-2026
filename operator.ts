// ==========================================================================
// OPERATOR.TS - Halaman Panel Operator Antrian Rumah Sakit
// ==========================================================================

// Tipe Data
type PriorityType = 'VIP' | 'Disabilitas' | 'Lansia' | 'Normal';
type TicketStatus = 'Menunggu' | 'Dipanggil' | 'Selesai' | 'Dilewati';

interface QueueType {
    id?: string;
    code: string;
    name: string;
    active: boolean;
}

interface Ticket {
    id: string;
    number: string;
    queueTypeCode: string;
    queueTypeName?: string;
    priority: PriorityType;
    status: TicketStatus;
    createdAt: number;
    calledAt?: number;
    completedAt?: number;
}

// 1. Auth Guard (Proteksi Halaman)
const authToken = localStorage.getItem('token');
if (!authToken) {
    window.location.href = 'login.html';
}

// Elemen DOM
const panelContainer = document.getElementById('panel') as HTMLDivElement;
const usernameSpan = document.getElementById('username') as HTMLElement;
const roleBadge = document.getElementById('role-badge') as HTMLElement;
const logoutButton = document.getElementById('logout') as HTMLButtonElement;
const btnSoundToggle = document.getElementById('btn-sound-toggle') as HTMLButtonElement;
const btnResetData = document.getElementById('btn-reset-data') as HTMLButtonElement;
const toastElement = document.getElementById('toast') as HTMLDivElement;

// Elemen Modal Tambah Tiket
const btnOpenModal = document.getElementById('btn-open-modal') as HTMLButtonElement;
const ticketModal = document.getElementById('ticket-modal') as HTMLDivElement;
const modalCloseBtn = document.getElementById('modal-close') as HTMLButtonElement;
const modalCancelBtn = document.getElementById('modal-cancel') as HTMLButtonElement;
const formNewTicket = document.getElementById('form-new-ticket') as HTMLFormElement;
const selectQueueType = document.getElementById('select-queue-type') as HTMLSelectElement;
const selectPriority = document.getElementById('select-priority') as HTMLSelectElement;

// Pengaturan Suara Panggilan (Web Speech API)
let soundEnabled = localStorage.getItem('soundEnabled') !== 'false';
updateSoundButton();

if (btnSoundToggle) {
    btnSoundToggle.addEventListener('click', () => {
        soundEnabled = !soundEnabled;
        localStorage.setItem('soundEnabled', soundEnabled ? 'true' : 'false');
        updateSoundButton();
        showToast(soundEnabled ? 'Suara panggilan diaktifkan' : 'Suara panggilan dinonaktifkan');
    });
}

function updateSoundButton(): void {
    if (!btnSoundToggle) return;
    if (soundEnabled) {
        btnSoundToggle.textContent = '🔊 Suara: Aktif';
        btnSoundToggle.classList.remove('sound-off');
    } else {
        btnSoundToggle.textContent = '🔇 Suara: Mati';
        btnSoundToggle.classList.add('sound-off');
    }
}

// Tampilkan Identitas Pengguna Aktif
if (usernameSpan) {
    usernameSpan.textContent = localStorage.getItem('firstName') || 'Petugas Operator';
}
if (roleBadge) {
    const role = (localStorage.getItem('role') || 'operator').toUpperCase();
    roleBadge.textContent = role;
}

// Tombol Logout: Menghapus Sesi Otentikasi dan Redirect ke login.html
if (logoutButton) {
    logoutButton.addEventListener('click', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('firstName');
        localStorage.removeItem('role');
        window.location.href = 'login.html';
    });
}

// Data Awal Master Jenis Antrian (Sesuai Modul Praktikum)
const DEFAULT_QUEUE_TYPES: QueueType[] = [
    { code: 'A', name: 'UMUM-1', active: true },
    { code: 'B', name: 'UMUM-2', active: true },
    { code: 'C', name: 'UMUM-3', active: true },
    { code: 'G', name: 'GIGI', active: true },
    { code: 'F', name: 'FARMASI', active: true },
    { code: 'P', name: 'PSIKOLOG', active: true },
];

// Data Awal Tiket (Meniru Tampilan Persis Screenshot Soal Halaman 5)
function getDefaultTickets(): Ticket[] {
    const now = Date.now();
    return [
        // UMUM-1 (A): Sedang Dipanggil A-001, Berikutnya -, 0 menunggu
        { id: 't-a-1', number: 'A-001', queueTypeCode: 'A', priority: 'Normal', status: 'Dipanggil', createdAt: now - 500000 },

        // UMUM-2 (B): Sedang Dipanggil -, Berikutnya B-003 (Prioritas Disabilitas), 4 menunggu
        { id: 't-b-1', number: 'B-001', queueTypeCode: 'B', priority: 'Normal', status: 'Selesai', createdAt: now - 600000 },
        { id: 't-b-2', number: 'B-002', queueTypeCode: 'B', priority: 'Normal', status: 'Selesai', createdAt: now - 550000 },
        { id: 't-b-3', number: 'B-003', queueTypeCode: 'B', priority: 'Disabilitas', status: 'Menunggu', createdAt: now - 400000 },
        { id: 't-b-4', number: 'B-004', queueTypeCode: 'B', priority: 'Disabilitas', status: 'Menunggu', createdAt: now - 350000 },
        { id: 't-b-5', number: 'B-002', queueTypeCode: 'B', priority: 'Normal', status: 'Menunggu', createdAt: now - 300000 },
        { id: 't-b-6', number: 'B-001', queueTypeCode: 'B', priority: 'Normal', status: 'Menunggu', createdAt: now - 250000 },

        // UMUM-3 (C): Sedang Dipanggil -, Berikutnya C-001 (Prioritas Normal), 1 menunggu
        { id: 't-c-1', number: 'C-001', queueTypeCode: 'C', priority: 'Normal', status: 'Menunggu', createdAt: now - 200000 },

        // GIGI (G): Sedang Dipanggil G-003 (Lansia), Berikutnya G-001 (Prioritas Normal), 2 menunggu
        { id: 't-g-3', number: 'G-003', queueTypeCode: 'G', priority: 'Lansia', status: 'Dipanggil', createdAt: now - 400000 },
        { id: 't-g-1', number: 'G-001', queueTypeCode: 'G', priority: 'Normal', status: 'Menunggu', createdAt: now - 300000 },
        { id: 't-g-2', number: 'G-002', queueTypeCode: 'G', priority: 'Normal', status: 'Menunggu', createdAt: now - 200000 },

        // FARMASI (F): Sedang Dipanggil F-001, Berikutnya -, 0 menunggu
        { id: 't-f-1', number: 'F-001', queueTypeCode: 'F', priority: 'Normal', status: 'Dipanggil', createdAt: now - 300000 },

        // PSIKOLOG (P): Sedang Dipanggil -, Berikutnya P-001 (Prioritas Normal), 3 menunggu
        { id: 't-p-1', number: 'P-001', queueTypeCode: 'P', priority: 'Normal', status: 'Menunggu', createdAt: now - 300000 },
        { id: 't-p-2', number: 'P-002', queueTypeCode: 'P', priority: 'Normal', status: 'Menunggu', createdAt: now - 200000 },
        { id: 't-p-3', number: 'P-003', queueTypeCode: 'P', priority: 'Normal', status: 'Menunggu', createdAt: now - 100000 },
    ];
}

// Fungsi Pengambilan & Penyimpanan Data Local Storage
function getQueueTypes(): QueueType[] {
    const raw = localStorage.getItem('queueTypes') || localStorage.getItem('jenisAntrian');
    if (!raw) {
        localStorage.setItem('queueTypes', JSON.stringify(DEFAULT_QUEUE_TYPES));
        localStorage.setItem('jenisAntrian', JSON.stringify(DEFAULT_QUEUE_TYPES));
        return DEFAULT_QUEUE_TYPES;
    }
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_QUEUE_TYPES;
    } catch {
        return DEFAULT_QUEUE_TYPES;
    }
}

function getTickets(): Ticket[] {
    const raw = localStorage.getItem('tickets') || localStorage.getItem('antrian');
    if (!raw) {
        const initial = getDefaultTickets();
        saveTickets(initial);
        return initial;
    }
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function saveTickets(tickets: Ticket[]): void {
    localStorage.setItem('tickets', JSON.stringify(tickets));
    localStorage.setItem('antrian', JSON.stringify(tickets));
}

// Hirarki Prioritas: VIP/Disabilitas/Lansia lebih didahulukan daripada Normal
const PRIORITY_ORDER: Record<PriorityType, number> = {
    'VIP': 1,
    'Disabilitas': 2,
    'Lansia': 3,
    'Normal': 4,
};

function sortWaitingTickets(tickets: Ticket[]): Ticket[] {
    return [...tickets].sort((a, b) => {
        const rankA = PRIORITY_ORDER[a.priority] || 99;
        const rankB = PRIORITY_ORDER[b.priority] || 99;
        if (rankA !== rankB) {
            return rankA - rankB; // Nilai rank terkecil memiliki prioritas tertinggi
        }
        // Jika prioritas sama, urutkan berdasarkan waktu kedatangan (FIFO)
        return (a.createdAt || 0) - (b.createdAt || 0);
    });
}

// Fungsi Suara Panggilan (Web Speech API)
function speakCall(ticketNumber: string, queueName: string): void {
    if (!soundEnabled || !('speechSynthesis' in window)) return;
    try {
        window.speechSynthesis.cancel();
        const readableNumber = ticketNumber.replace('-', ' ');
        const text = `Nomor antrian ${readableNumber}, silakan menuju ke ${queueName}`;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'id-ID';
        utterance.rate = 0.95;

        // Pilih suara bahasa Indonesia jika didukung sistem
        const voices = window.speechSynthesis.getVoices();
        const indonesianVoice = voices.find(v => v.lang.toLowerCase().includes('id'));
        if (indonesianVoice) {
            utterance.voice = indonesianVoice;
        }

        window.speechSynthesis.speak(utterance);
    } catch (e) {
        console.warn('Speech synthesis error:', e);
    }
}

function showToast(message: string): void {
    if (!toastElement) return;
    toastElement.textContent = message;
    toastElement.style.display = 'block';
    setTimeout(() => {
        toastElement.style.display = 'none';
    }, 2800);
}

// Render Kartu Antrian
function renderCards(): void {
    const queueTypes = getQueueTypes();
    const tickets = getTickets();

    if (!panelContainer) return;
    panelContainer.innerHTML = '';

    // Filter hanya jenis antrian aktif (jika ada flag active)
    const activeQueues = queueTypes.filter(q => q.active !== false);

    activeQueues.forEach((queue) => {
        // Ambil tiket yang cocok dengan kode antrian ini
        const queueTickets = tickets.filter(t => {
            if (t.queueTypeCode) return t.queueTypeCode.toUpperCase() === queue.code.toUpperCase();
            if (t.number) return t.number.toUpperCase().startsWith(queue.code.toUpperCase() + '-');
            return false;
        });

        // Tiket yang sedang dipanggil saat ini
        const currentCalledTicket = queueTickets.find(t => t.status === 'Dipanggil');

        // Tiket yang masih menunggu, diurutkan berdasarkan aturan prioritas
        const rawWaiting = queueTickets.filter(t => t.status === 'Menunggu');
        const sortedWaiting = sortWaitingTickets(rawWaiting);
        const nextTicket = sortedWaiting.length > 0 ? sortedWaiting[0] : null;
        const waitingCount = sortedWaiting.length;

        // Buat elemen Card
        const card = document.createElement('div');
        card.className = 'operator-card';
        card.dataset.queueCode = queue.code;

        // Header Kartu
        const header = document.createElement('div');
        header.className = 'card-header';
        header.innerHTML = `
            <div class="card-title-group">
                <span class="queue-name">${queue.name}</span>
                <span class="queue-code-badge">${queue.code}</span>
            </div>
            <span class="waiting-badge">${waitingCount} menunggu</span>
        `;

        // Body Kartu (Dua Kolom: Sedang Dipanggil & Berikutnya)
        const body = document.createElement('div');
        body.className = 'card-body';

        const calledNumberStr = currentCalledTicket ? currentCalledTicket.number : '-';
        const calledPriorityStr = currentCalledTicket ? `Prioritas ${currentCalledTicket.priority}` : '';
        const calledClass = currentCalledTicket ? 'ticket-number-called' : 'ticket-number-called empty';

        const nextNumberStr = nextTicket ? nextTicket.number : '-';
        const nextPriorityStr = nextTicket ? `Prioritas ${nextTicket.priority}` : '';
        const nextClass = nextTicket ? 'ticket-number-next' : 'ticket-number-next empty';

        let priorityBadgeClass = 'priority-tag';
        if (nextTicket) {
            priorityBadgeClass += ` priority-${nextTicket.priority.toLowerCase()}`;
        }

        body.innerHTML = `
            <div class="info-column">
                <div class="column-label">SEDANG DIPANGGIL</div>
                <div class="${calledClass}">${calledNumberStr}</div>
                ${calledPriorityStr ? `<div class="priority-tag">${calledPriorityStr}</div>` : ''}
            </div>
            <div class="info-column">
                <div class="column-label">BERIKUTNYA</div>
                <div class="${nextClass}">${nextNumberStr}</div>
                ${nextPriorityStr ? `<div class="${priorityBadgeClass}">${nextPriorityStr}</div>` : ''}
            </div>
        `;

        // Tombol Aksi
        const actions = document.createElement('div');
        actions.className = 'card-actions';

        const hasNext = nextTicket !== null;
        const hasCurrent = currentCalledTicket !== undefined;

        actions.innerHTML = `
            <button class="btn-action btn-panggil" ${!hasNext ? 'disabled' : ''} title="Panggil tiket berikutnya">
                Panggil Berikutnya
            </button>
            <button class="btn-action btn-lewati" ${(!hasCurrent && !hasNext) ? 'disabled' : ''} title="Lewati antrian saat ini">
                Lewati
            </button>
            <button class="btn-action btn-selesai" ${!hasCurrent ? 'disabled' : ''} title="Selesaikan tiket yang sedang dipanggil">
                Selesai
            </button>
        `;

        // Catatan ketika tidak ada antrian menunggu
        const footerNotice = document.createElement('div');
        footerNotice.className = 'empty-notice';
        if (waitingCount === 0) {
            footerNotice.textContent = 'Tidak ada tiket menunggu untuk jenis antrian ini.';
        }

        // Event Listener untuk Tombol Panggil Berikutnya
        const btnPanggil = actions.querySelector('.btn-panggil') as HTMLButtonElement;
        btnPanggil.addEventListener('click', () => {
            panggilBerikutnya(queue.code, queue.name);
        });

        // Event Listener untuk Tombol Lewati
        const btnLewati = actions.querySelector('.btn-lewati') as HTMLButtonElement;
        btnLewati.addEventListener('click', () => {
            lewatiTiket(queue.code);
        });

        // Event Listener untuk Tombol Selesai
        const btnSelesai = actions.querySelector('.btn-selesai') as HTMLButtonElement;
        btnSelesai.addEventListener('click', () => {
            selesaikanTiket(queue.code);
        });

        card.appendChild(header);
        card.appendChild(body);
        card.appendChild(actions);
        card.appendChild(footerNotice);

        panelContainer.appendChild(card);
    });
}

// 1. Logika Tombol "Panggil Berikutnya"
// Mengubah tiket aktif sebelumnya menjadi Selesai (Done) dan memanggil tiket antrian berikutnya
function panggilBerikutnya(queueCode: string, queueName: string): void {
    const tickets = getTickets();

    // Selesaikan tiket yang saat ini sedang dipanggil pada jenis antrian ini
    const currentlyCalled = tickets.find(t => 
        (t.queueTypeCode === queueCode || t.number.startsWith(queueCode + '-')) && 
        t.status === 'Dipanggil'
    );

    if (currentlyCalled) {
        currentlyCalled.status = 'Selesai';
        currentlyCalled.completedAt = Date.now();
    }

    // Ambil antrian berikutnya yang berstatus Menunggu dengan urutan prioritas
    const waitingTickets = tickets.filter(t => 
        (t.queueTypeCode === queueCode || t.number.startsWith(queueCode + '-')) && 
        t.status === 'Menunggu'
    );

    const sortedWaiting = sortWaitingTickets(waitingTickets);

    if (sortedWaiting.length > 0) {
        const nextTicket = sortedWaiting[0];
        nextTicket.status = 'Dipanggil';
        nextTicket.calledAt = Date.now();

        saveTickets(tickets);
        renderCards();

        speakCall(nextTicket.number, queueName);
        showToast(`Memanggil nomor ${nextTicket.number} (${nextTicket.priority}) ke ${queueName}`);
    } else {
        saveTickets(tickets);
        renderCards();
        showToast(`Tidak ada tiket menunggu untuk ${queueName}`);
    }
}

// 2. Logika Tombol "Lewati"
// Memindahkan tiket yang tidak hadir ke akhir antrian atau menandainya sebagai Dilewati
function lewatiTiket(queueCode: string): void {
    const tickets = getTickets();

    // Jika ada tiket yang sedang dipanggil tetapi pengunjung tidak hadir
    const currentlyCalled = tickets.find(t => 
        (t.queueTypeCode === queueCode || t.number.startsWith(queueCode + '-')) && 
        t.status === 'Dipanggil'
    );

    if (currentlyCalled) {
        currentlyCalled.status = 'Dilewati';
        saveTickets(tickets);
        renderCards();
        showToast(`Nomor ${currentlyCalled.number} ditandai sebagai Dilewati`);
        return;
    }

    // Jika tidak ada tiket dipanggil, lewati tiket terdepan di antrian menunggu
    const waitingTickets = tickets.filter(t => 
        (t.queueTypeCode === queueCode || t.number.startsWith(queueCode + '-')) && 
        t.status === 'Menunggu'
    );
    const sortedWaiting = sortWaitingTickets(waitingTickets);

    if (sortedWaiting.length > 0) {
        const next = sortedWaiting[0];
        next.status = 'Dilewati';
        saveTickets(tickets);
        renderCards();
        showToast(`Nomor ${next.number} ditandai sebagai Dilewati`);
    }
}

// 3. Logika Tombol "Selesai"
// Menutup tiket yang sedang dipanggil tanpa otomatis memanggil antrian berikutnya
function selesaikanTiket(queueCode: string): void {
    const tickets = getTickets();

    const currentlyCalled = tickets.find(t => 
        (t.queueTypeCode === queueCode || t.number.startsWith(queueCode + '-')) && 
        t.status === 'Dipanggil'
    );

    if (currentlyCalled) {
        currentlyCalled.status = 'Selesai';
        currentlyCalled.completedAt = Date.now();
        saveTickets(tickets);
        renderCards();
        showToast(`Nomor ${currentlyCalled.number} telah diselesaikan`);
    }
}

// Reset data ke contoh default modul
if (btnResetData) {
    btnResetData.addEventListener('click', () => {
        if (confirm('Kembalikan antrian ke contoh modul praktikum?')) {
            const defaults = getDefaultTickets();
            saveTickets(defaults);
            renderCards();
            showToast('Data antrian berhasil direset ke contoh modul');
        }
    });
}

// Modal Tambah Tiket Baru (Untuk simulasi antrian)
function populateQueueSelect(): void {
    if (!selectQueueType) return;
    const queueTypes = getQueueTypes().filter(q => q.active !== false);
    selectQueueType.innerHTML = '';
    queueTypes.forEach(q => {
        const opt = document.createElement('option');
        opt.value = q.code;
        opt.textContent = `${q.name} (${q.code})`;
        selectQueueType.appendChild(opt);
    });
}

if (btnOpenModal && ticketModal) {
    btnOpenModal.addEventListener('click', () => {
        populateQueueSelect();
        ticketModal.style.display = 'flex';
    });
}

function closeModal(): void {
    if (ticketModal) ticketModal.style.display = 'none';
}

if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
if (modalCancelBtn) modalCancelBtn.addEventListener('click', closeModal);

if (formNewTicket) {
    formNewTicket.addEventListener('submit', (e) => {
        e.preventDefault();
        const code = selectQueueType.value;
        const priority = selectPriority.value as PriorityType;

        const tickets = getTickets();
        const queueTickets = tickets.filter(t => 
            t.queueTypeCode === code || t.number.startsWith(code + '-')
        );

        // Nomor urut berikutnya (3 digit format, misal: A-002)
        const nextSeq = queueTickets.length + 1;
        const paddedSeq = String(nextSeq).padStart(3, '0');
        const ticketNumber = `${code}-${paddedSeq}`;

        const newTicket: Ticket = {
            id: 't-' + Date.now(),
            number: ticketNumber,
            queueTypeCode: code,
            priority: priority,
            status: 'Menunggu',
            createdAt: Date.now(),
        };

        tickets.push(newTicket);
        saveTickets(tickets);
        closeModal();
        renderCards();
        showToast(`Tiket ${ticketNumber} (${priority}) berhasil diterbitkan!`);
    });
}

// Sinkronisasi Real-time Antar Tab (Local Storage Event & Polling)
window.addEventListener('storage', (event) => {
    if (event.key === 'tickets' || event.key === 'antrian' || event.key === 'queueTypes' || event.key === 'jenisAntrian') {
        renderCards();
    }
});

// Polling interval 2.5 detik untuk memastikan tampilan selalu mutakhir
setInterval(() => {
    renderCards();
}, 2500);

// Inisialisasi awal render
renderCards();