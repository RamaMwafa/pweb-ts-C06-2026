import { wajibLogin } from "./auth-guard.js";

async function mulai(): Promise<void> {
  const halaman = document.body.dataset.page;

  // Sesuai ketentuan soal: layar.html dan ambil-antrian.html bersifat publik dan dapat diakses langsung tanpa login
  if (halaman === "layar" || halaman === "ambil") {
    if (halaman === "layar") {
      await import("./layar.js");
      await import("./ambil-antrian.js");
    }

    if (halaman === "ambil") {
      await import("./ambil-antrian.js");
    }

    await import("./menu.js");
    document.documentElement.classList.add("login-valid");
    return;
  }

  const bolehMasuk = await wajibLogin([
    "admin",
    "moderator",
    "user"
  ]);

  if (!bolehMasuk) return;

  await import("./menu.js");
  document.documentElement.classList.add("login-valid");
}

void mulai().catch(error => {
  console.error("Gagal menjalankan halaman:", error);
});
