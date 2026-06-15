import { sb } from './js/supabase-config.js';

let currentUser = null;
let myChartInstance = null; 

// ==========================================
// 1. CEK SESI LOGIN
// ==========================================
sb.auth.getSession().then(({ data: { session } }) => {
    if (!session) {
        window.location.href = '/';
    } else {
        currentUser = session.user;
        document.getElementById('user-email').textContent = currentUser.email;
        
        fetchWidgets();
        fetchAnalyticsSafely();
    }
});

// ==========================================
// 2. LOGOUT
// ==========================================
document.getElementById('logout-btn').addEventListener('click', async () => {
    await sb.auth.signOut();
    window.location.href = '/';
});

// ==========================================
// 3. FETCH WIDGETS
// ==========================================
async function fetchWidgets() {
    const container = document.getElementById('widgets-container');
    const domainSelect = document.getElementById('chat-domain-select');
    
    const { data, error } = await sb.from('widgets').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: false });
    
    if (error) {
        container.innerHTML = `<p class="text-red-500 text-base">Gagal memuat widget.</p>`;
        if (domainSelect) domainSelect.innerHTML = `<option value="">Gagal memuat</option>`;
        return;
    }

    if (data.length === 0) {
        container.innerHTML = `<p class="text-gray-500 text-sm">Belum ada widget. Buat widget pertama Anda!</p>`;
        if (domainSelect) domainSelect.innerHTML = `<option value="">Belum ada widget</option>`;
        return;
    }

    container.innerHTML = '';
    if (domainSelect) domainSelect.innerHTML = '';

    data.forEach((widget, index) => {
        const date = new Date(widget.created_at).toLocaleDateString();
        
        container.innerHTML += `
            <div class="flex flex-col border-b border-gray-100 pb-6 mb-2">
                
                <div class="mb-3">
                    <p class="text-base font-bold text-gray-400 mb-1">Dibuat: ${date}</p>
                    <h4 class="font-bold text-gray-900 truncate w-full">${widget.domain}</h4>
                </div>

                <div class="relative group">
                    <div class="bg-white border border-gray-200 shadow-sm rounded-xl p-3 pr-10">
                        <code class="text-[11px] text-gray-600 font-mono break-all">
                            &lt;script src="https://astachatbot.vercel.app/widget.js" data-uid="${currentUser.id}" defer&gt;&lt;/script&gt;
                        </code>
                    </div>
                    
                    <button onclick="copyWidgetCode(this)" class="absolute top-1/2 -translate-y-1/2 right-2 w-7 h-7 flex items-center justify-center bg-gray-50 border border-gray-200 text-gray-500 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 rounded-lg shadow-sm transition-all opacity-0 group-hover:opacity-100 focus:opacity-100" title="Salin Kode">
                        <svg class="copy-icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                    </button>
                </div>
            </div>
        `;

        // Masukkan ke Dropdown Chatbot
        if (domainSelect) {
            const option = document.createElement('option');
            option.value = widget.domain;
            option.textContent = widget.domain;
            if (index === 0) option.selected = true;
            domainSelect.appendChild(option);
        }
    });
}

// ==========================================
// 4. GENERATE WIDGET (UPDATE LOGIKA DOMAIN GANDA)
// ==========================================
const form = document.getElementById('generate-form');
const urlInput = document.getElementById('url-input');
const btn = document.getElementById('generate-btn');
const btnText = document.getElementById('btn-text'); 
const btnSpinner = document.getElementById('btn-spinner'); 
const statusMsg = document.getElementById('status-msg');

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const rawUrl = urlInput.value;
    
    // Toggle Loading State
    btn.disabled = true;
    btnText.textContent = 'Merayapi Website...';
    btnSpinner.classList.remove('hidden');
    statusMsg.className = "hidden";

    try {
        const apiRes = await fetch('https://devastatek-chatbot-astatek.hf.space/api/scrape', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: rawUrl })
        });

        if (!apiRes.ok) {
            const errData = await apiRes.json();
            throw new Error(errData.detail || "Gagal melakukan proses AI pada website.");
        }

        const cleanDomain = rawUrl.replace('https://', '').replace('http://', '').split('/')[0];

        const { error: dbError } = await sb.from('widgets').insert([
            { user_id: currentUser.id, domain: cleanDomain }
        ]);

        // Cek jika errornya BUKAN karena duplikat domain
        if (dbError && dbError.code !== '23505') {
            throw new Error("Gagal mendaftarkan ke database dashboard.");
        }

        // Tentukan pesan sukses berdasarkan apakah itu data baru atau update
        if (dbError && dbError.code === '23505') {
            statusMsg.textContent = "Berhasil memperbarui konten widget Anda!";
        } else {
            statusMsg.textContent = "Sukses! Widget AI Anda berhasil dikonfigurasi.";
        }
        
        // Tampilkan pesan dengan warna hijau
        statusMsg.className = "text-sm p-3 rounded-xl bg-green-100 text-green-700 block mt-4";
        urlInput.value = '';
        fetchWidgets();

    } catch (error) {
        statusMsg.textContent = error.message;
        statusMsg.className = "text-sm p-3 rounded-xl bg-red-100 text-red-700 block mt-4";
    } finally {
        // Matikan Loading State
        btn.disabled = false;
        btnText.textContent = 'Generate AI Widget';
        btnSpinner.classList.add('hidden');
    }
});

