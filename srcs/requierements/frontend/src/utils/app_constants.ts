// src/utils/constants.ts

// CRITICAL SECURITY: Must use HTTPS for secure WebSocket (wss://)
// Frontend connects through nginx reverse proxy (port 8443), not directly to services
export const SERVER_URL = 'https://localhost:8443/api/chat';
export const API_BASE_URL = '/api';

export const STORAGE_KEYS = {
    AUTH_TOKEN: 'authToken',
    USER_DATA: 'user',
    PROFILE_USERNAME: 'profileUsername'
} as const;

export const SOCKET_EVENTS = {
    CONNECT: 'connect',
    DISCONNECT: 'disconnect',
    WELCOME: 'welcome',
    MESSAGE: 'message',
    USER_LIST: 'user_list',
    ACK: 'ack',
    REGISTER: 'register',
    JOIN_GAME_REQUEST: 'join_game_request'
} as const;

export const UI_ELEMENTS = {
    USER_LIST: 'user-list',
    DM_LIST: 'dm-list',
    CHAT_MESSAGES: 'chat_messages',
    CHAT_TITLE: 'chat-title',
    CHAT_INPUT: 'chat_input',
    CHAT_SEND_BUTTON: 'chat_send_btn',
    BLOCK_BUTTON: 'block-btn',
    INVITE_BUTTON: 'invite-btn'
} as const;