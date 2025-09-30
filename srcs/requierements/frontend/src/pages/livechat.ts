// src/pages/livechat.ts
console.log('💬 Loading livechat.ts...');

export function initLiveChat() {
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

    console.log('✅ Live chat initialized');
}
