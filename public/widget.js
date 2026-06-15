// public/widget.js
(function () {
    // 1. AMBIL USER ID DARI SCRIPT TAG YANG DIPASANG KLIEN
    const currentScript = document.currentScript;
    const widgetUserId = currentScript ? currentScript.getAttribute('data-uid') : null;

    if (!widgetUserId) {
        console.warn("Asta Widget: data-uid tidak ditemukan pada tag script.");
    }

    // 2. INJECT CSS KE WEBSITE KLIEN
    const style = document.createElement('style');
    style.innerHTML = `
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        
        /* =========================================================
           CSS VARIABLES (CENTRALIZED DESIGN TOKENS)
           ========================================================= */
        #asta-widget-root {
            /* Palette Warna Utama */
            --asta-primary-dark: #1430ac;
            --asta-primary-base: #1B5CEC; 
            --asta-primary-light: #00B0FF; 
            
            /* Palette Warna Netral */
            --asta-white: #ffffff;
            --asta-text-dark: #1F2937;
            --asta-text-muted: #9CA3AF;
            --asta-text-superlight: #f5f5f5;
            --asta-text-light: #7a7a7a;
            --asta-border: #E5E7EB;
            
            /* Gradients Terpusat */
            --asta-grad-vertical: linear-gradient(180deg, var(--asta-primary-dark) 0%, var(--asta-primary-base) 40%, var(--asta-primary-light) 100%);
            --asta-grad-horizontal: linear-gradient(90deg, var(--asta-primary-dark) 0%, var(--asta-primary-base) 50%, var(--asta-primary-light) 100%);
            --asta-grad-fab: linear-gradient(135deg, var(--asta-primary-base), var(--asta-primary-light));
            
            /* Efek Bayangan (Shadows) */
            --asta-shadow-fab: 0 4px 14px rgba(27, 92, 236, 0.4);
            --asta-shadow-fab-active: 0 2px 8px rgba(27, 92, 236, 0.3);
            --asta-shadow-window: 0 10px 40px rgba(0,0,0,0.15);
            --asta-shadow-msg: 0 1px 2px rgba(0,0,0,0.02);
            --asta-focus-ring: 0 0 0 4px rgba(27,92,236,0.08);

            /* Tipografi */
            --asta-font: 'Plus Jakarta Sans', sans-serif;

            /* Konfigurasi Widget */
            position: fixed;
            bottom: 24px;
            right: 24px;
            z-index: 2147483647;
            font-family: var(--asta-font);
        }

        /* =========================================================
           KOMPONEN WIDGET
           ========================================================= */

        /* Floating Action Button (FAB) */
        #asta-fab {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: var(--asta-grad-fab);
            box-shadow: var(--asta-shadow-fab);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: transform 0.15s ease, box-shadow 0.15s ease;
            border: none;
            z-index: 1; /* TAMBAHKAN INI */
        }
        #asta-fab:hover { transform: translateY(-2px); }
        #asta-fab:active { transform: scale(0.92); box-shadow: var(--asta-shadow-fab-active); }
        #asta-fab svg { width: 28px; height: 28px; fill: var(--asta-white); transition: transform 0.25s ease; }

        /* Kotak Chat (Popup) */
        #asta-chat-window {
            position: absolute;
            bottom: 0; /* SEBELUMNYA: 80px. Diubah jadi 0 agar turun menutupi tombol */
            right: 0;
            width: 380px;
            height: 580px;
            z-index: 10; /* TAMBAHKAN INI: Agar posisi chat di atas tombol toggle */
            background: var(--asta-white);
            border-radius: 20px;
            box-shadow: var(--asta-shadow-window);
            display: flex;
            flex-direction: column;
            opacity: 0;
            
            /* UBAH SEDIKIT ANIMASINYA (Opsional tapi disarankan) */
            transform: scale(0.9) translateY(10px); 
            transform-origin: bottom right; /* Agar animasi pop-up keluar dari arah tombol */
            
            pointer-events: none;
            transition: opacity 0.3s ease, transform 0.3s ease;
            border: none;
        }

        #asta-chat-window.asta-open {
            opacity: 1;
            transform: scale(1) translateY(0); /* Sesuaikan dengan animasi baru */
            pointer-events: all;
        }

        /* Header */
        .asta-header { position: relative; border-top-left-radius: 16px; border-top-right-radius: 16px; display: flex; flex-direction: column; overflow: hidden; }
        .asta-header-top { background: var(--asta-grad-vertical); padding: 22px 24px 20px 24px; display: flex; justify-content: space-between; align-items: center; }
        .asta-header-bottom { background: var(--asta-grad-horizontal); padding: 10px 24px 28px 24px; position: relative; }
        
        .asta-header-info { display: flex; align-items: center; gap: 12px; }
        .asta-avatar-wrapper { position: relative; width: 42px; height: 42px; flex-shrink: 0; }
        .asta-avatar { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; display: block; }
        .asta-online-status { position: absolute; top: 0; right: 0; width: 12px; height: 12px; background: #22c55e; border: 2px solid #fff; border-radius: 50%; }
        .asta-title { font-size: 24px; font-weight: 600; color: #fff; }

        .asta-header-actions { display: flex; align-items: center; gap: 16px; color: var(--asta-white); }
        .asta-header-actions svg { cursor: pointer; opacity: 0.9; transition: opacity 0.2s; }
        .asta-header-actions svg:hover { opacity: 1; }
        .asta-status { color: rgba(255, 255, 255, 0.9); font-size: 14px; font-weight: 500; }
        .asta-wave { position: absolute; bottom: -1px; left: 0; width: 100%; line-height: 0; }
        .asta-wave svg { width: 100%; height: 26px; display: block; }

        /* Area Pesan */
        .asta-messages {
            flex: 1;
            padding: 20px;
            overflow-y: auto;
            background: var(--asta-white);
            display: flex;
            flex-direction: column;
            gap: 16px;
        }

        /* Wrapper Pesan & Waktu */
        .asta-msg-wrapper {
            display: flex;
            flex-direction: column;
            max-width: 82%;
            gap: 4px;
        }
        .asta-msg-wrapper.user {
            align-self: flex-end;
            align-items: flex-end;
        }
        .asta-msg-wrapper.bot {
            align-self: flex-start;
            align-items: flex-start;
        }
        
        /* Teks Waktu */
        .asta-msg-time {
            font-size: 11px;
            color: var(--asta-text-muted);
            margin: 0 4px;
            font-weight: 500;
        }
        
        /* Desain Bubble Chat */
        .asta-msg {
            padding: 12px 16px;
            font-size: 16px;
            line-height: 1.5;
            word-wrap: break-word;
            box-shadow: var(--asta-shadow-msg);
            width: fit-content;
        }
        .asta-msg-bot {
            background: var(--asta-text-superlight);
            color: var(--asta-text-dark);
            border-radius: 20px 20px 20px 4px;
        }
        .asta-msg-user {
            background: var(--asta-grad-vertical);
            color: var(--asta-white);
            border-radius: 20px 20px 4px 20px;
        }

        /* Typing Indicator */
        .asta-typing-wrapper {
            display: none;
            align-self: flex-start;
            border: 1px solid var(--asta-primary-base);
            border-radius: 20px;
            padding: 8px 16px;
            background: var(--asta-white);
            color: var(--asta-primary-base);
            font-size: 16px;
            font-weight: 500;
            align-items: center;
            width: fit-content;
        }
        .asta-typing-wrapper span.asta-text { margin-right: 6px; }
        .asta-dot {
            width: 4px; height: 4px; background: var(--asta-primary-base); border-radius: 50%;
            display: inline-block; margin-left: 3px; animation: asta-blink 1.4s infinite both;
        }
        .asta-dot:nth-child(2) { animation-delay: 0.2s; }
        .asta-dot:nth-child(3) { animation-delay: 0.4s; }
        .asta-dot:nth-child(4) { animation-delay: 0.6s; }
        @keyframes asta-blink { 0%, 80%, 100% { opacity: 0; } 40% { opacity: 1; } }

        /* Area Input & Footer */
        .asta-footer { position: relative; padding: 16px 20px 20px 20px; background: var(--asta-white); border-top: 1px solid rgba(0, 0, 0, 0.06); border-bottom-left-radius: 16px; border-bottom-right-radius: 16px; }
        .asta-input-wrapper { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
        .asta-input { flex: 1; height: 52px; padding: 0 18px; border: 1px solid var(--asta-border); border-radius: 22px; outline: none; font-size: 16px; color: var(--asta-text-dark); background-color: var(--asta-white); margin: 0; box-sizing: border-box; }
        .asta-input::placeholder { color: var(--asta-text-muted); }
        .asta-input:focus { border-color: var(--asta-primary-base); box-shadow: var(--asta-focus-ring); }
        
        .asta-powered { display: flex; align-items: center; justify-content: center; gap: 6px; padding-top: 10px; font-weight: 600; opacity: 90%; font-size: 10px; color: var(--asta-text-light); letter-spacing: 0.5px; }
        .asta-powered img { height: 22px; width: auto; display: block; padding-bottom: 1px; }

        /* Tombol Kirim */
        .asta-send-btn { width: 52px; height: 52px; flex-shrink: 0; border-radius: 50%; border: none; background: var(--asta-grad-vertical); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all .5s ease; }
        .asta-send-btn:hover { transform: scale(1.02); }
        .asta-send-btn svg { width: 22px; height: 22px; fill: var(--asta-white); margin-left: 2px; }
    `;
    document.head.appendChild(style);

    // 3. BANGUN STRUKTUR HTML WIDGET
    const widgetRoot = document.createElement('div');
    widgetRoot.id = 'asta-widget-root';
    widgetRoot.innerHTML = `
        <div id="asta-chat-window">
            
            <div class="asta-header">
                <div class="asta-header-top">
                    <div class="asta-header-info">
                        <div class="asta-avatar-wrapper">
                            <img src="/logochat.png" alt="Support Agent" class="asta-avatar">
                            <span class="asta-online-status"></span>
                        </div>
                        <span class="asta-title">Chat with us</span>
                    </div>
                    <div class="asta-header-actions">
                        <svg class="asta-close-btn" id="asta-close-btn" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                    </div>
                </div>
                <div class="asta-header-bottom">
                    <div class="asta-status">We're always online</div>
                    <div class="asta-wave">
                        <svg viewBox="0 0 340 28" preserveAspectRatio="none">
                            <path fill="#ffffff" transform="translate(340,0) scale(-1,1)" d="M0,28 L0,10 C80,-18 200,25 340,5 L340,36 Z"></path>
                        </svg>
                    </div>
                </div>
            </div>
            
            <div class="asta-messages" id="asta-messages">
                <div class="asta-typing-wrapper" id="asta-typing">
                    <span class="asta-text">thinking</span>
                    <span class="asta-dot"></span>
                    <span class="asta-dot"></span>
                    <span class="asta-dot"></span>
                </div>
            </div>
            
            <div class="asta-footer">
                <div class="asta-input-wrapper">
                    <input type="text" class="asta-input" id="asta-input" placeholder="Type in a message..." autocomplete="off" />
                    <button class="asta-send-btn" id="asta-send-btn">
                        <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12L2.01 3V10L17 12L2.01 14V21Z"/></svg>
                    </button>
                </div>
                <div class="asta-powered">
                    POWERED BY <img src="/astatek_logo.png" alt="Astatek Logo">
                </div>
            </div>
        </div>

        <button id="asta-fab">
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
        </button>
    `;
    document.body.appendChild(widgetRoot);

    const fab = document.getElementById('asta-fab');
    const chatWindow = document.getElementById('asta-chat-window');
    const closeBtn = document.getElementById('asta-close-btn');
    const sendBtn = document.getElementById('asta-send-btn');
    const inputField = document.getElementById('asta-input');
    const messagesArea = document.getElementById('asta-messages');
    const typingIndicator = document.getElementById('asta-typing');
    
    const chatIcon = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>`;
    const closeIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;

    fab.addEventListener('click', () => {
        const isOpen = chatWindow.classList.contains('asta-open');
        if (isOpen) {
            chatWindow.classList.remove('asta-open');
            fab.innerHTML = chatIcon;
        } else {
            chatWindow.classList.add('asta-open');
            fab.innerHTML = closeIcon;
            inputField.focus();
        }
    });
    
    closeBtn.addEventListener('click', () => {
        chatWindow.classList.remove('asta-open');
        fab.innerHTML = chatIcon;
    });

    // --- FUNGSI FORMAT WAKTU ASLI (Misal: 10:30) ---
    function formatTime(date) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    function appendMessage(text, sender) {
        // 1. Buat Wrapper
        const wrapperDiv = document.createElement('div');
        wrapperDiv.classList.add('asta-msg-wrapper', sender);

        // 2. Buat Bubble Pesan
        const msgDiv = document.createElement('div');
        msgDiv.classList.add('asta-msg');
        msgDiv.classList.add(sender === 'user' ? 'asta-msg-user' : 'asta-msg-bot');
        msgDiv.textContent = text;
        
        wrapperDiv.appendChild(msgDiv);

        // 3. Buat Label Waktu & Sembunyikan Waktu Lama (HANYA JIKA BOT)
        if (sender === 'bot') {
            // Sembunyikan waktu di pesan bot sebelumnya
            const existingTimes = document.querySelectorAll('.asta-msg-time');
            existingTimes.forEach(el => {
                el.style.display = 'none';
            });

            // Buat elemen waktu baru
            const timeDiv = document.createElement('div');
            timeDiv.classList.add('asta-msg-time');
            timeDiv.textContent = formatTime(new Date()); 
            
            wrapperDiv.appendChild(timeDiv);
        }

        // Masukkan ke area chat sebelum indikator typing
        messagesArea.insertBefore(wrapperDiv, typingIndicator);
        messagesArea.scrollTop = messagesArea.scrollHeight;
    }

    // Tampilkan pesan sapaan pertama
    appendMessage("👋 Hi! How can I help you today?", 'bot');

    async function sendMessage() {
        const text = inputField.value.trim();
        if (!text) return;

        appendMessage(text, 'user');
        inputField.value = '';
        
        typingIndicator.style.display = 'inline-flex';
        messagesArea.scrollTop = messagesArea.scrollHeight;

        try {
            // const currentDomain = window.location.hostname.replace('www.', '');
            // const currentDomain = "astatek.id";

            const response = await fetch('https://devastatek-chatbot-astatek.hf.space/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    message: text,
                    domain: currentDomain,
                    user_id: widgetUserId
                })
            });

            if (!response.ok) throw new Error("API merespons dengan error.");
            
            const data = await response.json();
            
            typingIndicator.style.display = 'none';
            appendMessage(data.reply || "Maaf, pesan diterima namun kosong.", 'bot');

        } catch (error) {
            console.error("WidgetAI Error:", error);
            typingIndicator.style.display = 'none';
            appendMessage("Maaf, sistem sedang offline atau terjadi gangguan.", 'bot');
        }
    }

    sendBtn.addEventListener('click', sendMessage);
    inputField.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            sendMessage();
        }
    });

})();