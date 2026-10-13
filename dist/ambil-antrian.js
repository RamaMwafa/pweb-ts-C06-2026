import { ambilJenis, buatTiket } from "./storage.js";
const wadah = document.querySelector("#kartu-ambil");
const hasil = document.querySelector("#hasil-tiket");
const nomor = document.querySelector("#hasil-nomor");
const rincian = document.querySelector("#hasil-rincian");
const tutup = document.querySelector("#tutup-hasil");
let snapshot = "";
const pilihanPrioritas = [
    "Normal",
    "Lansia",
    "Disabilitas",
    "Ibu Hamil",
    "Anak-anak",
    "VIP"
];
function kartuLayanan(jenis) {
    // MEMBUAT KARTU
    const kartu = document.createElement("article");
    kartu.className = "qa-card qa-take-card";
    // HEADER
    const atas = document.createElement("div");
    atas.className = "qa-card-head";
    const judul = document.createElement("h2");
    judul.textContent = jenis.nama;
    const kode = document.createElement("span");
    kode.className = "qa-code";
    kode.textContent = jenis.kode;
    atas.append(judul, kode);
    // TOMBOL AMBIL NOMOR
    const tombol = document.createElement("button");
    tombol.className = "qa-button-primary";
    tombol.textContent = "Ambil Nomor";
    // PILIH PRIORITAS
    const teks = document.createElement("label");
    teks.textContent = "▾ Ambil dengan prioritas";
    teks.className = "qa-priority-label";
    const select = document.createElement("select");
    select.setAttribute("aria-label", `Prioritas untuk ${jenis.nama}`);
    pilihanPrioritas.forEach(p => {
        const option = document.createElement("option");
        option.value = p;
        option.textContent = p;
        select.appendChild(option);
    });
    teks.appendChild(select);
    // EVENT KETIKA TOMBOL DIKLIK
    tombol.addEventListener("click", () => {
        try {
            const tiket = buatTiket(jenis.id, select.value);
            nomor.textContent = tiket.nomor;
            rincian.textContent =
                `${jenis.nama} • ${tiket.prioritas}`;
            hasil.hidden = false;
            hasil.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });
        }
        catch (err) {
            alert(err instanceof Error
                ? err.message
                : "Tiket gagal dibuat.");
        }
    });
    kartu.append(atas, tombol, teks);
    return kartu;
}
// PEMBARUAN OTOMATIS MASTER LAYANAN
function perbarui() {
    const jenis = ambilJenis().filter(j => j.aktif);
    const nilai = JSON.stringify(jenis);
    if (nilai === snapshot) {
        return;
    }
    snapshot = nilai;
    wadah.replaceChildren(...jenis.map(kartuLayanan));
    if (!jenis.length) {
        const teks = document.createElement("p");
        teks.textContent =
            "Belum ada layanan tersedia.";
        wadah.appendChild(teks);
    }
}
// TUTUP POPUP
tutup.addEventListener("click", () => {
    hasil.hidden = true;
});
// DETEKSI PERUBAHAN DATA ANTARTAB
window.addEventListener("storage", event => {
    if (event.key === "rs_jenis_antrian") {
        perbarui();
    }
});
// AUTO UPDATE SETIAP 2 DETIK
perbarui();
setInterval(perbarui, 2000);
