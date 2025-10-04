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
    const chatSendBtn = document.getElementById('chat_send_btn') as HTMLButtonElement;

    if (chatForm) {
        console.log('💬 Chat form found, attaching submit handler');
        chatForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const message = chatInput.value.trim();
            if (message) {
                // Import and check if a chat is selected
                import('../socket.js').then(({ sendMessage, getCurrentChat }) => {
                    if (getCurrentChat()) {
                        console.log(`💬 Sending message: "${message}"`);
                        sendMessage(message);
                        chatInput.value = '';
                        console.log('💬 Message sent and input cleared');
                    } else {
                        console.log('❌ No chat selected, cannot send message');
                        alert('Please select a user to start chatting first.');
                    }
                });
            } else {
                console.log('💬 Empty message, not sending');
            }
        });
    } else {
        console.log('❌ Chat form not found');
    }

    // Initially disable chat input since no DM is selected
    if (chatInput) {
        chatInput.disabled = true;
        chatInput.placeholder = 'Select a user to start chatting';
    }
    if (chatSendBtn) {
        chatSendBtn.disabled = true;
    }

    // Initialize block button
    const blockBtn = document.getElementById('block-btn');
    if (blockBtn) {
        blockBtn.addEventListener('click', () => {
            import('../socket.js').then(({ getCurrentChat, blockUser, unblockUser, isUserBlocked }) => {
                const current = getCurrentChat();
                if (current) {
                    if (isUserBlocked(current.user)) {
                        // Débloquer
                        unblockUser(current.user);
                        blockBtn.textContent = 'Block User';
                        blockBtn.className = 'btn btn-ghost btn-sm';
                    } else {
                        // Bloquer
                        blockUser(current.user);
                        blockBtn.textContent = 'Unblock User';
                        blockBtn.className = 'btn btn-danger btn-sm';
                    }
                }
            });
        });
    }

    // Initialize DM list (for now, empty)
    const dmList = document.getElementById('dm-list');
    if (dmList) {
        dmList.innerHTML = '<div class="text-muted text-xs">Click on a user to start a DM</div>';
    }

    console.log('✅ Live chat initialized');
}
