// src/pages/livechat/index.ts

import { ChatInterfaceManager } from './chat_ui_manager';

let chatInterfaceManager: ChatInterfaceManager | null = null;

export function initLiveChat(): void {
    console.log('💬 Loading live chat module...');

    if (!chatInterfaceManager) {
        chatInterfaceManager = new ChatInterfaceManager();
    }
}