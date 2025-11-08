// src/services/tournament_ping_service.ts

import { socketService } from './socket';

// Service de ping pour les tournois - envoie des notifications via livechat
// gere l'activation/desactivation des pings et l'envoi de messages aux joueurs
export class TournamentPingService {
    private static isEnabled: boolean = false;
    private static currentTournamentId: string | null = null;

    // ========================= GESTION DE L'ETAT =========================
    // active les notifications de ping pour un tournoi specifique
    static enableTournamentPings(tournamentId: string): void {
        this.isEnabled = true;
        this.currentTournamentId = tournamentId;
    }

    // desactive les notifications de ping
    static disableTournamentPings(): void {
        this.isEnabled = false;
        this.currentTournamentId = null;
    }

    // ========================= ENVOI DE PINGS =========================
    // envoie un ping a un joueur specifique via livechat
    static sendPing(toUserId: string, tournamentId: string): void {
        if (!this.isEnabled || this.currentTournamentId !== tournamentId) {
            return;
        }

        const pingMessage = `Tournament Ping: It's your turn in tournament!`;
        this.sendMessageToUser(toUserId, pingMessage);
    }

    // envoie un ping a plusieurs joueurs (pour les matchs joueur vs joueur)
    static sendPingToMultiple(toUserIds: string[], tournamentId: string): void {
        if (!this.isEnabled || this.currentTournamentId !== tournamentId) {
            return;
        }

        const pingMessage = `Tournament Ping: It's your turn in tournament!`;
        toUserIds.forEach(userId => {
            this.sendMessageToUser(userId, pingMessage);
        });
    }

    // ========================= COMMUNICATION AVEC LE SOCKET =========================
    // envoie un message prive a un utilisateur via le service socket
    private static sendMessageToUser(toUserId: string, message: string): void {
        socketService.sendDirectMessage(toUserId, message);
    }

    // gere la reception d'un ping (pour extension future si besoin)
    static receivePing(_fromUserId: string, tournamentId: string, _message: string): void {
        if (!this.isEnabled || this.currentTournamentId !== tournamentId) {
            return;
        }
        // traitement supplementaire si necessaire
    }

    // ========================= GETTERS =========================
    // verifie si les pings sont actives
    static isPingsEnabled(): boolean {
        return this.isEnabled;
    }

    // retourne l'ID du tournoi actuellement suivi
    static getCurrentTournamentId(): string | null {
        return this.currentTournamentId;
    }
}