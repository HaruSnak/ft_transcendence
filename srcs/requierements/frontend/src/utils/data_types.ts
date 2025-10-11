// src/utils/types.ts

export interface User {
    id: number;
    username: string;
    display_name?: string;
    email?: string;
    avatar_url?: string;
    wins?: number;
    losses?: number;
}

export interface ChatMessage {
    from: string;
    from_display_name?: string;
    to: string;
    text: string;
    timestamp: string;
}

export interface DirectMessage {
    type: 'dm';
    user: string;
    displayName: string;
}

export interface BlockedUser {
    id: number;
    username: string;
}

export interface SocketUser {
    username: string;
    display_name?: string;
}

export interface SocketConnection {
    getCurrentUser(): User | null;
    getSocket(): any; // Socket.IO socket
}

export interface MessageService {
    updateBlockedUsers(blockedUsernames: Set<string>): void;
    hideMessagesFromUser(username: string): void;
    showMessagesFromUser(username: string): void;
    getCurrentChat(): DirectMessage | null;
}

export interface ProfileUpdateData {
    display_name?: string;
    email?: string;
    username?: string;
    password?: string;
}

export interface Friend {
    id: number;
    username: string;
    display_name?: string;
    avatar_url?: string;
    is_online?: boolean;
}

export interface Match {
    id: number;
    player1_username: string;
    player1_display_name?: string;
    player2_username: string;
    player2_display_name?: string;
    winner_username?: string;
    score_player1: number;
    score_player2: number;
    game_mode: string;
    played_at: string;
    tournament_id?: number;
    tournament_name?: string;
}