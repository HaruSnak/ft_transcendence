// src/services/socket/connection.ts

import { io, Socket } from 'socket.io-client';
import { User } from '../../utils/data_types';
import { SERVER_URL, SOCKET_EVENTS, STORAGE_KEYS } from '../../utils/app_constants';

export class SocketConnectionService {
    private socket: Socket | null = null;
    private currentUser: User | null = null;

    constructor() {
        this.loadCurrentUser();
    }

    private loadCurrentUser(): void {
        const token = sessionStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
        const userData = sessionStorage.getItem(STORAGE_KEYS.USER_DATA);

        if (token && userData) {
            this.currentUser = JSON.parse(userData);
        }
    }

    public connect(): Socket {
        console.log('🔌 Establishing Socket.IO connection...');

        this.socket = io(SERVER_URL, {
            transports: ['websocket', 'polling']
        });

        this.setupEventListeners();
        return this.socket;
    }

    private setupEventListeners(): void {
        if (!this.socket) return;

        this.socket.on(SOCKET_EVENTS.CONNECT, () => {
            console.log('✅ Socket.IO connected successfully');
            this.registerUser();
        });

        this.socket.on(SOCKET_EVENTS.DISCONNECT, () => {
            console.log('❌ Socket.IO disconnected');
        });

        this.socket.on(SOCKET_EVENTS.WELCOME, (data) => {
            console.log('👋 Welcome message received:', data.message);
        });

        this.socket.on(SOCKET_EVENTS.ACK, (data) => {
            console.log('✅ Acknowledgment received:', data);
        });
    }

    private registerUser(): void {
        if (this.socket && this.currentUser) {
            this.socket.emit(SOCKET_EVENTS.REGISTER, {
                username: this.currentUser.username,
                display_name: this.currentUser.display_name || this.currentUser.username
            });
            console.log('✅ User registered on socket:', this.currentUser.username);
        }
    }

    public getSocket(): Socket | null {
        return this.socket;
    }

    public getCurrentUser(): User | null {
        return this.currentUser;
    }

    public updateCurrentUser(user: User): void {
        this.currentUser = user;
        sessionStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
        this.registerUser();
    }

    public disconnect(): void {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }
}