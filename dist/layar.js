import { ambilJenis, ambilTiket } from "./storage.js";
// ELEMEN HTML
const wadah = document.querySelector("#kartu-layar");
const waktuUpdate = document.querySelector("#waktu-update");
// MEMBUAT KARTU LAYANAN
function buatKartu(jenis, semuaTiket) {
    // Mengambil tiket berdasarkan jenis layanan
    const tiketLayanan = semuaTiket.filter(tiket => tiket.jenisId === jenis.id);
    // Mengambil nomor yang sedang dipanggil
    const dipanggil = tiketLayanan
        .filter(tiket => tiket.status === "Dipanggil")
        .sort((a, b) => (b.dipanggilPada ?? "").localeCompare(a.dipanggilPada ?? ""))[0];
    // Menghitung jumlah tiket menunggu
    const jumlahMenunggu = tiketLayanan.filter(tiket => tiket.status === "Menunggu").length;
    // Kartu utama
    const kartu = document.createElement("article");
    kartu.className = "qa-card qa-display-card";
    // Header kartu
    const header = document.createElement("div");
    header.className = "qa-card-head";
    const nama = document.createElement("h2");
    nama.textContent = jenis.nama;
    const kode = document.createElement("span");
    kode.className = "qa-code";
    kode.textContent = jenis.kode;
    header.append(nama, kode);
    // Bagian tengah kartu
    const tengah = document.createElement("div");
    tengah.className = "qa-display-middle";
    const status = document.createElement("p");
    status.className = dipanggil
        ? "qa-status-active"
        : "qa-status-empty";
    status.textContent = dipanggil
        ? "● DIPANGGIL"
        : "Belum ada nomor dipanggil";
    const nomor = document.createElement("strong");
    nomor.className = "qa-number";
    nomor.textContent = dipanggil
        ? dipanggil.nomor
        : "—";
    tengah.append(status, nomor);
    // Jumlah antrean menunggu
    const footer = document.createElement("p");
    footer.className = "qa-card-footer";
    footer.textContent =
        `${jumlahMenunggu} tiket menunggu`;
    kartu.append(header, tengah, footer);
    return kartu;
}
// UPDATE TAMPILAN ANTREAN
let snapshot = "";
function perbaruiLayar() {
    if (!wadah || !waktuUpdate) {
        console.error("Elemen kartu-layar atau waktu-update tidak ditemukan.");
        return;
    }
    try {
        // Ambil data dari localStorage
        const semuaJenis = ambilJenis();
        const jenisAktif = semuaJenis.filter(jenis => jenis.aktif);
        const semuaTiket = ambilTiket();
        // Membandingkan perubahan data
        const dataBaru = JSON.stringify({
            jenis: jenisAktif,
            tiket: semuaTiket
        });
        if (dataBaru !== snapshot) {
            snapshot = dataBaru;
            // Kosongkan dan render kartu terbaru
            wadah.replaceChildren();
            if (jenisAktif.length === 0) {
                const pesan = document.createElement("p");
                pesan.textContent =
                    "Belum ada jenis antrean aktif.";
                wadah.appendChild(pesan);
            }
            else {
                jenisAktif.forEach(jenis => {
                    const kartu = buatKartu(jenis, semuaTiket);
                    wadah.appendChild(kartu);
                });
            }
        }
        // Perbarui waktu setiap polling
        if (!document.querySelector("#view-ambil:not([hidden])")) {
            waktuUpdate.textContent =
                `Diperbarui ${new Date().toLocaleTimeString("id-ID")}`;
        }
    }
    catch (error) {
        console.error("Gagal memperbarui layar antrean:", error);
        waktuUpdate.textContent =
            "Gagal memuat data antrean.";
    }
}
// Jalankan ketika halaman pertama dibuka
perbaruiLayar();
// Polling setiap 2 detik
setInterval(perbaruiLayar, 2000);
// Update segera jika localStorage berubah
// dari tab lain pada origin yang sama
window.addEventListener("storage", event => {
    if (event.key === "rs_jenis_antrian" ||
        event.key === "rs_tiket_antrian" ||
        event.key === "rs_tickets" ||
        event.key === "rs_queue_types" ||
        event.key === null) {
        perbaruiLayar();
    }
});
