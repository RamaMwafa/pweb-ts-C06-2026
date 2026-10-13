/// <reference path="./common.ts" />
/* Halaman Login: POST dummyjson -> GET /auth/me untuk role. */

document.addEventListener("DOMContentLoaded", function () {
  const existing = getSession();
  if (existing && existing.token) {
    redirectByRole(existing.role);
    return;
  }

  const form = el<HTMLFormElement>("loginForm");
  const userInput = el<HTMLInputElement>("username");
  const passInput = el<HTMLInputElement>("password");
  const btn = el<HTMLButtonElement>("loginBtn");
  const msg = el<HTMLElement>("loginMsg");

  if (!form || !userInput || !passInput || !btn) return;

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    void doLogin(userInput.value.trim(), passInput.value, btn, msg);
  });
});

function redirectByRole(role: string): void {
  if (isAdminRole(role)) {
    window.location.href = "index.html";
  } else {
    window.location.href = "ambil-antrian.html";
  }
}

async function doLogin(
  username: string,
  password: string,
  btn: HTMLButtonElement,
  msg: HTMLElement | null
): Promise<void> {
  function show(text: string, ok: boolean): void {
    if (!msg) return;
    msg.textContent = text;
    msg.className = ok ? "alert ok" : "alert err";
    msg.style.display = "block";
  }
  if (!username || !password) {
    show("Username dan password wajib diisi.", false);
    return;
  }
  btn.disabled = true;
  const original = btn.textContent;
  btn.textContent = "Memverifikasi...";
  try {
    const res = await fetch("https://dummyjson.com/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: username, password: password }),
    });
    if (!res.ok) {
      throw new Error("Kredensial salah (username/password tidak cocok).");
    }
    const data = await res.json();
    const token: string = data.accessToken || data.token || "";
    if (!token) throw new Error("Token tidak diterima dari server.");

    // Login tidak mengembalikan role -> ambil via /auth/me
    let role: Role = "user";
    let firstName: string = data.firstName || username;
    try {
      const meRes = await fetch("https://dummyjson.com/auth/me", {
        headers: { Authorization: "Bearer " + token },
      });
      if (meRes.ok) {
        const me = await meRes.json();
        if (me.role === "admin" || me.role === "moderator" || me.role === "user") {
          role = me.role as Role;
        }
        if (me.firstName) firstName = me.firstName as string;
      }
    } catch {
      // abaikan, tetap sebagai user
    }

    setSession({ token: token, role: role, username: username, firstName: firstName });
    show("Login berhasil. Mengalihkan...", true);
    setTimeout(function () { redirectByRole(role); }, 500);
  } catch (err) {
    const text = err instanceof Error ? err.message : "Koneksi jaringan gagal.";
    show(text, false);
    btn.disabled = false;
    btn.textContent = original || "Login";
  }
}
