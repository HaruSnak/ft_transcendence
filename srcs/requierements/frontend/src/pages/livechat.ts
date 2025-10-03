// src/pages/livechat.ts
console.log('💬 Loading livechat.ts...');

export function initLiveChat() {
    const token = sessionStorage.getItem('authToken');
    const chatSection = document.getElementById('live-chat');
    if (!token && chatSection) {
        chatSection.innerHTML = `
            <div class="container">
                <div class="card text-center" style="max-width: 400px; margin: 0 auto;">
                    <div class="text-xl mb-lg">🔒 Access denied</div>
                    <button id="livechat-login-btn" class="btn btn-primary">Login</button>
                </div>
            </div>
        `;
        document.getElementById('livechat-login-btn')?.addEventListener('click', () => {
            window.location.hash = 'login';
        });
        return;
    }

    console.log('💬 Initializing live chat...');

    // Initialize chat form
    const chatForm = document.getElementById('chat_form') as HTMLFormElement;
    const chatInput = document.getElementById('chat_input') as HTMLInputElement;
    const generalBtn = document.getElementById('btn-general');

    if (chatForm) {
        console.log('💬 Chat form found, attaching submit handler');
        chatForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const message = chatInput.value.trim();
            if (message) {
                console.log(`💬 Sending message: "${message}"`);
                // Import sendMessage dynamically to avoid circular dependency
                import('../socket.js').then(({ sendMessage }) => {
                    sendMessage(message);
                    chatInput.value = '';
                    console.log('💬 Message sent and input cleared');
                });
            } else {
                console.log('💬 Empty message, not sending');
            }
        });
    } else {
        console.log('❌ Chat form not found');
    }

    if (generalBtn) {
        console.log('💬 General button found, attaching click handler');
        generalBtn.addEventListener('click', () => {
            console.log('💬 General button clicked');
            // Import joinGeneral dynamically
            import('../socket.js').then(({ joinGeneral }) => {
                joinGeneral();
            });
        });
    } else {
        console.log('❌ General button not found');
    }

    // Initialize DM list (for now, empty)
    const dmList = document.getElementById('dm-list');
    if (dmList) {
        dmList.innerHTML = '<div class="text-muted text-xs">No active DMs</div>';
    }

    console.log('✅ Live chat initialized');
}