// ==========================================
// 5. FITUR TAMBAHAN: CHART ANALITIK
// ==========================================
async function fetchAnalyticsSafely() {
    try {
        const { data: logs, error } = await sb.from('user_usage_logs').select('created_at, tokens_used').eq('user_id', currentUser.id).order('created_at', { ascending: true });
        
        if (error) throw error; 

        let totalTokens = 0;
        const queriesPerDate = {};

        logs.forEach(log => {
            totalTokens += (log.tokens_used || 0);
            const dateLabel = new Date(log.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
            queriesPerDate[dateLabel] = (queriesPerDate[dateLabel] || 0) + 1;
        });

        // 1. UPDATE KODE DI SINI UNTUK MENGHITUNG RATA-RATA
        const totalQueries = logs.length;
        let avgTokens = 0;
        
        // Mencegah pembagian dengan nol jika belum ada data
        if (totalQueries > 0) {
            avgTokens = Math.round(totalTokens / totalQueries); 
        }

        // 2. TAMPILKAN KE DALAM HTML
        document.getElementById('total-queries').textContent = totalQueries.toLocaleString('id-ID');
        document.getElementById('total-tokens').textContent = totalTokens.toLocaleString('id-ID');
        
        // --- TAMBAHKAN BARIS INI UNTUK CARD BARU ---
        const avgTokensElement = document.getElementById('avg-tokens');
        if (avgTokensElement) {
            avgTokensElement.textContent = avgTokens.toLocaleString('id-ID');
        }

        const labels = Object.keys(queriesPerDate).length ? Object.keys(queriesPerDate) : ['Belum ada data'];
        const dataValues = Object.keys(queriesPerDate).length ? Object.values(queriesPerDate) : [0];

        renderChart(labels, dataValues);
    } catch (e) {
        console.warn("Info: Data Analitik gagal ditarik atau belum ada. Mengabaikan grafik...", e.message);
        renderChart(['Belum ada data'], [0]);
    }
}

function renderChart(labels, dataValues) {
    const canvas = document.getElementById('queryChart');
    const ctx = canvas.getContext('2d');
    
    if (myChartInstance != null) myChartInstance.destroy();

    // 1. Membuat warna Gradien (Atas ke Bawah)
    // Angka 400 adalah estimasi tinggi canvas (bisa disesuaikan dengan tinggi chart Anda)
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, '#3b82f6'); // Atas: Biru Modern
    gradient.addColorStop(1, '#fed7aa'); // Bawah: Oren Pastel

    // Gradien untuk efek hover (sedikit lebih gelap/tegas)
    const hoverGradient = ctx.createLinearGradient(0, 0, 0, 400);
    hoverGradient.addColorStop(0, '#2563eb'); 
    hoverGradient.addColorStop(1, '#fdba74'); 

    myChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Jumlah Query',
                data: dataValues,
                backgroundColor: gradient,       // <-- Terapkan gradien utama di sini
                hoverBackgroundColor: hoverGradient, // <-- Terapkan gradien hover di sini
                borderRadius: 8,
                borderSkipped: 'bottom', 
                maxBarThickness: 40 
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { 
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                    padding: 12,
                    cornerRadius: 8,
                    displayColors: false
                }
            },
            scales: {
                y: { 
                    beginAtZero: true, 
                    ticks: { 
                        stepSize: 1,
                        color: '#6b7280', 
                        font: { family: "'Inter', sans-serif" }
                    },
                    grid: { 
                        color: '#e5e7eb', 
                        lineWidth: 0.5,   // <-- Garis menyamping tipis
                        drawBorder: false,
                        borderDash: [5, 5] 
                    }
                },
                x: { 
                    ticks: { 
                        color: '#6b7280',
                        font: { family: "'Inter', sans-serif" }
                    },
                    grid: { 
                        display: false, 
                        drawBorder: false
                    } 
                }
            }
        }
    });
}

