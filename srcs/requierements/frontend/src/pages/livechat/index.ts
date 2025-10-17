// src/pages/livechat/index.ts

import { LivechatManager } from './livechat';

let chatInterfaceManager: LivechatManager | null = null;

export function initLiveChat(): void {
    // Check if user is logged in
    const authToken = sessionStorage.getItem('authToken');
    if (!authToken) {
        window.location.hash = 'login';
        return;
    }

    if (!chatInterfaceManager) {
        chatInterfaceManager = new LivechatManager();
    }
}