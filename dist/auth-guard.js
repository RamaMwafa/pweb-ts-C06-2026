const SESSION_KEY = "rs_auth_session";
function kembaliKeLogin() {
    sessionStorage.setItem("rs_return_to", window.location.pathname.split("/").pop() || "layar.html");
    window.location.replace("login.html");
}
export async function wajibLogin(roleDiizinkan = ["admin", "moderator", "user"]) {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) {
        kembaliKeLogin();
        return false;
    }
    let accessToken;
    try {
        const sesi = JSON.parse(raw);
        if (typeof sesi.accessToken !== "string" ||
            sesi.accessToken.length === 0) {
            kembaliKeLogin();
            return false;
        }
        accessToken = sesi.accessToken;
    }
    catch {
        kembaliKeLogin();
        return false;
    }
    try {
        const response = await fetch("https://dummyjson.com/auth/me", {
            method: "GET",
            headers: {
                Authorization: `Bearer ${accessToken}`
            },
            cache: "no-store"
        });
        if (!response.ok) {
            localStorage.removeItem(SESSION_KEY);
            kembaliKeLogin();
            return false;
        }
        const user = await response.json();
        if (!roleDiizinkan.includes(user.role)) {
            window.location.replace("login.html");
            return false;
        }
        localStorage.setItem(SESSION_KEY, JSON.stringify({
            accessToken,
            role: user.role,
            firstName: user.firstName
        }));
        return true;
    }
    catch (error) {
        console.error("Gagal memverifikasi login:", error);
        // Kegagalan koneksi tidak sama dengan token invalid.
        // Halaman tetap tidak dibuka.
        document.body.textContent =
            "Gagal memverifikasi login. Periksa koneksi dan refresh halaman.";
        document.documentElement.classList.add("login-valid");
        return false;
    }
}
