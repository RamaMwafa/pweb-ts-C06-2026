"use strict";
/// <reference path="./common.ts" />
// ==========================================================================
// LOGIN.TS - Otentikasi dan Navigasi Berdasarkan Role
// ==========================================================================
document.addEventListener("DOMContentLoaded", function () {
    const loginForm = document.getElementById('login-form');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const submitButton = document.getElementById('submit-btn');
    const errorContainer = document.getElementById('error-container');
    // Quick fill buttons untuk kemudahan testing
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
            // 1. POST ke API DummyJSON
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
            // 2. Mengambil detail user untuk mendapatkan role
            let role = 'user';
            let firstName = data.firstName || username;
            try {
                const userResponse = await fetch(`https://dummyjson.com/users/${data.id}`);
                if (userResponse.ok) {
                    const userData = await userResponse.json();
                    if (userData.role === 'admin' || userData.role === 'moderator' || userData.role === 'user') {
                        role = userData.role;
                    }
                    if (userData.firstName) {
                        firstName = userData.firstName;
                    }
                }
            }
            catch (fetchErr) {
                console.warn('Gagal memuat detail user dari endpoint users:', fetchErr);
            }
            // Moderator disamakan hak aksesnya dengan admin
            if (role === 'moderator') {
                role = 'admin';
            }
            // 3. Simpan data sesi otentikasi ke Local Storage (kompatibel semua format modul)
            localStorage.setItem('token', data.accessToken || 'demo-token');
            localStorage.setItem('firstName', firstName);
            localStorage.setItem('role', role);
            // Simpan format session common
            const s = {
                token: data.accessToken || 'demo-token',
                role: role,
                username: username,
                firstName: firstName
            };
            setSession(s);
            // Simpan format sesi auth-guard (Sahira)
            localStorage.setItem('rs_auth_session', JSON.stringify({
                accessToken: data.accessToken || 'demo-token',
                role: role,
                firstName: firstName
            }));
            // 4. Auto Redirect Berdasarkan Role
            // Pengguna berkategori Admin/Moderator diarahkan ke index.html (Dashboard Admin),
            // Pengguna berkategori User diarahkan ke operator.html.
            if (role === 'admin') {
                window.location.href = 'index.html';
            }
            else {
                window.location.href = 'operator.html';
            }
        }
        catch (error) {
            showError(error.message || 'Terjadi kesalahan jaringan atau server.');
            setSubmitting(false);
        }
    }
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
});
