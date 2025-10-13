// src/page/livechat.ts

import { ChatInterfaceManager } from '../utils/livechat_utils';

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