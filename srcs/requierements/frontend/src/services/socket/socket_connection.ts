// src/services/socket/connection.ts

import { io, Socket } from 'socket.io-client';
import { User } from '../../utils/data_types';
import { SERVER_URL, SOCKET_EVENTS, STORAGE_KEYS } from '../../utils/app_constants';

// classe qui gere la connexion Socket.IO : connexion au serveur, enregistrement de l'utilisateur, gestion des evenements de base (connect/disconnect)
export class SocketConnectionService {
    private socket: Socket | null = null;
    private currentUser: User | null = null;

    constructor() {
        this.loadCurrentUser();
    }

    // ========================= CHARGEMENT DE L'UTILISATEUR =========================
    // 1. recupere et load le user avec son token et ses user data
    private loadCurrentUser(): void {
        const token = sessionStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
        const userData = sessionStorage.getItem(STORAGE_KEYS.USER_DATA);

        if (token && userData) {
            // sert a convertir la string stockee en objet User
            this.currentUser = JSON.parse(userData);
        }
    }

    // ========================= CONNEXION SOCKET.IO =========================
    // 2. connexion avec socket.io (bi-directionnel) et au cas ou le server bloque le websocket, utilise polling (HTTP)
    public connect(): Socket {
        console.log('Establishing Socket.IO connection...');

        this.socket = io(SERVER_URL, {
            transports: ['websocket', 'polling']
        });

        this.setupEventListeners();
        return this.socket;
    }

    // ========================= GESTION DES EVENEMENTS =========================
    // met en place les ecouteurs pour les evenements de base : connexion, deconnexion, acknowledgment
    private setupEventListeners(): void {
        if (!this.socket) return;

        this.socket.on(SOCKET_EVENTS.CONNECT, () => {
            console.log('Socket.IO connected successfully');
            this.registerUser();
        });

        this.socket.on(SOCKET_EVENTS.DISCONNECT, () => {
            console.log('Socket.IO disconnected');
        });

        this.socket.on(SOCKET_EVENTS.ACK, (data) => {
            console.log('Acknowledgment received:', data);
        });
    }

    // ========================= ENREGISTREMENT UTILISATEUR =========================
    // enregistre l'utilisateur connecte aupres du serveur socket avec son username et display_name
    private registerUser(): void {
        if (this.socket && this.currentUser) {
            this.socket.emit(SOCKET_EVENTS.REGISTER, {
                username: this.currentUser.username,
                display_name: this.currentUser.display_name || this.currentUser.username
            });
            console.log('User registered on socket:', this.currentUser.username);
        }
    }

    // ========================= GETTERS ET SETTERS =========================
    // retourne l'instance socket actuelle
    public getSocket(): Socket | null {
        return this.socket;
    }

    // retourne l'utilisateur actuellement connecte
    public getCurrentUser(): User | null {
        return this.currentUser;
    }

    // met a jour l'utilisateur actuel et le sauvegarde en sessionStorage, puis le re-enregistre sur le socket
    public updateCurrentUser(user: User): void {
        this.currentUser = user;
        sessionStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
        this.registerUser();
    }

    // ========================= DECONNEXION =========================
    // deconnecte proprement le socket et nettoie la reference
    public disconnect(): void {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }
}