// ==========================================
// 6. TESTER CHATBOT LOGIC (DINAMIS DENGAN DROPDOWN DOMAIN)
// ==========================================
const chatForm = document.getElementById('test-chat-form');
const chatInput = document.getElementById('chat-input');
const chatMessages = document.getElementById('chat-messages');

chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = chatInput.value.trim();
    if (!msg) return;

    // AMBIL DOMAIN SECARA DINAMIS DARI DROPDOWN YANG DIPILIH USER
    const selectedDomain = document.getElementById('chat-domain-select').value;

    // Validasi jika user belum memiliki widget atau belum memilih domain
    if (!selectedDomain || selectedDomain === "") {
        alert("Silakan daftarkan atau pilih domain website terlebih dahulu.");
        return;
    }

    // 1. Tampilkan pesan user
    appendMessage('user', msg);
    chatInput.value = '';

    // 2. Tampilkan indikator loading AI
    const loadingId = 'loading-' + Date.now();
    const loadingDiv = document.createElement('div');
    loadingDiv.id = loadingId;
    loadingDiv.className = 'flex items-start gap-3';
    loadingDiv.innerHTML = `
        <div class="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white shrink-0 text-xs font-bold shadow-sm">AI</div>
        <div class="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm border border-gray-100 flex gap-1.5 items-center">
            <span class="animate-bounce w-2 h-2 bg-gray-400 rounded-full"></span>
            <span class="animate-bounce w-2 h-2 bg-gray-400 rounded-full" style="animation-delay: 0.15s"></span>
            <span class="animate-bounce w-2 h-2 bg-gray-400 rounded-full" style="animation-delay: 0.3s"></span>
        </div>
    `;
    chatMessages.appendChild(loadingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    try {
        // Panggil API Backend dengan keys yang SESUAI dengan Pydantic schemas.py
        const apiRes = await fetch('https://devastatek-chatbot-astatek.hf.space/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                message: msg,              // <-- Sesuaikan dengan 'message' di Pydantic
                domain: selectedDomain,    // <-- Sesuaikan dengan 'domain' di Pydantic
                user_id: currentUser.id    // <-- 'user_id' sudah sesuai
            })
        });

        if (!apiRes.ok) {
            const errorText = await apiRes.text();
            console.error("Detail Error API:", errorText);
            throw new Error(`Gagal mengambil respon dari AI. Status: ${apiRes.status}`);
        }

        const data = await apiRes.json();
        
        // Backend Anda mengembalikan ChatResponse(reply=reply), jadi gunakan data.reply
        const aiResponse = data.reply || "Pesan diterima namun kosong.";

        // Hapus loading
        document.getElementById(loadingId).remove();
        
        // 3. Tampilkan pesan AI
        appendMessage('ai', aiResponse);
        
    } catch(err) {
        if (document.getElementById(loadingId)) {
            document.getElementById(loadingId).remove();
        }
        appendMessage('ai', "Maaf, sistem AI gagal merespon chat Anda. Cek console browser.");
        console.error("Chat Error:", err);
    }
});

// Fungsi pembantu appendMessage (tetap sama seperti sebelumnya)
function appendMessage(sender, text) {
    const msgDiv = document.createElement('div');
    msgDiv.className = sender === 'user' ? 'flex items-end justify-end gap-3' : 'flex items-start gap-3';
    msgDiv.innerHTML = sender === 'user' ? `
        <div class="bg-blue-600 text-white p-3.5 rounded-2xl rounded-tr-none shadow-sm text-sm max-w-[85%] leading-relaxed">${text}</div>
    ` : `
        <div class="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white shrink-0 text-xs font-bold shadow-sm">AI</div>
        <div class="bg-white p-3.5 rounded-2xl rounded-tl-none shadow-sm border border-gray-100 text-gray-700 text-sm max-w-[85%] leading-relaxed">${text}</div>
    `;
    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}
