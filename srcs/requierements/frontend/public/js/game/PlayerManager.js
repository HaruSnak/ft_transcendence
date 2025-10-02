import { userApiService } from './UserAPIService.js';
export class PlayerManager {
    constructor() {
        this.players = [];
        this.checkIsPlyConnected = false;
        this.userApiService = new userApiService();
    }
    async initDataPlayer(type, username, password) {
        try {
            if (this.isUsernameTaken(username) || username.toLowerCase().includes('bot')) {
                console.log("Username already exists!");
                return (false);
            }
            if (type === 'Guest') {
                return this.createGuestPlayer(username);
            }
            else if (type === 'User') {
                return await this.createUserPlayer(username, password);
            }
        }
        catch (error) {
            console.log(`Initialization of player data failed: ${username}`);
            return (false);
        }
        return (false);
    }
    createGuestPlayer(username) {
        const guestPlayer = {
            userId: `temp_${Date.now()}_${Math.random()}`,
            displayName: username,
            type: 'Guest',
            isAuthenticated: false,
            tournamentStats: { score: 0 }
        };
        this.players.push(guestPlayer);
        return (true);
    }
    async createUserPlayer(username, password) {
        const plyData = await this.userApiService.getUser(username, password);
        const userPlayer = {
            userId: plyData.user.id,
            displayName: plyData.user.display_name,
            type: 'User',
            username: plyData.user.username,
            isAuthenticated: true,
            tournamentStats: { score: 0 }
        };
        this.players.push(userPlayer);
        return (true);
    }
    async isPlayerConnected() {
        if (this.checkIsPlyConnected)
            return (null);
        const isConnected = await this.userApiService.getConnectedPly();
        if (!isConnected) {
            console.log('Pas de compte déjà connecté');
            return (null);
        }
        if (isConnected.successful !== false) {
            const connectedPlayer = {
                userId: isConnected.user.id,
                displayName: isConnected.user.display_name,
                type: 'User',
                username: isConnected.user.username,
                isAuthenticated: true,
                tournamentStats: { score: 0 }
            };
            this.checkIsPlyConnected = true;
            this.players.push(connectedPlayer);
            return (true);
        }
        return (null);
    }
    isUsernameTaken(username) {
        return (this.players.some(player => (player.displayName === username && player.type === 'Guest') ||
            (player.username === username && player.type === 'User')));
    }
    getNbrAllUsers() {
        return (this.players.length);
    }
    resetScore(player1, player2) {
        player1.tournamentStats.score = 0;
        player2.tournamentStats.score = 0;
    }
    addMatchHistory(player1, player2, winner, gameType) {
        const matchKey = `${player1.type}-${player2.type}`;
        switch (matchKey) {
            case 'Guest-Guest':
                console.log('Guest vs Guest match - no history saved');
                break;
            case 'User-User':
                this.userApiService.saveUserVSUser(player1, player2, winner, gameType);
                break;
            case 'User-Guest':
                this.userApiService.saveUserVSGuest(player1, player2, winner, gameType);
                break;
            case 'Guest-User':
                this.userApiService.saveUserVSGuest(player2, player1, winner, gameType);
                break;
            default:
                console.error(`Unexpected match combination: ${matchKey}`);
                break;
        }
        this.resetScore(player1, player2);
    }
    getPlayers() {
        return ([...this.players]);
    }
    clearPlayers() {
        this.players = [];
        this.checkIsPlyConnected = false;
    }
}
