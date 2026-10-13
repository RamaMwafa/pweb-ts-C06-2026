"use strict";
// ==========================================================================
// LOGIN.TS - Otentikasi dan Navigasi Berdasarkan Role
// ==========================================================================
const loginForm = document.getElementById('login-form');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const submitButton = document.getElementById('submit-btn');
const errorContainer = document.getElementById('error-container');
// Quick fill buttons
const btnFillOperator = document.getElementById('btn-fill-operator');
const btnFillAdmin = document.getElementById('btn-fill-admin');
if (btnFillOperator && usernameInput && passwordInput) {
    btnFillOperator.addEventListener('click', () => {
        usernameInput.value = 'averyp';
        passwordInput.value = 'averyppass';
        hideError();
    });
}
if (btnFillAdmin && usernameInput && passwordInput) {
    btnFillAdmin.addEventListener('click', () => {
        usernameInput.value = 'emilys';
        passwordInput.value = 'emilyspass';
        hideError();
    });
}
function showError(message) {
    if (errorContainer) {
        errorContainer.textContent = message;
        errorContainer.style.display = 'block';
    }
}
function hideError() {
    if (errorContainer) {
        errorContainer.textContent = '';
        errorContainer.style.display = 'none';
    }
}
function setSubmitting(isSubmitting) {
    if (submitButton) {
        submitButton.disabled = isSubmitting;
        submitButton.textContent = isSubmitting ? 'Memproses...' : 'Masuk';
    }
}
// Fungsi utama penanganan login
async function handleLogin(event) {
    event.preventDefault();
    if (!usernameInput || !passwordInput)
        return;
    hideError();
    setSubmitting(true);
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    if (!username || !password) {
        showError('Username dan password tidak boleh kosong.');
        setSubmitting(false);
        return;
    }
    try {
        // 1. Melakukan request POST ke API dummyjson untuk Auth
        const response = await fetch('https://dummyjson.com/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: username,
                password: password,
            })
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Kredensial salah. Periksa username dan password Anda.');
        }
        // 2. Mengambil detail user untuk mendapatkan role pengguna secara akurat
        // Endpoint dummyjson /auth/login terkadang tidak mengembalikan role pada objek root
        let role = 'user';
        let firstName = data.firstName || username;
        try {
            const userResponse = await fetch(`https://dummyjson.com/users/${data.id}`);
            if (userResponse.ok) {
                const userData = await userResponse.json();
                if (userData.role) {
                    role = userData.role;
                }
                if (userData.firstName) {
                    firstName = userData.firstName;
                }
            }
        }
        catch (fetchErr) {
            console.warn('Gagal memuat detail user dari endpoint users, menggunakan role default:', fetchErr);
        }
        // Ketentuan: Apabila role berupa moderator, perlakuan hak akses disamakan dengan role admin
        if (role === 'moderator') {
            role = 'admin';
        }
        // 3. Simpan data sesi otentikasi (token, role, nama pengguna) ke Local Storage
        localStorage.setItem('token', data.accessToken || 'demo-token');
        localStorage.setItem('firstName', firstName);
        localStorage.setItem('role', role);
        // 4. Auto Redirect Berdasarkan Role
        // - Admin/Moderator: diarahkan ke index.html (Dashboard Admin) jika tersedia,
        //   atau fallback ke operator.html jika repo sedang fokus pada panel operator.
        // - User biasa: diarahkan langsung ke operator.html.
        if (role === 'admin') {
            let hasIndexPage = false;
            try {
                if (window.location.protocol.startsWith('http')) {
                    const checkIndex = await fetch('index.html', { method: 'HEAD' });
                    hasIndexPage = checkIndex.ok;
                }
            }
            catch (_) {
                hasIndexPage = false;
            }
            if (hasIndexPage) {
                window.location.href = 'index.html';
            }
            else {
                // Jika index.html belum tersedia pada repository, sambungkan ke operator.html
                window.location.href = 'operator.html';
            }
        }
        else {
            // Role user biasa: diarahkan ke operator.html sesuai ketentuan soal
            window.location.href = 'operator.html';
        }
    }
    catch (error) {
        showError(error.message || 'Terjadi kesalahan jaringan atau koneksi server gagal.');
        setSubmitting(false);
    }
}
if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
}
