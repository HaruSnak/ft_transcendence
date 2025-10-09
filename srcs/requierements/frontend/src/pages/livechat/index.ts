// src/pages/livechat/index.ts

import { ChatInterfaceManager } from './chat_ui_manager';

let chatInterfaceManager: ChatInterfaceManager | null = null;

export function initLiveChat(): void {
    // Check if user is logged in
    const authToken = sessionStorage.getItem('authToken');
    if (!authToken) {
        window.location.hash = 'login';
        return;
    }

    if (!chatInterfaceManager) {
        chatInterfaceManager = new ChatInterfaceManager();
    }
}