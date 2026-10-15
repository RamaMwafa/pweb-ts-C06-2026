export const STORAGE_JENIS = "rs_jenis_antrian";
export const STORAGE_TIKET = "rs_tiket_antrian";
const AWAL = [
    {
        id: "umum-1",
        kode: "A",
        nama: "UMUM-1",
        aktif: true
    },
    {
        id: "umum-2",
        kode: "B",
        nama: "UMUM-2",
        aktif: true
    },
    {
        id: "umum-3",
        kode: "C",
        nama: "UMUM-3",
        aktif: true
    },
    {
        id: "gigi",
        kode: "G",
        nama: "GIGI",
        aktif: true
    },
    {
        id: "farmasi",
        kode: "F",
        nama: "FARMASI",
        aktif: true
    },
    {
        id: "psikolog",
        kode: "P",
        nama: "PSIKOLOG",
        aktif: true
    }
];
function bacaJSON(key, fallback) {
    const raw = localStorage.getItem(key);
    if (raw === null) {
        return fallback;
    }
    try {
        return JSON.parse(raw);
    }
    catch {
        console.error(`Penyimpanan ${key} rusak`);
        return fallback;
    }
}
export function ambilJenis() {
    let jenis = bacaJSON(STORAGE_JENIS, []);
    if (jenis.length === 0) {
        // Periksa apakah rs_queue_types ada
        const rawQueue = localStorage.getItem("rs_queue_types");
        if (rawQueue) {
            try {
                const arr = JSON.parse(rawQueue);
                if (Array.isArray(arr) && arr.length > 0) {
                    jenis = arr.map((q) => ({
                        id: q.name.toLowerCase().replace(/\s+/g, "-"),
                        kode: q.code,
                        nama: q.name,
                        aktif: q.active !== false
                    }));
                }
            }
            catch { }
        }
        if (jenis.length === 0) {
            jenis = AWAL;
        }
        localStorage.setItem(STORAGE_JENIS, JSON.stringify(jenis));
    }
    else {
        // Sinkronkan jika ada jenis baru yang ditambahkan di Dashboard Admin (rs_queue_types)
        const rawQueue = localStorage.getItem("rs_queue_types");
        if (rawQueue) {
            try {
                const arr = JSON.parse(rawQueue);
                if (Array.isArray(arr)) {
                    let updated = false;
                    arr.forEach((q) => {
                        const exists = jenis.find(j => j.kode.toUpperCase() === q.code.toUpperCase());
                        if (!exists) {
                            jenis.push({
                                id: q.name.toLowerCase().replace(/\s+/g, "-"),
                                kode: q.code,
                                nama: q.name,
                                aktif: q.active !== false
                            });
                            updated = true;
                        }
                        else {
                            if (exists.aktif !== q.active) {
                                exists.aktif = q.active;
                                updated = true;
                            }
                        }
                    });
                    if (updated) {
                        localStorage.setItem(STORAGE_JENIS, JSON.stringify(jenis));
                    }
                }
            }
            catch { }
        }
    }
    return Array.isArray(jenis) ? jenis : [];
}
export function ambilTiket() {
    let tiket = bacaJSON(STORAGE_TIKET, []);
    // Sinkronkan status tiket dari rs_tickets (yang diupdate oleh operator.html / admin)
    const rawCommon = localStorage.getItem("rs_tickets");
    if (rawCommon) {
        try {
            const commonTickets = JSON.parse(rawCommon);
            if (Array.isArray(commonTickets)) {
                let changed = false;
                commonTickets.forEach((c) => {
                    const match = tiket.find(t => t.nomor === c.number || t.id === c.id);
                    let stIndo = "Menunggu";
                    if (c.status === "called")
                        stIndo = "Dipanggil";
                    else if (c.status === "done")
                        stIndo = "Selesai";
                    else if (c.status === "skipped")
                        stIndo = "Dilewati";
                    if (match) {
                        if (match.status !== stIndo) {
                            match.status = stIndo;
                            if (stIndo === "Dipanggil" && !match.dipanggilPada) {
                                match.dipanggilPada = new Date().toISOString();
                            }
                            changed = true;
                        }
                    }
                    else {
                        // Tiket dari common belum ada di tiket antrian
                        const jenis = ambilJenis().find(j => j.kode === c.typeCode);
                        tiket.push({
                            id: c.id,
                            jenisId: jenis ? jenis.id : c.typeCode.toLowerCase(),
                            nomor: c.number,
                            prioritas: c.priority,
                            status: stIndo,
                            dibuatPada: new Date(c.createdAt || Date.now()).toISOString(),
                            dipanggilPada: stIndo === "Dipanggil" ? new Date().toISOString() : undefined
                        });
                        changed = true;
                    }
                });
                if (changed) {
                    localStorage.setItem(STORAGE_TIKET, JSON.stringify(tiket));
                }
            }
        }
        catch { }
    }
    return Array.isArray(tiket) ? tiket : [];
}
export function buatTiket(jenisId, prioritas) {
    const jenis = ambilJenis().find(j => j.id === jenisId && j.aktif);
    if (!jenis) {
        throw new Error("Jenis antrean tidak aktif atau tidak ditemukan.");
    }
    const tiket = ambilTiket();
    const terbesar = tiket
        .filter(t => t.jenisId === jenisId || t.nomor.startsWith(jenis.kode + "-"))
        .reduce((n, t) => {
        const angka = Number(t.nomor.split("-").pop());
        return Math.max(n, Number.isFinite(angka) ? angka : 0);
    }, 0);
    const baru = {
        id: crypto.randomUUID(),
        jenisId,
        nomor: `${jenis.kode}-${String(terbesar + 1).padStart(3, "0")}`,
        prioritas,
        status: "Menunggu",
        dibuatPada: new Date().toISOString()
    };
    const semuaTiket = [...tiket, baru];
    localStorage.setItem(STORAGE_TIKET, JSON.stringify(semuaTiket));
    // Sinkronkan ke rs_tickets agar langsung terbaca di operator.html & index.html
    try {
        const rawCommon = localStorage.getItem("rs_tickets");
        let commonTickets = rawCommon ? JSON.parse(rawCommon) : [];
        if (!Array.isArray(commonTickets))
            commonTickets = [];
        let p = "Normal";
        if (prioritas === "VIP" || prioritas === "Disabilitas" || prioritas === "Lansia") {
            p = prioritas;
        }
        commonTickets.push({
            id: baru.id,
            number: baru.nomor,
            typeCode: jenis.kode,
            priority: p,
            status: "waiting",
            seq: commonTickets.length + 1,
            createdAt: Date.now()
        });
        localStorage.setItem("rs_tickets", JSON.stringify(commonTickets));
    }
    catch (err) {
        console.error("Gagal menyinkronkan rs_tickets:", err);
    }
    return baru;
}
