// src/services/tournament_ping_service.ts

/**
 * Tournament Ping Service - Phantom functions for future implementation
 * These functions are prepared but not currently used in the application.
 * Pings are integrated with the livechat system instead of browser notifications.
 * They will be activated when remote tournament functionality is implemented.
 */

export class TournamentPingService {
    private static isEnabled: boolean = false;
    private static currentTournamentId: string | null = null;

    /**
     * Enable ping notifications for a specific tournament
     * @param tournamentId - The ID of the tournament to monitor
     */
    static enableTournamentPings(tournamentId: string): void {
        console.log(`[TournamentPing] Enabling pings for tournament: ${tournamentId}`);
        this.isEnabled = true;
        this.currentTournamentId = tournamentId;
        // TODO: Register with socket service for ping events
        // TODO: Request notification permissions if needed
    }

    /**
     * Disable ping notifications
     */
    static disableTournamentPings(): void {
        console.log('[TournamentPing] Disabling pings');
        this.isEnabled = false;
        this.currentTournamentId = null;
        // TODO: Unregister from socket service
        // TODO: Clear any pending notifications
    }

    /**
     * Send a ping to a specific user via livechat DM
     * @param toUserId - The user ID to ping
     * @param tournamentId - The tournament ID for context
     */
    static sendPing(toUserId: string, tournamentId: string): void {
        if (!this.isEnabled || this.currentTournamentId !== tournamentId) {
            console.log('[TournamentPing] Pings not enabled for this tournament');
            return;
        }

        console.log(`[TournamentPing] Sending ping to user ${toUserId} for tournament ${tournamentId}`);
        // TODO: Send ping via livechat as a system DM
        // Instead of browser notification, send a direct message in chat
        // Message format: "🏓 Tournament Ping: It's your turn in tournament ${tournamentId}!"
    }

    /**
     * Handle incoming ping notification via livechat
     * @param fromUserId - The user who sent the ping (system)
     * @param tournamentId - The tournament ID
     * @param message - The ping message
     */
    static receivePing(fromUserId: string, tournamentId: string, message: string): void {
        if (!this.isEnabled || this.currentTournamentId !== tournamentId) {
            console.log('[TournamentPing] Ignoring ping - not enabled for this tournament');
            return;
        }

        console.log(`[TournamentPing] Received ping from ${fromUserId} for tournament ${tournamentId}: ${message}`);
        // TODO: Display ping as a highlighted message in livechat
        // TODO: Add visual indicator (red dot, special styling)
        // TODO: Play sound alert
        // TODO: Auto-scroll to show the ping message
        // TODO: Mark as unread if chat not active
    }

    /**
     * Check if pings are enabled for the current user
     */
    static isPingsEnabled(): boolean {
        return this.isEnabled;
    }

    /**
     * Get the current tournament ID being monitored
     */
    static getCurrentTournamentId(): string | null {
        return this.currentTournamentId;
    }

    /**
     * Request notification permissions from the browser
     */
    static async requestNotificationPermission(): Promise<boolean> {
        if (!('Notification' in window)) {
            console.log('[TournamentPing] Notifications not supported');
            return false;
        }

        if (Notification.permission === 'granted') {
            return true;
        }

        if (Notification.permission === 'denied') {
            console.log('[TournamentPing] Notification permission denied');
            return false;
        }

        const permission = await Notification.requestPermission();
        console.log(`[TournamentPing] Notification permission: ${permission}`);
        return permission === 'granted';
    }

    /**
     * Show a ping message in the livechat interface
     * @param message - The ping message to display
     * @param tournamentId - The tournament ID
     */
    static showPingInChat(message: string, tournamentId: string): void {
        // TODO: Integrate with chat_messages_manager.ts
        // Add a system message to the current chat or create a tournament DM
        // Use special styling for ping messages (red background, bold, etc.)
        console.log(`[TournamentPing] Showing ping in chat: ${message} for tournament ${tournamentId}`);
    }

    /**
     * Create a tournament notification DM
     * @param toUserId - Target user
     * @param tournamentId - Tournament ID
     * @param message - Ping message
     */
    static createTournamentDM(toUserId: string, tournamentId: string, message: string): void {
        // TODO: Use message service to create/send DM
        // Check if tournament DM already exists, otherwise create one
        // Send the ping message as a system message
        console.log(`[TournamentPing] Creating tournament DM to ${toUserId}: ${message}`);
    }

    /**
     * Play a sound notification
     */
    static playPingSound(): void {
        // TODO: Implement sound playback
        // Use Web Audio API or HTML5 audio
        console.log('[TournamentPing] Playing ping sound');
    }

    /**
     * Trigger device vibration if supported
     */
    static vibrateDevice(): void {
        if ('vibrate' in navigator) {
            navigator.vibrate([200, 100, 200]); // Double vibration pattern
        }
    }
}