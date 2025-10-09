// src/pages/livechat/index.ts

import { ChatInterfaceManager } from './chat_ui_manager';

let chatInterfaceManager: ChatInterfaceManager | null = null;

export function initLiveChat(): void {
    console.log('💬 Loading live chat module...');

    // Check if user is logged in
    const authToken = sessionStorage.getItem('authToken');
    if (!authToken) {
        console.log('🔒 Access denied to live chat, redirecting to login');
        window.location.hash = 'login';
        return;
    }

    if (!chatInterfaceManager) {
        chatInterfaceManager = new ChatInterfaceManager();
    }
}