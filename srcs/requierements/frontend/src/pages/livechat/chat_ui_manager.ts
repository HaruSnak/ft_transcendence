// src/pages/livechat/chatInterface.ts

import { socketService } from '../../services/socket';

export class ChatInterfaceManager {
    private isAuthenticated: boolean = false;

    constructor() {
        this.checkAuthentication();
    }

    private checkAuthentication(): void {
        const token = sessionStorage.getItem('authToken');
        this.isAuthenticated = !!token;

        if (!this.isAuthenticated) {
            this.showAccessDenied();
            return;
        }

        this.initializeChatInterface();
    }

    private showAccessDenied(): void {
        const chatSection = document.getElementById('live-chat');
        if (!chatSection) return;

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
    }

    private initializeChatInterface(): void {
        console.log('💬 Initializing chat interface...');

        this.setupMessageForm();
        this.setupBlockButton();
        this.setupInviteButton();
        this.initializeDMList();
        this.disableChatInput();

        console.log('✅ Chat interface initialized');
    }

    private setupMessageForm(): void {
        const chatForm = document.getElementById('chat_form') as HTMLFormElement;
        const chatInput = document.getElementById('chat_input') as HTMLInputElement;

        if (!chatForm) {
            console.error('❌ Chat form not found');
            return;
        }

        console.log('💬 Chat form found, attaching submit handler');

        chatForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const message = chatInput.value.trim();

            if (message) {
                this.sendMessage(message, chatInput);
            } else {
                console.log('💬 Empty message, not sending');
            }
        });
    }

    private sendMessage(message: string, inputElement: HTMLInputElement): void {
        const currentChat = socketService.getCurrentChat();

        if (currentChat) {
            console.log(`💬 Sending message: "${message}"`);
            socketService.sendMessage(message);
            inputElement.value = '';
            console.log('💬 Message sent and input cleared');
        } else {
            console.log('❌ No chat selected, cannot send message');
            alert('Please select a user to start chatting first.');
        }
    }

    private setupBlockButton(): void {
        const blockButton = document.getElementById('block-btn');
        if (!blockButton) return;

        blockButton.addEventListener('click', () => {
            const currentChat = socketService.getCurrentChat();
            if (!currentChat) return;

            const username = currentChat.user;
            const isCurrentlyBlocked = socketService.isUserBlocked(username);

            if (isCurrentlyBlocked) {
                this.unblockUser(username, blockButton);
            } else {
                this.blockUser(username, blockButton);
            }
        });
    }

    private setupInviteButton(): void {
        const inviteButton = document.getElementById('invite-btn');
        if (!inviteButton) return;

        inviteButton.addEventListener('click', () => {
            const currentChat = socketService.getCurrentChat();
            if (!currentChat) return;

            // Send an invitation message
            const invitationMessage = "Hey! Want to play a game together? 🎮";
            socketService.sendMessage(invitationMessage);
        });
    }

    private blockUser(username: string, button: HTMLElement): void {
        socketService.blockUser(username);
        button.textContent = 'Unblock User';
        button.className = 'btn btn-danger btn-sm';
    }

    private unblockUser(username: string, button: HTMLElement): void {
        socketService.unblockUser(username);
        button.textContent = 'Block User';
        button.className = 'btn btn-ghost btn-sm';
    }

    private initializeDMList(): void {
        const dmList = document.getElementById('dm-list');
        if (dmList) {
            dmList.innerHTML = '<div class="text-muted text-xs">Click on a user to start a DM</div>';
        }
    }

    private disableChatInput(): void {
        const chatInput = document.getElementById('chat_input') as HTMLInputElement;
        const chatSendButton = document.getElementById('chat_send_btn') as HTMLButtonElement;

        if (chatInput) {
            chatInput.disabled = true;
            chatInput.placeholder = 'Select a user to start chatting';
        }

        if (chatSendButton) {
            chatSendButton.disabled = true;
        }
    }
}