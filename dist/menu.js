const tombolMenu = document.querySelector("#menu-toggle");
const dropdown = document.querySelector("#menu-dropdown");
// HAMBURGER MENU
if (tombolMenu && dropdown) {
    const tutupMenu = () => {
        dropdown.hidden = true;
        tombolMenu.setAttribute("aria-expanded", "false");
    };
    tombolMenu.addEventListener("click", event => {
        event.stopPropagation();
        const akanBuka = dropdown.hidden;
        dropdown.hidden = !akanBuka;
        tombolMenu.setAttribute("aria-expanded", String(akanBuka));
    });
    document.addEventListener("click", event => {
        if (event.target instanceof Node &&
            !dropdown.contains(event.target) &&
            !tombolMenu.contains(event.target)) {
            tutupMenu();
        }
    });
    document.addEventListener("keydown", event => {
        if (event.key === "Escape" && !dropdown.hidden) {
            tutupMenu();
            tombolMenu.focus();
        }
    });
}
// FULLSCREEN
const tombolFullscreen = document.querySelector("[data-fullscreen]");
if (tombolFullscreen) {
    tombolFullscreen.addEventListener("click", async () => {
        try {
            if (document.fullscreenElement) {
                await document.exitFullscreen();
            }
            else {
                await document.documentElement.requestFullscreen();
            }
        }
        catch (error) {
            console.error("Fullscreen gagal:", error);
        }
    });
    document.addEventListener("fullscreenchange", () => {
        tombolFullscreen.textContent =
            document.fullscreenElement
                ? "Keluar Layar Penuh"
                : "Layar Penuh";
    });
}
const tombolView = document.querySelectorAll("[data-view]");
const viewLayar = document.querySelector("#view-layar");
const viewAmbil = document.querySelector("#view-ambil");
function gantiView(view) {
    if (!viewLayar || !viewAmbil)
        return;
    // Menampilkan halaman yang dipilih
    viewLayar.hidden = view !== "layar";
    viewAmbil.hidden = view !== "ambil";
    // Mengubah tombol navigasi aktif
    tombolView.forEach(tombol => {
        tombol.classList.toggle("qa-nav-active", tombol.dataset.view === view);
    });
    // Mengubah judul dashboard
    const judul = document.querySelector(".qa-title h1");
    const subjudul = document.querySelector(".qa-title p");
    if (view === "ambil") {
        if (judul) {
            judul.textContent = "Ambil nomor antrean";
        }
        if (subjudul) {
            subjudul.textContent =
                "Pilih jenis layanan untuk mengambil nomor antrean.";
        }
    }
    else {
        if (judul) {
            judul.textContent = "Nomor sedang dipanggil";
        }
        if (subjudul) {
            subjudul.textContent =
                `Diperbarui ${new Date().toLocaleTimeString("id-ID")}`;
        }
    }
}
tombolView.forEach(tombol => {
    tombol.addEventListener("click", () => {
        gantiView(tombol.dataset.view ?? "layar");
    });
});
export {};
