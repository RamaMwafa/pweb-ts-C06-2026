import { wajibLogin } from "./auth-guard.js";
async function mulai() {
    const bolehMasuk = await wajibLogin([
        "admin",
        "moderator",
        "user"
    ]);
    if (!bolehMasuk)
        return;
    const halaman = document.body.dataset.page;
    if (halaman === "layar") {
        await import("./layar.js");
        await import("./ambil-antrian.js");
    }
    if (halaman === "ambil") {
        await import("./ambil-antrian.js");
    }
    await import("./menu.js");
    document.documentElement.classList.add("login-valid");
}
void mulai().catch(error => {
    console.error("Gagal menjalankan halaman:", error);
});
