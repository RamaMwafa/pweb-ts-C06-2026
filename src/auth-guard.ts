
export type Role = "admin" | "moderator" | "user";

interface SesiLogin {
  accessToken: string;
  role: Role;
  firstName: string;
}

const SESSION_KEY = "rs_auth_session";

interface AuthUser {
  id: number;
  firstName: string;
  role: Role;
}

function kembaliKeLogin(): void {
  sessionStorage.setItem(
    "rs_return_to",
    window.location.pathname.split("/").pop() || "layar.html"
  );

  window.location.replace("login.html");
}

export async function wajibLogin(
  roleDiizinkan: Role[] = ["admin", "moderator", "user"]
): Promise<boolean> {
  const raw = localStorage.getItem(SESSION_KEY);

  if (!raw) {
    kembaliKeLogin();
    return false;
  }

  let accessToken: string;

  try {
    const sesi = JSON.parse(raw) as Partial<SesiLogin>;

    if (
      typeof sesi.accessToken !== "string" ||
      sesi.accessToken.length === 0
    ) {
      kembaliKeLogin();
      return false;
    }

    accessToken = sesi.accessToken;
  } catch {
    kembaliKeLogin();
    return false;
  }

  try {
    const response = await fetch(
      "https://dummyjson.com/auth/me",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`
        },
        cache: "no-store"
      }
    );

    if (!response.ok) {
      localStorage.removeItem(SESSION_KEY);
      kembaliKeLogin();
      return false;
    }

    const user = await response.json() as AuthUser;

    if (!roleDiizinkan.includes(user.role)) {
      window.location.replace("login.html");
      return false;
    }

    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({
        accessToken,
        role: user.role,
        firstName: user.firstName
      } satisfies SesiLogin)
    );

    return true;

  } catch (error) {
    console.error("Gagal memverifikasi login:", error);

    // Kegagalan koneksi tidak sama dengan token invalid.
    // Halaman tetap tidak dibuka.
    document.body.textContent =
      "Gagal memverifikasi login. Periksa koneksi dan refresh halaman.";

    document.documentElement.classList.add("login-valid");

    return false;
  }
}
