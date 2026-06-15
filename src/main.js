// src/main.js
import { sb } from './js/supabase-config.js';

let isLoginMode = true;

// Cek sesi login
sb.auth.getSession().then(({ data: { session } }) => {
    if (session) window.location.href = '/dashboard.html';
});

const form = document.getElementById('auth-form');
const emailInput = document.getElementById('email');
const passInput = document.getElementById('password');
const submitBtn = document.getElementById('submit-btn');
const msgBox = document.getElementById('message-box');
const toggleModeBtn = document.getElementById('toggle-mode');

function showMessage(msg, isError) {
    msgBox.textContent = msg;
    msgBox.className = `p-3 mb-4 text-sm rounded block ${isError ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`;
}

toggleModeBtn.addEventListener('click', () => {
    isLoginMode = !isLoginMode;
    document.getElementById('form-title').textContent = isLoginMode ? 'Selamat Datang 👋' : 'Buat Akun Baru 🚀';
    document.getElementById('form-subtitle').textContent = isLoginMode ? 'Masuk untuk mengelola Widget AI.' : 'Daftar sekarang untuk membuat chatbot.';
    document.getElementById('toggle-text').textContent = isLoginMode ? 'Belum punya akun?' : 'Sudah punya akun?';
    toggleModeBtn.textContent = isLoginMode ? 'Daftar sekarang' : 'Login di sini';
    submitBtn.textContent = isLoginMode ? 'Masuk ke Dashboard' : 'Daftar Sekarang';
    msgBox.classList.add('hidden');
});

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    submitBtn.textContent = 'Memproses...';
    submitBtn.disabled = true;

    const email = emailInput.value;
    const password = passInput.value;

    try {
        if (isLoginMode) {
            const { error } = await sb.auth.signInWithPassword({ email, password });
            if (error) throw error;
            window.location.href = '/dashboard.html';
        } else {
            const { error } = await sb.auth.signUp({ email, password });
            if (error) throw error;
            showMessage('Registrasi berhasil! Cek email Anda atau langsung login.', false);
            isLoginMode = true;
            submitBtn.textContent = 'Masuk ke Dashboard';
        }
    } catch (error) {
        showMessage(error.message, true);
    } finally {
        submitBtn.disabled = false;
        if(isLoginMode && submitBtn.textContent === 'Memproses...') submitBtn.textContent = 'Masuk ke Dashboard';
    }
});

// 1. Konfigurasi
const textElement = document.getElementById("typewriter-text");

// Daftar kata yang akan berganti-ganti
const phrases = [
    "Automating your customer service workflow around the clock.",
    "Turning late-night website visitors into qualified leads.",
    "Answering repetitive customer FAQs instantly and accurately.",
    "Deploying an AI assistant with a simple script copy-paste."
];

// Pengaturan Waktu (milidetik)
const typeSpeed = 100;    // Kecepatan mengetik
const eraseSpeed = 50;    // Kecepatan menghapus
const delayBetweenPhrases = 2000; // Waktu diam saat kata lengkap

// 2. Variabel State (Keadaan)
let phraseIndex = 0; // Indeks kata di dalam array phrases
let charIndex = 0;   // Indeks karakter dalam satu kata
let isErasing = false; // Status apakah sedang menghapus atau mengetik

// 3. Fungsi Utama Typewriter
function type() {
    const currentPhrase = phrases[phraseIndex];
    
    // Kita gunakan Array.from untuk menangani karakter khusus/emoji dengan aman
    const currentChars = Array.from(currentPhrase);

    if (isErasing) {
        // Logika MENGHAPUS
        textElement.textContent = currentChars.slice(0, charIndex - 1).join('');
        charIndex--;
    } else {
        // Logika MENGETIK
        textElement.textContent = currentChars.slice(0, charIndex + 1).join('');
        charIndex++;
    }

    // Menentukan kecepatan berdasarkan status (hapus/tik)
    let currentSpeed = isErasing ? eraseSpeed : typeSpeed;

    // Logika Perubahan State
    
    // Jika selesai mengetik satu kata penuh
    if (!isErasing && charIndex === currentChars.length) {
        isErasing = true;
        currentSpeed = delayBetweenPhrases; // Diam dulu sebelum dihapus
    } 
    // Jika selesai menghapus satu kata penuh
    else if (isErasing && charIndex === 0) {
        isErasing = false;
        // Pindah ke kata berikutnya di array (looping kembali ke 0 jika habis)
        phraseIndex = (phraseIndex + 1) % phrases.length;
        currentSpeed = 500; // Jeda sedikit sebelum mulai mengetik kata baru
    }

    // Jalankan fungsi ini kembali setelah jeda waktu
    setTimeout(type, currentSpeed);
}

// 4. Mulai animasi saat dokumen dimuat
document.addEventListener("DOMContentLoaded", type);

window.addEventListener('scroll', function() {
    const header = document.getElementById('navbar');
    const navContainer = document.getElementById('nav-container');
    const logo = document.getElementById('logo');
    const navLinks = document.querySelectorAll('.nav-link');
    const authBtn = document.getElementById('open-auth-btn');

    if (window.scrollY > 20) {
        // State ketika di-scroll ke bawah (Background Putih)
        header.classList.remove('bg-transparent');
        header.classList.add('bg-white', 'shadow-md');
        
        // Efek mengecilkan padding sedikit saat di-scroll (seamless)

        // Ubah teks menjadi gelap agar terlihat di background putih
        logo.classList.remove('text-white');
        logo.classList.add('text-gray-900');

        navLinks.forEach(link => {
            link.classList.remove('text-gray-300', 'hover:text-white');
            link.classList.add('text-gray-600', 'hover:text-gray-900');
        });

        // Ubah style tombol
        authBtn.classList.remove('border-white/20', 'bg-white/5', 'hover:bg-white/10', 'text-white');
        authBtn.classList.add('border-gray-300', 'bg-gray-100', 'hover:bg-gray-200', 'text-gray-900');

    } else {
        // State awal ketika di paling atas (Background Transparan/Gelap)
        header.classList.add('bg-transparent');
        header.classList.remove('bg-white', 'shadow-md');
        
        // Kembalikan padding
        navContainer.classList.add('py-6');
        navContainer.classList.remove('py-4');

        // Kembalikan teks menjadi putih
        logo.classList.add('text-white');
        logo.classList.remove('text-gray-900');

        navLinks.forEach(link => {
            link.classList.add('text-gray-300', 'hover:text-white');
            link.classList.remove('text-gray-600', 'hover:text-gray-900');
        });

        // Kembalikan style tombol
        authBtn.classList.add('border-white/20', 'bg-white/5', 'hover:bg-white', 'text-white', 'hover:text-black');
        authBtn.classList.remove('border-gray-300', 'bg-gray-100', 'hover:bg-gray-200', 'text-gray-900');
    }
});